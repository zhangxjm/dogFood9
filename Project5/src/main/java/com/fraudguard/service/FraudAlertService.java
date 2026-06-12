package com.fraudguard.service;

import com.fraudguard.entity.FraudAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface FraudAlertService {

    FraudAlert createAlert(String transactionId, String userId, String alertType,
                           String alertLevel, String description, String triggeredRules);

    FraudAlert getAlertById(String alertId);

    FraudAlert getAlertByTransactionId(String transactionId);

    Page<FraudAlert> getAlertsByStatus(String status, Pageable pageable);

    Page<FraudAlert> getAlertsByLevel(String level, Pageable pageable);

    FraudAlert handleAlert(String alertId, String handler, String note, String status);

    List<FraudAlert> getRecentAlerts(int limit);

    Map<String, Object> getAlertStatistics();
}
