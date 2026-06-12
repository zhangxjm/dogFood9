package com.fraudguard.service.impl;

import com.fraudguard.entity.FraudAlert;
import com.fraudguard.entity.Transaction;
import com.fraudguard.repository.FraudAlertRepository;
import com.fraudguard.repository.TransactionRepository;
import com.fraudguard.service.RiskAssessmentService;
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
import java.time.LocalTime;
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

    @Override
    @Transactional
    public Transaction createTransaction(Transaction transaction) {
        if (transaction.getTransactionId() == null || transaction.getTransactionId().isEmpty()) {
            transaction.setTransactionId(generateTransactionId());
        }

        transaction.setStatus("PENDING");
        transaction = transactionRepository.save(transaction);

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
        alert.setHandledBy("SYSTEM");
        alert.setHandledAt(LocalDateTime.now());
        alert.setHandleNote(reason);
        fraudAlertRepository.save(alert);

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

        transaction.setStatus("APPROVED");
        transactionRepository.save(transaction);

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

        transaction.setStatus("REJECTED");
        transactionRepository.save(transaction);

        log.info("Transaction {} rejected: {}", transactionId, reason);
        return true;
    }

    private String generateTransactionId() {
        return "TXN" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private String generateAlertId() {
        return "ALT" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
