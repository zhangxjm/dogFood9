package com.fraudguard.controller;

import com.fraudguard.entity.AuditTrail;
import com.fraudguard.service.AuditTrailService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
public class AuditTrailController {

    private final AuditTrailService auditTrailService;

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<List<AuditTrail>> getTransactionAudit(@PathVariable String transactionId) {
        List<AuditTrail> trails = auditTrailService.getTransactionAudit(transactionId);
        return ResponseEntity.ok(trails);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditTrail>> getUserAudit(@PathVariable String userId) {
        List<AuditTrail> trails = auditTrailService.getUserAudit(userId);
        return ResponseEntity.ok(trails);
    }

    @GetMapping("/alert/{alertId}")
    public ResponseEntity<List<AuditTrail>> getAlertAudit(@PathVariable String alertId) {
        List<AuditTrail> trails = auditTrailService.getAlertAudit(alertId);
        return ResponseEntity.ok(trails);
    }

    @GetMapping("/operator/{operatorId}")
    public ResponseEntity<Page<AuditTrail>> getOperatorAudit(
            @PathVariable String operatorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditTrail> trails = auditTrailService.getOperatorAudit(operatorId, pageable);
        return ResponseEntity.ok(trails);
    }

    @GetMapping("/type/{actionType}")
    public ResponseEntity<Page<AuditTrail>> getActionsByType(
            @PathVariable String actionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<AuditTrail> trails = auditTrailService.getActionsByType(actionType, pageable);
        return ResponseEntity.ok(trails);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAuditStats() {
        return ResponseEntity.ok(auditTrailService.getAuditStatistics());
    }
}
