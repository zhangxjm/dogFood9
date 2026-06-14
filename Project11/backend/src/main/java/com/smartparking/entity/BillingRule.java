package com.smartparking.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "billing_rule")
public class BillingRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String type;
    private Double firstHourFee;
    private Double additionalHourFee;
    private Double dailyMaxFee;
    private Double monthlyFee;

    public BillingRule() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Double getFirstHourFee() { return firstHourFee; }
    public void setFirstHourFee(Double firstHourFee) { this.firstHourFee = firstHourFee; }
    public Double getAdditionalHourFee() { return additionalHourFee; }
    public void setAdditionalHourFee(Double additionalHourFee) { this.additionalHourFee = additionalHourFee; }
    public Double getDailyMaxFee() { return dailyMaxFee; }
    public void setDailyMaxFee(Double dailyMaxFee) { this.dailyMaxFee = dailyMaxFee; }
    public Double getMonthlyFee() { return monthlyFee; }
    public void setMonthlyFee(Double monthlyFee) { this.monthlyFee = monthlyFee; }
}
