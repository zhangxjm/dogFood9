package com.fraudguard.service.impl;

import com.fraudguard.dto.RuleResult;
import com.fraudguard.entity.RiskAssessment;
import com.fraudguard.entity.Transaction;
import com.fraudguard.entity.UserAccount;
import com.fraudguard.repository.RiskAssessmentRepository;
import com.fraudguard.repository.TransactionRepository;
import com.fraudguard.repository.UserAccountRepository;
import com.fraudguard.service.MLScoringService;
import com.fraudguard.service.RiskAssessmentService;
import com.fraudguard.service.RuleEngineService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RiskAssessmentServiceImpl implements RiskAssessmentService {

    private final RuleEngineService ruleEngineService;
    private final MLScoringService mlScoringService;
    private final TransactionRepository transactionRepository;
    private final UserAccountRepository userAccountRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;

    @Value("${fraudguard.risk.high-risk-threshold:80}")
    private BigDecimal highRiskThreshold;

    @Value("${fraudguard.risk.medium-risk-threshold:50}")
    private BigDecimal mediumRiskThreshold;

    @Override
    @Transactional
    public Transaction assessRisk(Transaction transaction) {
        long startTime = System.currentTimeMillis();

        UserAccount userAccount = userAccountRepository.findByUserId(transaction.getUserId()).orElse(null);

        List<RuleResult> ruleResults = ruleEngineService.evaluateRules(transaction, userAccount);

        BigDecimal ruleEngineScore = calculateRuleEngineScore(ruleResults);

        BigDecimal mlModelScore = mlScoringService.calculateRiskScore(transaction, userAccount);

        BigDecimal finalScore = calculateFinalScore(ruleEngineScore, mlModelScore);

        String riskLevel = determineRiskLevel(finalScore);
        String decision = makeDecision(finalScore, riskLevel);

        String riskReasons = ruleEngineService.generateRiskReasons(ruleResults);

        transaction.setRiskScore(finalScore);
        transaction.setRiskLevel(riskLevel);
        transaction.setRiskReasons(riskReasons);
        transaction.setStatus(decision.equals("REJECT") ? "REJECTED" : decision.equals("REVIEW") ? "PENDING" : "APPROVED");
        transaction.setProcessedAt(LocalDateTime.now());

        transaction = transactionRepository.save(transaction);

        saveRiskAssessment(transaction, ruleResults, ruleEngineScore, mlModelScore,
            finalScore, riskLevel, decision, userAccount, startTime);

        log.debug("Transaction {} assessed: score={}, level={}, decision={}",
            transaction.getTransactionId(), finalScore, riskLevel, decision);

        return transaction;
    }

    private BigDecimal calculateRuleEngineScore(List<RuleResult> results) {
        BigDecimal total = BigDecimal.ZERO;
        for (RuleResult result : results) {
            if (result.isTriggered()) {
                total = total.add(result.getScore());
            }
        }
        return total.min(new BigDecimal("100")).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateFinalScore(BigDecimal ruleScore, BigDecimal mlScore) {
        BigDecimal weightedRule = ruleScore.multiply(new BigDecimal("0.6"));
        BigDecimal weightedMl = mlScore.multiply(new BigDecimal("0.4"));
        return weightedRule.add(weightedMl).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public String determineRiskLevel(BigDecimal score) {
        if (score.compareTo(highRiskThreshold) >= 0) {
            return "HIGH";
        } else if (score.compareTo(mediumRiskThreshold) >= 0) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    @Override
    public String makeDecision(BigDecimal score, String riskLevel) {
        if (score.compareTo(new BigDecimal("85")) >= 0) {
            return "REJECT";
        } else if (score.compareTo(new BigDecimal("60")) >= 0) {
            return "REVIEW";
        } else {
            return "APPROVE";
        }
    }

    private void saveRiskAssessment(Transaction transaction, List<RuleResult> ruleResults,
                                     BigDecimal ruleEngineScore, BigDecimal mlModelScore,
                                     BigDecimal finalScore, String riskLevel, String decision,
                                     UserAccount userAccount, long startTime) {
        RiskAssessment assessment = new RiskAssessment();
        assessment.setTransactionId(transaction.getTransactionId());
        assessment.setUserId(transaction.getUserId());
        assessment.setRuleEngineScore(ruleEngineScore);
        assessment.setMlModelScore(mlModelScore);
        assessment.setFinalScore(finalScore);
        assessment.setRiskLevel(riskLevel);
        assessment.setDecision(decision);
        assessment.setDecisionReason(transaction.getRiskReasons());
        assessment.setRuleResults(buildRuleResultsJson(ruleResults));
        assessment.setMlFeatures(mlScoringService.extractFeatures(transaction, userAccount));
        assessment.setProcessingTimeMs(System.currentTimeMillis() - startTime);

        riskAssessmentRepository.save(assessment);
    }

    private String buildRuleResultsJson(List<RuleResult> results) {
        StringBuilder sb = new StringBuilder("[");
        boolean first = true;
        for (RuleResult result : results) {
            if (!first) {
                sb.append(",");
            }
            sb.append("{\"rule\":\"").append(result.getRuleCode()).append("\"")
                .append(",\"name\":\"").append(result.getRuleName()).append("\"")
                .append(",\"triggered\":").append(result.isTriggered())
                .append(",\"score\":").append(result.getScore())
                .append(",\"severity\":\"").append(result.getSeverity()).append("\"")
                .append("}");
            first = false;
        }
        sb.append("]");
        return sb.toString();
    }

    @Override
    public Map<String, Object> getRiskStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("highCount", transactionRepository.countByRiskLevel("HIGH"));
        stats.put("mediumCount", transactionRepository.countByRiskLevel("MEDIUM"));
        stats.put("lowCount", transactionRepository.countByRiskLevel("LOW"));
        stats.put("approvedCount", transactionRepository.countByStatus("APPROVED"));
        stats.put("rejectedCount", transactionRepository.countByStatus("REJECTED"));
        stats.put("pendingCount", transactionRepository.countByStatus("PENDING"));
        stats.put("totalCount", transactionRepository.count());
        return stats;
    }
}
