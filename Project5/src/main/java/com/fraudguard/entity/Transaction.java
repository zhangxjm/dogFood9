package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "transactions", indexes = {
    @Index(name = "idx_transaction_id", columnList = "transactionId", unique = true),
    @Index(name = "idx_user_id", columnList = "userId"),
    @Index(name = "idx_status", columnList = "status"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String transactionId;

    @Column(nullable = false, length = 64)
    private String userId;

    @Column(nullable = false, length = 64)
    private String fromAccount;

    @Column(nullable = false, length = 64)
    private String toAccount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(length = 32)
    private String currency;

    @Column(length = 64)
    private String merchant;

    @Column(length = 128)
    private String description;

    @Column(length = 32)
    private String transactionType;

    @Column(length = 64)
    private String deviceId;

    @Column(length = 64)
    private String ipAddress;

    @Column(length = 64)
    private String location;

    @Column(length = 16)
    private String cardNumberLast4;

    @Column(length = 32)
    private String status;

    @Column(precision = 10, scale = 2)
    private BigDecimal riskScore;

    @Column(length = 16)
    private String riskLevel;

    @Column(length = 512)
    private String riskReasons;

    private LocalDateTime processedAt;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = "PENDING";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
