package com.fraudguard.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "system_statistics", indexes = {
    @Index(name = "idx_stat_date", columnList = "statDate", unique = true)
})
public class SystemStatistics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private LocalDate statDate;

    private Long totalTransactions;

    private Long approvedTransactions;

    private Long rejectedTransactions;

    private Long pendingTransactions;

    private BigDecimal totalAmount;

    private BigDecimal approvedAmount;

    private BigDecimal rejectedAmount;

    private Long highRiskCount;

    private Long mediumRiskCount;

    private Long lowRiskCount;

    private Long fraudAlertsCount;

    private Long handledAlertsCount;

    private Double avgProcessingTimeMs;

    private Long maxProcessingTimeMs;

    private BigDecimal fraudLossAmount;
}
