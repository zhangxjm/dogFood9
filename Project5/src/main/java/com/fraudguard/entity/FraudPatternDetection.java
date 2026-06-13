package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "fraud_pattern_detections", indexes = {
    @Index(name = "idx_fpd_transaction", columnList = "transactionId", unique = true),
    @Index(name = "idx_fpd_user", columnList = "userId"),
    @Index(name = "idx_fpd_type", columnList = "fraudType"),
    @Index(name = "idx_fpd_confidence", columnList = "confidenceScore")
})
public class FraudPatternDetection {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 64)
    private String transactionId;

    @Column(nullable = false, length = 64)
    private String userId;

    @Column(length = 32)
    private String fraudType;

    @Column(precision = 10, scale = 2)
    private BigDecimal confidenceScore;

    private Boolean isStolenCard;

    private Boolean isCashOut;

    private Boolean isFakeTransaction;

    private Boolean isAccountTakeover;

    private Boolean isMoneyLaundering;

    @Column(precision = 10, scale = 2)
    private BigDecimal stolenCardScore;

    @Column(precision = 10, scale = 2)
    private BigDecimal cashOutScore;

    @Column(precision = 10, scale = 2)
    private BigDecimal fakeTransactionScore;

    @Column(precision = 10, scale = 2)
    private BigDecimal accountTakeoverScore;

    @Column(precision = 10, scale = 2)
    private BigDecimal moneyLaunderingScore;

    @Column(length = 2048)
    private String stolenCardEvidence;

    @Column(length = 2048)
    private String cashOutEvidence;

    @Column(length = 2048)
    private String fakeTransactionEvidence;

    @Column(length = 2048)
    private String accountTakeoverEvidence;

    @Column(length = 2048)
    private String moneyLaunderingEvidence;

    @Column(length = 1024)
    private String patternFeatures;

    @Column(length = 256)
    private String modelVersion;

    private LocalDateTime detectedAt;

    @PrePersist
    protected void onCreate() {
        detectedAt = LocalDateTime.now();
        if (isStolenCard == null) isStolenCard = false;
        if (isCashOut == null) isCashOut = false;
        if (isFakeTransaction == null) isFakeTransaction = false;
        if (isAccountTakeover == null) isAccountTakeover = false;
        if (isMoneyLaundering == null) isMoneyLaundering = false;
    }
}
