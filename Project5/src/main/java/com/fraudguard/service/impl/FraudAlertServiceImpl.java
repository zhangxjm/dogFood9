package com.fraudguard.service.impl;

import com.fraudguard.entity.FraudAlert;
import com.fraudguard.repository.FraudAlertRepository;
import com.fraudguard.service.FraudAlertService;
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
public class FraudAlertServiceImpl implements FraudAlertService {

    private final FraudAlertRepository fraudAlertRepository;

    @Override
    @Transactional
    public FraudAlert createAlert(String transactionId, String userId, String alertType,
                                   String alertLevel, String description, String triggeredRules) {
        FraudAlert alert = new FraudAlert();
        alert.setAlertId(generateAlertId());
        alert.setTransactionId(transactionId);
        alert.setUserId(userId);
        alert.setAlertType(alertType);
        alert.setAlertLevel(alertLevel);
        alert.setDescription(description);
        alert.setTriggeredRules(triggeredRules);
        alert.setAlertStatus("PENDING");

        alert = fraudAlertRepository.save(alert);
        log.info("Fraud alert created: {} for transaction {}", alert.getAlertId(), transactionId);
        return alert;
    }

    @Override
    public FraudAlert getAlertById(String alertId) {
        return fraudAlertRepository.findByAlertId(alertId).orElse(null);
    }

    @Override
    public FraudAlert getAlertByTransactionId(String transactionId) {
        return fraudAlertRepository.findByTransactionId(transactionId).orElse(null);
    }

    @Override
    public Page<FraudAlert> getAlertsByStatus(String status, Pageable pageable) {
        return fraudAlertRepository.findByAlertStatusOrderByCreatedAtDesc(status, pageable);
    }

    @Override
    public Page<FraudAlert> getAlertsByLevel(String level, Pageable pageable) {
        return fraudAlertRepository.findByAlertLevelOrderByCreatedAtDesc(level, pageable);
    }

    @Override
    @Transactional
    public FraudAlert handleAlert(String alertId, String handler, String note, String status) {
        FraudAlert alert = getAlertById(alertId);
        if (alert == null) {
            return null;
        }

        alert.setAlertStatus(status);
        alert.setHandledBy(handler);
        alert.setHandledAt(LocalDateTime.now());
        alert.setHandleNote(note);

        alert = fraudAlertRepository.save(alert);
        log.info("Alert {} handled by {} with status {}", alertId, handler, status);
        return alert;
    }

    @Override
    public List<FraudAlert> getRecentAlerts(int limit) {
        return fraudAlertRepository.findTop20ByOrderByCreatedAtDesc()
            .stream()
            .limit(limit)
            .toList();
    }

    @Override
    public Map<String, Object> getAlertStatistics() {
        Map<String, Object> stats = new HashMap<>();

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        stats.put("total", fraudAlertRepository.count());
        stats.put("todayTotal", fraudAlertRepository.countByCreatedAtAfter(startOfDay));
        stats.put("pending", fraudAlertRepository.countByAlertStatus("PENDING"));
        stats.put("handled", fraudAlertRepository.countByAlertStatus("HANDLED"));
        stats.put("dismissed", fraudAlertRepository.countByAlertStatus("DISMISSED"));

        stats.put("critical", fraudAlertRepository.countByAlertLevel("CRITICAL"));
        stats.put("high", fraudAlertRepository.countByAlertLevel("HIGH"));
        stats.put("medium", fraudAlertRepository.countByAlertLevel("MEDIUM"));
        stats.put("low", fraudAlertRepository.countByAlertLevel("LOW"));

        return stats;
    }

    private String generateAlertId() {
        return "ALT" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
