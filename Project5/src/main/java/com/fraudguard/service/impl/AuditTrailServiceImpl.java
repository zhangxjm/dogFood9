package com.fraudguard.service.impl;

import com.fraudguard.entity.AuditTrail;
import com.fraudguard.repository.AuditTrailRepository;
import com.fraudguard.service.AuditTrailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditTrailServiceImpl implements AuditTrailService {

    private final AuditTrailRepository auditTrailRepository;

    @Override
    @Transactional
    public AuditTrail logAction(String traceId, String transactionId, String userId,
                                  String alertId, String actionType, String actionDetail,
                                  String actionResult, String beforeState, String afterState,
                                  String operatorId, String operatorName, String operatorRole,
                                  String sourceIp, String requestId) {
        AuditTrail audit = new AuditTrail();
        audit.setTraceId(traceId != null ? traceId : generateTraceId());
        audit.setTransactionId(transactionId);
        audit.setUserId(userId);
        audit.setAlertId(alertId);
        audit.setActionType(actionType);
        audit.setActionDetail(actionDetail);
        audit.setActionResult(actionResult);
        audit.setBeforeState(beforeState);
        audit.setAfterState(afterState);
        audit.setOperatorId(operatorId);
        audit.setOperatorName(operatorName);
        audit.setOperatorRole(operatorRole);
        audit.setSourceIp(sourceIp);
        audit.setRequestId(requestId);
        audit.setActionTime(LocalDateTime.now());

        audit = auditTrailRepository.save(audit);
        log.debug("Audit trail logged: type={}, txn={}", actionType, transactionId);
        return audit;
    }

    @Override
    public List<AuditTrail> getTransactionAudit(String transactionId) {
        return auditTrailRepository.findByTransactionIdOrderByActionTimeDesc(transactionId);
    }

    @Override
    public List<AuditTrail> getUserAudit(String userId) {
        return auditTrailRepository.findByUserIdOrderByActionTimeDesc(userId);
    }

    @Override
    public List<AuditTrail> getAlertAudit(String alertId) {
        return auditTrailRepository.findByAlertIdOrderByActionTimeDesc(alertId);
    }

    @Override
    public Page<AuditTrail> getOperatorAudit(String operatorId, Pageable pageable) {
        return auditTrailRepository.findByOperatorIdOrderByActionTimeDesc(operatorId, pageable);
    }

    @Override
    public Page<AuditTrail> getActionsByType(String actionType, Pageable pageable) {
        return auditTrailRepository.findByActionTypeOrderByActionTimeDesc(actionType, pageable);
    }

    @Override
    public Map<String, Object> getAuditStatistics() {
        Map<String, Object> stats = new HashMap<>();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        stats.put("totalRecords", auditTrailRepository.count());
        stats.put("todayRecords", 0L);

        List<Object[]> actionTypeCounts = auditTrailRepository.countByActionTypeAndActionTimeAfter(startOfDay);
        Map<String, Long> actionTypeMap = new HashMap<>();
        for (Object[] row : actionTypeCounts) {
            actionTypeMap.put((String) row[0], (Long) row[1]);
        }
        stats.put("actionTypeDistribution", actionTypeMap);

        return stats;
    }

    @Override
    public String generateTraceId() {
        return "TRACE" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
