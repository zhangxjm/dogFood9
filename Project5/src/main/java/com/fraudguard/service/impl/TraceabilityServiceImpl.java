package com.fraudguard.service.impl;

import com.fraudguard.entity.TraceabilityRecord;
import com.fraudguard.entity.Transaction;
import com.fraudguard.repository.TraceabilityRecordRepository;
import com.fraudguard.service.TraceabilityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TraceabilityServiceImpl implements TraceabilityService {

    private final TraceabilityRecordRepository traceRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Override
    @Transactional
    public TraceabilityRecord createTraceRecord(Transaction transaction) {
        Optional<TraceabilityRecord> existing = traceRepository.findByTransactionId(transaction.getTransactionId());
        if (existing.isPresent()) {
            log.debug("Trace record already exists for transaction: {}", transaction.getTransactionId());
            return existing.get();
        }

        TraceabilityRecord record = new TraceabilityRecord();
        record.setTransactionId(transaction.getTransactionId());
        record.setUserId(transaction.getUserId());
        record.setCurrentStatus("CREATED");
        record.setCurrentRiskScore(transaction.getRiskScore());
        record.setCurrentRiskLevel(transaction.getRiskLevel());

        StringBuilder traceLog = new StringBuilder();
        traceLog.append("[").append(formatTime(LocalDateTime.now())).append("] ");
        traceLog.append("交易创建 - ID: ").append(transaction.getTransactionId());
        traceLog.append(", 用户: ").append(transaction.getUserId());
        traceLog.append(", 金额: ").append(transaction.getAmount());
        record.setFullTraceLog(traceLog.toString());

        record.setDecisionChain("交易提交 → 进入风控队列");
        record.setRuleTriggerHistory("");
        record.setModelInferenceHistory("");
        record.setRelatedTransactions("");
        record.setRelatedAlerts("");
        record.setEvidenceChain("");
        record.setHasManualIntervention(false);

        record = traceRepository.save(record);
        log.debug("Trace record created for transaction: {}", transaction.getTransactionId());
        return record;
    }

    @Override
    @Transactional
    public TraceabilityRecord updateTraceRecord(Transaction transaction, String action, String detail) {
        TraceabilityRecord record = traceRepository.findByTransactionId(transaction.getTransactionId())
            .orElseGet(() -> createTraceRecord(transaction));

        record.setCurrentStatus(transaction.getStatus());
        record.setCurrentRiskScore(transaction.getRiskScore());
        record.setCurrentRiskLevel(transaction.getRiskLevel());

        appendTraceLog(record, action + " - " + detail);

        return traceRepository.save(record);
    }

    @Override
    @Transactional
    public TraceabilityRecord appendDecisionStep(String transactionId, String step, String result, String reason) {
        TraceabilityRecord record = getOrCreateRecord(transactionId);

        String newChain = (record.getDecisionChain() != null ? record.getDecisionChain() : "")
            + " → " + step + "(" + result + ")";
        if (newChain.startsWith(" → ")) {
            newChain = newChain.substring(3);
        }
        record.setDecisionChain(newChain);

        appendTraceLog(record, "决策步骤: " + step + " → " + result + " (" + reason + ")");

        return traceRepository.save(record);
    }

    @Override
    @Transactional
    public TraceabilityRecord appendRuleTrigger(String transactionId, String ruleCode, String ruleName,
                                                  String result, String detail) {
        TraceabilityRecord record = getOrCreateRecord(transactionId);

        String history = record.getRuleTriggerHistory() != null ? record.getRuleTriggerHistory() : "";
        String newEntry = String.format("[%s] %s(%s) - %s", formatTime(LocalDateTime.now()), ruleCode, result, detail);
        history = history.isEmpty() ? newEntry : history + "\n" + newEntry;
        record.setRuleTriggerHistory(history);

        appendTraceLog(record, "规则触发: " + ruleCode + " → " + result + " - " + detail);

        return traceRepository.save(record);
    }

    @Override
    @Transactional
    public TraceabilityRecord appendModelInference(String transactionId, String modelName,
                                                    String inferenceResult, String score) {
        TraceabilityRecord record = getOrCreateRecord(transactionId);

        String history = record.getModelInferenceHistory() != null ? record.getModelInferenceHistory() : "";
        String newEntry = String.format("[%s] %s → %s (得分: %s)", formatTime(LocalDateTime.now()),
            modelName, inferenceResult, score);
        history = history.isEmpty() ? newEntry : history + "\n" + newEntry;
        record.setModelInferenceHistory(history);

        appendTraceLog(record, "模型推理: " + modelName + " → " + inferenceResult + " (得分: " + score + ")");

        return traceRepository.save(record);
    }

    @Override
    @Transactional
    public TraceabilityRecord addRelatedTransaction(String transactionId, String relatedTxnId, String relation) {
        TraceabilityRecord record = getOrCreateRecord(transactionId);

        String related = record.getRelatedTransactions() != null ? record.getRelatedTransactions() : "";
        String newEntry = relatedTxnId + ":" + relation;
        List<String> items = new ArrayList<>(List.of(related.split(";")));
        if (!items.contains(newEntry) && !related.isEmpty()) {
            related = related + ";" + newEntry;
        } else if (related.isEmpty()) {
            related = newEntry;
        }
        record.setRelatedTransactions(related);

        appendTraceLog(record, "关联交易: " + relatedTxnId + " (" + relation + ")");

        return traceRepository.save(record);
    }

    @Override
    @Transactional
    public TraceabilityRecord addRelatedAlert(String transactionId, String alertId, String relation) {
        TraceabilityRecord record = getOrCreateRecord(transactionId);

        String related = record.getRelatedAlerts() != null ? record.getRelatedAlerts() : "";
        String newEntry = alertId + ":" + relation;
        if (!related.contains(newEntry)) {
            related = related.isEmpty() ? newEntry : related + ";" + newEntry;
        }
        record.setRelatedAlerts(related);

        appendTraceLog(record, "关联告警: " + alertId + " (" + relation + ")");

        return traceRepository.save(record);
    }

    @Override
    @Transactional
    public TraceabilityRecord recordManualIntervention(String transactionId, String operator,
                                                         String action, String reason) {
        TraceabilityRecord record = getOrCreateRecord(transactionId);

        record.setHasManualIntervention(true);
        record.setFinalDecisionMaker(operator);

        appendTraceLog(record, "人工干预: " + operator + " → " + action + " - " + reason);

        String evidence = record.getEvidenceChain() != null ? record.getEvidenceChain() : "";
        String newEvidence = "人工审核 - 操作人: " + operator + ", 操作: " + action + ", 原因: " + reason;
        evidence = evidence.isEmpty() ? newEvidence : evidence + " | " + newEvidence;
        record.setEvidenceChain(evidence);

        return traceRepository.save(record);
    }

    @Override
    @Transactional
    public TraceabilityRecord finalizeTrace(String transactionId, String finalDecision,
                                             String decisionMaker, String reason) {
        TraceabilityRecord record = getOrCreateRecord(transactionId);

        record.setCurrentStatus(finalDecision);
        record.setFinalDecisionMaker(decisionMaker);
        record.setFinalDecisionReason(reason);

        appendTraceLog(record, "最终决策: " + finalDecision + " - 决策方: " + decisionMaker + " - 原因: " + reason);

        String decisionChain = record.getDecisionChain() != null ? record.getDecisionChain() : "";
        decisionChain = decisionChain + " → 最终决策(" + finalDecision + ")";
        record.setDecisionChain(decisionChain);

        return traceRepository.save(record);
    }

    @Override
    public TraceabilityRecord getTraceRecord(String transactionId) {
        return traceRepository.findByTransactionId(transactionId).orElse(null);
    }

    @Override
    public String getFullTraceReport(String transactionId) {
        TraceabilityRecord record = getTraceRecord(transactionId);
        if (record == null) {
            return "未找到该交易的溯源记录";
        }

        StringBuilder report = new StringBuilder();
        report.append("═══════════════════════════════════════════════════════\n");
        report.append("         交 易 溯 源 报 告\n");
        report.append("═══════════════════════════════════════════════════════\n\n");
        report.append("【基本信息】\n");
        report.append("  交易ID: ").append(record.getTransactionId()).append("\n");
        report.append("  用户ID: ").append(record.getUserId()).append("\n");
        report.append("  当前状态: ").append(record.getCurrentStatus()).append("\n");
        report.append("  风险评分: ").append(record.getCurrentRiskScore()).append("\n");
        report.append("  风险等级: ").append(record.getCurrentRiskLevel()).append("\n\n");

        report.append("【决策链路】\n");
        report.append("  ").append(record.getDecisionChain() != null ? record.getDecisionChain() : "无").append("\n\n");

        report.append("【完整追踪日志】\n");
        report.append(record.getFullTraceLog() != null ? record.getFullTraceLog() : "无").append("\n\n");

        report.append("【规则触发历史】\n");
        report.append(record.getRuleTriggerHistory() != null && !record.getRuleTriggerHistory().isEmpty()
            ? record.getRuleTriggerHistory() : "无").append("\n\n");

        report.append("【模型推理历史】\n");
        report.append(record.getModelInferenceHistory() != null && !record.getModelInferenceHistory().isEmpty()
            ? record.getModelInferenceHistory() : "无").append("\n\n");

        report.append("【关联交易】\n");
        report.append(record.getRelatedTransactions() != null && !record.getRelatedTransactions().isEmpty()
            ? record.getRelatedTransactions() : "无").append("\n\n");

        report.append("【关联告警】\n");
        report.append(record.getRelatedAlerts() != null && !record.getRelatedAlerts().isEmpty()
            ? record.getRelatedAlerts() : "无").append("\n\n");

        report.append("【证据链】\n");
        report.append(record.getEvidenceChain() != null && !record.getEvidenceChain().isEmpty()
            ? record.getEvidenceChain() : "无").append("\n\n");

        if (Boolean.TRUE.equals(record.getHasManualIntervention())) {
            report.append("【人工干预记录】\n");
            report.append("  决策人: ").append(record.getFinalDecisionMaker() != null ? record.getFinalDecisionMaker() : "未知").append("\n");
            report.append("  决策原因: ").append(record.getFinalDecisionReason() != null ? record.getFinalDecisionReason() : "无").append("\n\n");
        }

        report.append("═══════════════════════════════════════════════════════\n");
        report.append("      报告生成时间: ").append(formatTime(LocalDateTime.now())).append("\n");
        report.append("═══════════════════════════════════════════════════════\n");

        return report.toString();
    }

    private TraceabilityRecord getOrCreateRecord(String transactionId) {
        return traceRepository.findByTransactionId(transactionId)
            .orElseGet(() -> {
                TraceabilityRecord newRecord = new TraceabilityRecord();
                newRecord.setTransactionId(transactionId);
                newRecord.setUserId("UNKNOWN");
                newRecord.setCurrentStatus("UNKNOWN");
                return traceRepository.save(newRecord);
            });
    }

    private void appendTraceLog(TraceabilityRecord record, String message) {
        String currentLog = record.getFullTraceLog() != null ? record.getFullTraceLog() : "";
        String newLog = "[" + formatTime(LocalDateTime.now()) + "] " + message;
        record.setFullTraceLog(currentLog.isEmpty() ? newLog : currentLog + "\n" + newLog);
    }

    private String formatTime(LocalDateTime time) {
        return time.format(TIME_FORMATTER);
    }
}
