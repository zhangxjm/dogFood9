package com.fraudguard.service.impl;

import com.fraudguard.dto.RuleResult;
import com.fraudguard.entity.FraudPatternDetection;
import com.fraudguard.entity.RiskAssessment;
import com.fraudguard.entity.Transaction;
import com.fraudguard.entity.UserAccount;
import com.fraudguard.repository.RiskAssessmentRepository;
import com.fraudguard.repository.TransactionRepository;
import com.fraudguard.repository.UserAccountRepository;
import com.fraudguard.service.AuditTrailService;
import com.fraudguard.service.FraudPatternDetectionService;
import com.fraudguard.service.MLScoringService;
import com.fraudguard.service.RiskAssessmentService;
import com.fraudguard.service.RuleEngineService;
import com.fraudguard.service.TraceabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class RiskAssessmentServiceImpl implements RiskAssessmentService {

    private final RuleEngineService ruleEngineService;
    private final MLScoringService mlScoringService;
    private final FraudPatternDetectionService fraudPatternDetectionService;
    private final AuditTrailService auditTrailService;
    private final TraceabilityService traceabilityService;
    private final TransactionRepository transactionRepository;
    private final UserAccountRepository userAccountRepository;
    private final RiskAssessmentRepository riskAssessmentRepository;

    @Value("${fraudguard.risk.high-risk-threshold:80}")
    private BigDecimal highRiskThreshold;

    @Value("${fraudguard.risk.medium-risk-threshold:50}")
    private BigDecimal mediumRiskThreshold;

    private static final BigDecimal PATTERN_DETECTION_WEIGHT = new BigDecimal("0.15");

    @Override
    @Transactional
    public Transaction assessRisk(Transaction transaction) {
        long startTime = System.currentTimeMillis();
        String traceId = auditTrailService.generateTraceId();

        traceabilityService.appendDecisionStep(transaction.getTransactionId(),
            "风险评估开始", "PENDING", "交易进入风控评估流程");

        UserAccount userAccount = userAccountRepository.findByUserId(transaction.getUserId()).orElse(null);

        auditTrailService.logAction(traceId, transaction.getTransactionId(), transaction.getUserId(),
            null, "RISK_ASSESSMENT_START", "开始风险评估", "START",
            transaction.getStatus(), null, "SYSTEM", "风控系统", "SYSTEM",
            transaction.getIpAddress(), traceId);

        List<RuleResult> ruleResults = ruleEngineService.evaluateRules(transaction, userAccount);
        BigDecimal ruleEngineScore = calculateRuleEngineScore(ruleResults);

        traceabilityService.appendDecisionStep(transaction.getTransactionId(),
            "规则引擎评估", "COMPLETED", "规则引擎得分: " + ruleEngineScore);
        for (RuleResult rule : ruleResults) {
            if (rule.isTriggered()) {
                traceabilityService.appendRuleTrigger(transaction.getTransactionId(),
                    rule.getRuleCode(), rule.getRuleName(), "TRIGGERED",
                    rule.getReason() + " (+" + rule.getScore() + "分)");
            }
        }

        BigDecimal mlModelScore = mlScoringService.calculateRiskScore(transaction, userAccount);
        traceabilityService.appendModelInference(transaction.getTransactionId(),
            "ML综合评分模型", "COMPLETED", mlModelScore.toString());

        FraudPatternDetection patternDetection = fraudPatternDetectionService.detectFraudPatterns(
            transaction, userAccount);
        traceabilityService.appendModelInference(transaction.getTransactionId(),
            "盗刷识别模型", patternDetection.getIsStolenCard() ? "HIGH_RISK" : "NORMAL",
            patternDetection.getStolenCardScore().toString());
        traceabilityService.appendModelInference(transaction.getTransactionId(),
            "套现识别模型", patternDetection.getIsCashOut() ? "HIGH_RISK" : "NORMAL",
            patternDetection.getCashOutScore().toString());
        traceabilityService.appendModelInference(transaction.getTransactionId(),
            "虚假交易识别模型", patternDetection.getIsFakeTransaction() ? "HIGH_RISK" : "NORMAL",
            patternDetection.getFakeTransactionScore().toString());

        BigDecimal baseFinalScore = calculateBaseFinalScore(ruleEngineScore, mlModelScore);
        BigDecimal patternBoost = calculatePatternBoost(patternDetection);
        BigDecimal finalScore = baseFinalScore.add(patternBoost).min(new BigDecimal("100"));
        finalScore = finalScore.setScale(2, RoundingMode.HALF_UP);

        String riskLevel = determineRiskLevel(finalScore);
        String decision = makeDecision(finalScore, riskLevel, patternDetection);

        String riskReasons = buildRiskReasons(ruleResults, patternDetection);

        transaction.setRiskScore(finalScore);
        transaction.setRiskLevel(riskLevel);
        transaction.setRiskReasons(riskReasons);
        transaction.setStatus(decision.equals("REJECT") ? "REJECTED" :
            decision.equals("REVIEW") ? "PENDING" : "APPROVED");
        transaction.setProcessedAt(LocalDateTime.now());

        transaction = transactionRepository.save(transaction);

        traceabilityService.finalizeTrace(transaction.getTransactionId(), transaction.getStatus(),
            "RISK_ENGINE", "综合风险评分: " + finalScore + " 分");

        saveRiskAssessment(transaction, ruleResults, ruleEngineScore, mlModelScore,
            finalScore, riskLevel, decision, userAccount, startTime, patternDetection);

        auditTrailService.logAction(traceId, transaction.getTransactionId(), transaction.getUserId(),
            null, "RISK_ASSESSMENT_COMPLETE", "风险评估完成", decision,
            "PENDING", transaction.getStatus(), "SYSTEM", "风控系统", "SYSTEM",
            transaction.getIpAddress(), traceId);

        log.debug("Transaction {} assessed: score={}, level={}, decision={}, fraudType={}",
            transaction.getTransactionId(), finalScore, riskLevel, decision,
            patternDetection.getFraudType());

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

    private BigDecimal calculateBaseFinalScore(BigDecimal ruleScore, BigDecimal mlScore) {
        BigDecimal weightedRule = ruleScore.multiply(new BigDecimal("0.6"));
        BigDecimal weightedMl = mlScore.multiply(new BigDecimal("0.4"));
        return weightedRule.add(weightedMl).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculatePatternBoost(FraudPatternDetection detection) {
        double boost = 0.0;

        if (detection.getIsStolenCard()) {
            boost = Math.max(boost, 25.0);
        } else if (detection.getStolenCardScore().doubleValue() >= 50) {
            boost = Math.max(boost, detection.getStolenCardScore().doubleValue() * 0.1);
        }

        if (detection.getIsCashOut()) {
            boost = Math.max(boost, 20.0);
        } else if (detection.getCashOutScore().doubleValue() >= 50) {
            boost = Math.max(boost, detection.getCashOutScore().doubleValue() * 0.1);
        }

        if (detection.getIsFakeTransaction()) {
            boost = Math.max(boost, 25.0);
        } else if (detection.getFakeTransactionScore().doubleValue() >= 50) {
            boost = Math.max(boost, detection.getFakeTransactionScore().doubleValue() * 0.1);
        }

        if (detection.getIsAccountTakeover()) {
            boost = Math.max(boost, 30.0);
        }

        if (detection.getIsMoneyLaundering()) {
            boost = Math.max(boost, 25.0);
        }

        return BigDecimal.valueOf(boost).setScale(2, RoundingMode.HALF_UP);
    }

    private String buildRiskReasons(List<RuleResult> ruleResults, FraudPatternDetection detection) {
        List<String> reasons = new ArrayList<>();

        for (RuleResult result : ruleResults) {
            if (result.isTriggered()) {
                reasons.add(result.getReason());
            }
        }

        if (detection.getIsStolenCard()) {
            reasons.add("【高风险】疑似盗刷交易");
        }
        if (detection.getIsCashOut()) {
            reasons.add("【高风险】疑似套现交易");
        }
        if (detection.getIsFakeTransaction()) {
            reasons.add("【高风险】疑似虚假交易");
        }
        if (detection.getIsAccountTakeover()) {
            reasons.add("【高风险】疑似账户被盗");
        }
        if (detection.getIsMoneyLaundering()) {
            reasons.add("【高风险】疑似洗钱交易");
        }

        return String.join("; ", reasons);
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

    public String makeDecision(BigDecimal score, String riskLevel, FraudPatternDetection detection) {
        if (detection.getIsAccountTakeover() && detection.getAccountTakeoverScore().doubleValue() >= 80) {
            return "REJECT";
        }

        if (detection.getIsStolenCard() && detection.getStolenCardScore().doubleValue() >= 85) {
            return "REJECT";
        }

        if (detection.getIsMoneyLaundering() && detection.getMoneyLaunderingScore().doubleValue() >= 85) {
            return "REJECT";
        }

        if (score.compareTo(new BigDecimal("85")) >= 0) {
            return "REJECT";
        }

        if (detection.getIsCashOut() && detection.getCashOutScore().doubleValue() >= 80) {
            return "REVIEW";
        }
        if (detection.getIsFakeTransaction() && detection.getFakeTransactionScore().doubleValue() >= 80) {
            return "REVIEW";
        }

        if (score.compareTo(new BigDecimal("60")) >= 0) {
            return "REVIEW";
        }

        return "APPROVE";
    }

    private void saveRiskAssessment(Transaction transaction, List<RuleResult> ruleResults,
                                     BigDecimal ruleEngineScore, BigDecimal mlModelScore,
                                     BigDecimal finalScore, String riskLevel, String decision,
                                     UserAccount userAccount, long startTime,
                                     FraudPatternDetection patternDetection) {
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

        assessment.setPrimaryFraudType(patternDetection.getFraudType());
        assessment.setStolenCardScore(patternDetection.getStolenCardScore());
        assessment.setCashOutScore(patternDetection.getCashOutScore());
        assessment.setFakeTransactionScore(patternDetection.getFakeTransactionScore());

        assessment.setFraudTags(buildFraudTags(patternDetection));
        assessment.setFraudPatternDetails(buildPatternDetails(patternDetection));

        riskAssessmentRepository.save(assessment);
    }

    private String buildFraudTags(FraudPatternDetection detection) {
        List<String> tags = new ArrayList<>();

        if (detection.getIsStolenCard()) {
            tags.add("盗刷嫌疑");
        }
        if (detection.getIsCashOut()) {
            tags.add("套现嫌疑");
        }
        if (detection.getIsFakeTransaction()) {
            tags.add("虚假交易");
        }
        if (detection.getIsAccountTakeover()) {
            tags.add("账户盗用");
        }
        if (detection.getIsMoneyLaundering()) {
            tags.add("洗钱嫌疑");
        }

        return String.join(",", tags);
    }

    private String buildPatternDetails(FraudPatternDetection detection) {
        return String.format(
            "盗刷评分: %.2f, 套现评分: %.2f, 虚假交易评分: %.2f, 账户盗用评分: %.2f, 洗钱评分: %.2f | 证据: %s | %s | %s | %s | %s",
            detection.getStolenCardScore(),
            detection.getCashOutScore(),
            detection.getFakeTransactionScore(),
            detection.getAccountTakeoverScore(),
            detection.getMoneyLaunderingScore(),
            detection.getStolenCardEvidence() != null ? detection.getStolenCardEvidence() : "",
            detection.getCashOutEvidence() != null ? detection.getCashOutEvidence() : "",
            detection.getFakeTransactionEvidence() != null ? detection.getFakeTransactionEvidence() : "",
            detection.getAccountTakeoverEvidence() != null ? detection.getAccountTakeoverEvidence() : "",
            detection.getMoneyLaunderingEvidence() != null ? detection.getMoneyLaunderingEvidence() : ""
        );
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
