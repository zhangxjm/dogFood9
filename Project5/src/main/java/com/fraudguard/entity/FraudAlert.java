package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "fraud_alerts", indexes = {
    @Index(name = "idx_alert_transaction", columnList = "transactionId"),
    @Index(name = "idx_alert_user", columnList = "userId"),
    @Index(name = "idx_alert_status", columnList = "alertStatus"),
    @Index(name = "idx_alert_level", columnList = "alertLevel")
})
public class FraudAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String alertId;

    @Column(nullable = false, length = 64)
    private String transactionId;

    @Column(nullable = false, length = 64)
    private String userId;

    @Column(length = 32)
    private String alertType;

    @Column(length = 16)
    private String alertLevel;

    @Column(precision = 10, scale = 2)
    private BigDecimal riskScore;

    @Column(length = 512)
    private String description;

    @Column(length = 1024)
    private String triggeredRules;

    @Column(length = 32)
    private String alertStatus;

    @Column(length = 64)
    private String handledBy;

    private LocalDateTime handledAt;

    @Column(length = 512)
    private String handleNote;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (alertStatus == null) {
            alertStatus = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
