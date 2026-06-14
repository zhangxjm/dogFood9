package com.smartparking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "billing_record")
public class BillingRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long recordId;
    private String plateNumber;
    private Double amount;
    @Enumerated(EnumType.STRING)
    private PayMethod payMethod;
    private LocalDateTime payTime;
    @Enumerated(EnumType.STRING)
    private BillingStatus status;
    private LocalDateTime createdAt;

    public enum PayMethod {
        WECHAT, ALIPAY, CASH, FREE
    }

    public enum BillingStatus {
        UNPAID, PAID
    }

    public BillingRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getRecordId() { return recordId; }
    public void setRecordId(Long recordId) { this.recordId = recordId; }
    public String getPlateNumber() { return plateNumber; }
    public void setPlateNumber(String plateNumber) { this.plateNumber = plateNumber; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public PayMethod getPayMethod() { return payMethod; }
    public void setPayMethod(PayMethod payMethod) { this.payMethod = payMethod; }
    public LocalDateTime getPayTime() { return payTime; }
    public void setPayTime(LocalDateTime payTime) { this.payTime = payTime; }
    public BillingStatus getStatus() { return status; }
    public void setStatus(BillingStatus status) { this.status = status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
