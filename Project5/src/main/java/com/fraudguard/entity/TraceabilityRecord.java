package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "traceability_records", indexes = {
    @Index(name = "idx_trace_transaction", columnList = "transactionId"),
    @Index(name = "idx_trace_user", columnList = "userId"),
    @Index(name = "idx_trace_status", columnList = "currentStatus")
})
public class TraceabilityRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String transactionId;

    @Column(nullable = false, length = 64)
    private String userId;

    @Column(length = 16)
    private String currentStatus;

    @Column(precision = 10, scale = 2)
    private BigDecimal currentRiskScore;

    @Column(length = 16)
    private String currentRiskLevel;

    @Column(length = 4096)
    private String fullTraceLog;

    @Column(length = 2048)
    private String decisionChain;

    @Column(length = 1024)
    private String ruleTriggerHistory;

    @Column(length = 1024)
    private String modelInferenceHistory;

    @Column(length = 512)
    private String relatedTransactions;

    @Column(length = 512)
    private String relatedAlerts;

    @Column(length = 256)
    private String evidenceChain;

    private Boolean hasManualIntervention;

    @Column(length = 64)
    private String finalDecisionMaker;

    @Column(length = 256)
    private String finalDecisionReason;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (hasManualIntervention == null) {
            hasManualIntervention = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
