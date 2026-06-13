package com.fraudguard.service.impl;

import com.fraudguard.entity.FraudAlert;
import com.fraudguard.entity.Transaction;
import com.fraudguard.repository.FraudAlertRepository;
import com.fraudguard.repository.TransactionRepository;
import com.fraudguard.service.AuditTrailService;
import com.fraudguard.service.FraudPatternDetectionService;
import com.fraudguard.service.RiskAssessmentService;
import com.fraudguard.service.TraceabilityService;
import com.fraudguard.service.TransactionService;
import com.fraudguard.service.TransactionStreamService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionServiceImpl implements TransactionService {

    private final TransactionRepository transactionRepository;
    private final FraudAlertRepository fraudAlertRepository;
    private final RiskAssessmentService riskAssessmentService;
    private final TransactionStreamService transactionStreamService;
    private final AuditTrailService auditTrailService;
    private final TraceabilityService traceabilityService;
    private final FraudPatternDetectionService fraudPatternDetectionService;

    @Override
    @Transactional
    public Transaction createTransaction(Transaction transaction) {
        if (transaction.getTransactionId() == null || transaction.getTransactionId().isEmpty()) {
            transaction.setTransactionId(generateTransactionId());
        }

        transaction.setStatus("PENDING");
        transaction = transactionRepository.save(transaction);

        traceabilityService.createTraceRecord(transaction);
        traceabilityService.appendDecisionStep(transaction.getTransactionId(),
            "交易提交", "PENDING", "交易已创建并提交至风控队列");

        auditTrailService.logAction(null, transaction.getTransactionId(), transaction.getUserId(),
            null, "TRANSACTION_CREATED", "交易创建", "SUCCESS",
            null, "PENDING", "SYSTEM", "系统", "SYSTEM",
            transaction.getIpAddress(), null);

        transactionStreamService.submitTransaction(transaction);

        log.info("Transaction submitted: {}", transaction.getTransactionId());
        return transaction;
    }

    @Override
    public Transaction getTransactionById(String transactionId) {
        return transactionRepository.findByTransactionId(transactionId).orElse(null);
    }

    @Override
    public Page<Transaction> getTransactions(Pageable pageable) {
        return transactionRepository.findAll(pageable);
    }

    @Override
    public Page<Transaction> getTransactionsByUserId(String userId, Pageable pageable) {
        return transactionRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    @Override
    public Page<Transaction> getTransactionsByStatus(String status, Pageable pageable) {
        return transactionRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
    }

    @Override
    public Page<Transaction> getTransactionsByRiskLevel(String riskLevel, Pageable pageable) {
        return transactionRepository.findByRiskLevelOrderByCreatedAtDesc(riskLevel, pageable);
    }

    @Override
    public List<Transaction> getRecentTransactions(int limit) {
        return transactionRepository.findTop100ByOrderByCreatedAtDesc()
            .stream()
            .limit(limit)
            .toList();
    }

    @Override
    public Map<String, Object> getTransactionStatistics() {
        Map<String, Object> stats = new HashMap<>();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        stats.put("total", transactionRepository.count());
        stats.put("todayTotal", transactionRepository.countByCreatedAtAfter(startOfDay));
        stats.put("approved", transactionRepository.countByStatus("APPROVED"));
        stats.put("rejected", transactionRepository.countByStatus("REJECTED"));
        stats.put("pending", transactionRepository.countByStatus("PENDING"));

        stats.put("highRisk", transactionRepository.countByRiskLevel("HIGH"));
        stats.put("mediumRisk", transactionRepository.countByRiskLevel("MEDIUM"));
        stats.put("lowRisk", transactionRepository.countByRiskLevel("LOW"));

        stats.put("streamQueueSize", transactionStreamService.getQueueSize());
        stats.put("streamProcessed", transactionStreamService.getProcessedCount());
        stats.put("streamThroughput", String.format("%.2f", transactionStreamService.getThroughput()));

        return stats;
    }

    @Override
    @Transactional
    public boolean interceptTransaction(String transactionId, String reason) {
        Transaction transaction = getTransactionById(transactionId);
        if (transaction == null) {
            return false;
        }

        String beforeState = transaction.getStatus();
        transaction.setStatus("REJECTED");
        transactionRepository.save(transaction);

        FraudAlert alert = new FraudAlert();
        alert.setAlertId(generateAlertId());
        alert.setTransactionId(transactionId);
        alert.setUserId(transaction.getUserId());
        alert.setAlertType("MANUAL_INTERCEPT");
        alert.setAlertLevel("HIGH");
        alert.setDescription("人工拦截: " + reason);
        alert.setAlertStatus("HANDLED");
        alert.setHandledBy("ADMIN");
        alert.setHandledAt(LocalDateTime.now());
        alert.setHandleNote(reason);
        fraudAlertRepository.save(alert);

        traceabilityService.recordManualIntervention(transactionId, "ADMIN", "INTERCEPT", reason);
        traceabilityService.finalizeTrace(transactionId, "REJECTED", "MANUAL", "人工拦截: " + reason);

        auditTrailService.logAction(null, transactionId, transaction.getUserId(),
            alert.getAlertId(), "MANUAL_INTERCEPT", "人工拦截交易", "SUCCESS",
            beforeState, "REJECTED", "ADMIN", "管理员", "OPERATOR",
            null, null);

        log.info("Transaction {} intercepted: {}", transactionId, reason);
        return true;
    }

    @Override
    @Transactional
    public boolean approveTransaction(String transactionId) {
        Transaction transaction = getTransactionById(transactionId);
        if (transaction == null) {
            return false;
        }

        String beforeState = transaction.getStatus();
        transaction.setStatus("APPROVED");
        transactionRepository.save(transaction);

        traceabilityService.recordManualIntervention(transactionId, "ADMIN", "APPROVE", "人工审核通过");
        traceabilityService.finalizeTrace(transactionId, "APPROVED", "MANUAL", "人工审核通过");

        auditTrailService.logAction(null, transactionId, transaction.getUserId(),
            null, "MANUAL_APPROVE", "人工审核通过", "SUCCESS",
            beforeState, "APPROVED", "ADMIN", "管理员", "OPERATOR",
            null, null);

        log.info("Transaction {} approved", transactionId);
        return true;
    }

    @Override
    @Transactional
    public boolean rejectTransaction(String transactionId, String reason) {
        Transaction transaction = getTransactionById(transactionId);
        if (transaction == null) {
            return false;
        }

        String beforeState = transaction.getStatus();
        transaction.setStatus("REJECTED");
        transactionRepository.save(transaction);

        traceabilityService.recordManualIntervention(transactionId, "ADMIN", "REJECT", reason);
        traceabilityService.finalizeTrace(transactionId, "REJECTED", "MANUAL", "人工拒绝: " + reason);

        auditTrailService.logAction(null, transactionId, transaction.getUserId(),
            null, "MANUAL_REJECT", "人工拒绝交易", "SUCCESS",
            beforeState, "REJECTED", "ADMIN", "管理员", "OPERATOR",
            null, null);

        log.info("Transaction {} rejected: {}", transactionId, reason);
        return true;
    }

    public Map<String, Object> getTransactionDetail(String transactionId) {
        Map<String, Object> detail = new HashMap<>();

        Transaction transaction = getTransactionById(transactionId);
        if (transaction == null) {
            return null;
        }

        detail.put("transaction", transaction);

        var detection = fraudPatternDetectionService.getDetectionByTransaction(transactionId);
        if (detection != null) {
            detail.put("fraudPatternDetection", detection);
        }

        var traceRecord = traceabilityService.getTraceRecord(transactionId);
        if (traceRecord != null) {
            detail.put("traceability", traceRecord);
        }

        var auditTrails = auditTrailService.getTransactionAudit(transactionId);
        detail.put("auditTrails", auditTrails);

        return detail;
    }

    private String generateTransactionId() {
        return "TXN" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateAlertId() {
        return "ALT" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
