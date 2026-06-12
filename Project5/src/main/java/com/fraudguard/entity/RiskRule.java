package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "risk_rules", indexes = {
    @Index(name = "idx_rule_code", columnList = "ruleCode", unique = true),
    @Index(name = "idx_rule_enabled", columnList = "enabled")
})
public class RiskRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String ruleCode;

    @Column(nullable = false, length = 128)
    private String ruleName;

    @Column(length = 512)
    private String description;

    @Column(length = 32)
    private String ruleType;

    @Column(length = 16)
    private String severity;

    @Column(precision = 10, scale = 2)
    private BigDecimal scoreWeight;

    @Column(length = 256)
    private String conditionExpression;

    @Column(precision = 18, scale = 2)
    private BigDecimal thresholdValue;

    @Column(length = 64)
    private String thresholdUnit;

    private Integer timeWindowSeconds;

    @Column(length = 128)
    private String action;

    private Boolean enabled;

    @Column(length = 64)
    private String createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (enabled == null) {
            enabled = true;
        }
        if (scoreWeight == null) {
            scoreWeight = new BigDecimal("10");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
