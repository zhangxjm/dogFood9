package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "user_accounts", indexes = {
    @Index(name = "idx_user_id", columnList = "userId", unique = true),
    @Index(name = "idx_account_status", columnList = "accountStatus")
})
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String userId;

    @Column(nullable = false, length = 64)
    private String accountNumber;

    @Column(nullable = false, length = 128)
    private String userName;

    @Column(length = 32)
    private String idCardNumber;

    @Column(length = 16)
    private String phoneNumber;

    @Column(length = 128)
    private String email;

    @Column(precision = 18, scale = 2)
    private BigDecimal accountBalance;

    @Column(precision = 18, scale = 2)
    private BigDecimal dailyTransactionLimit;

    @Column(length = 32)
    private String accountType;

    @Column(length = 32)
    private String accountStatus;

    @Column(length = 64)
    private String riskLevel;

    @Column(precision = 10, scale = 2)
    private BigDecimal creditScore;

    @Column(length = 256)
    private String registeredAddress;

    @Column(length = 64)
    private String registeredCity;

    @Column(length = 64)
    private String registeredCountry;

    private LocalDateTime lastLoginTime;

    @Column(length = 64)
    private String lastLoginIp;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (accountStatus == null) {
            accountStatus = "ACTIVE";
        }
        if (riskLevel == null) {
            riskLevel = "LOW";
        }
        if (dailyTransactionLimit == null) {
            dailyTransactionLimit = new BigDecimal("100000");
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
