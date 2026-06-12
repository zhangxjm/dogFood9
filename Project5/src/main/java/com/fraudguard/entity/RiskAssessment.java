package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "risk_assessments", indexes = {
    @Index(name = "idx_assessment_transaction", columnList = "transactionId", unique = true),
    @Index(name = "idx_assessment_user", columnList = "userId")
})
public class RiskAssessment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String transactionId;

    @Column(nullable = false, length = 64)
    private String userId;

    @Column(precision = 10, scale = 2)
    private BigDecimal ruleEngineScore;

    @Column(precision = 10, scale = 2)
    private BigDecimal mlModelScore;

    @Column(precision = 10, scale = 2)
    private BigDecimal finalScore;

    @Column(length = 16)
    private String riskLevel;

    @Column(length = 2048)
    private String ruleResults;

    @Column(length = 1024)
    private String mlFeatures;

    @Column(length = 16)
    private String decision;

    @Column(length = 512)
    private String decisionReason;

    private Long processingTimeMs;

    private LocalDateTime assessedAt;

    @PrePersist
    protected void onCreate() {
        assessedAt = LocalDateTime.now();
    }
}
