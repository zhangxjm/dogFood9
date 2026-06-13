package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "audit_trails", indexes = {
    @Index(name = "idx_audit_trace", columnList = "traceId"),
    @Index(name = "idx_audit_transaction", columnList = "transactionId"),
    @Index(name = "idx_audit_user", columnList = "userId"),
    @Index(name = "idx_audit_action", columnList = "actionType"),
    @Index(name = "idx_audit_operator", columnList = "operatorId"),
    @Index(name = "idx_audit_time", columnList = "actionTime")
})
public class AuditTrail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 64)
    private String traceId;

    @Column(length = 64)
    private String transactionId;

    @Column(length = 64)
    private String userId;

    @Column(length = 64)
    private String alertId;

    @Column(nullable = false, length = 64)
    private String actionType;

    @Column(length = 512)
    private String actionDetail;

    @Column(length = 32)
    private String actionResult;

    @Column(length = 512)
    private String beforeState;

    @Column(length = 512)
    private String afterState;

    @Column(length = 64)
    private String operatorId;

    @Column(length = 64)
    private String operatorName;

    @Column(length = 64)
    private String operatorRole;

    @Column(length = 64)
    private String sourceIp;

    @Column(length = 256)
    private String requestId;

    @Column(nullable = false)
    private LocalDateTime actionTime;

    @PrePersist
    protected void onCreate() {
        actionTime = LocalDateTime.now();
    }
}
