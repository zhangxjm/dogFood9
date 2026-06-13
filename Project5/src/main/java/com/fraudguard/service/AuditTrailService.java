package com.fraudguard.service;

import com.fraudguard.entity.AuditTrail;
import com.fraudguard.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Map;

public interface AuditTrailService {

    AuditTrail logAction(String traceId, String transactionId, String userId,
                          String alertId, String actionType, String actionDetail,
                          String actionResult, String beforeState, String afterState,
                          String operatorId, String operatorName, String operatorRole,
                          String sourceIp, String requestId);

    List<AuditTrail> getTransactionAudit(String transactionId);

    List<AuditTrail> getUserAudit(String userId);

    List<AuditTrail> getAlertAudit(String alertId);

    Page<AuditTrail> getOperatorAudit(String operatorId, Pageable pageable);

    Page<AuditTrail> getActionsByType(String actionType, Pageable pageable);

    Map<String, Object> getAuditStatistics();

    String generateTraceId();
}
