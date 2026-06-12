package com.bonded.customs.entity;

public class CustomsRule {
    private Long id;
    private String ruleName;
    private String hsCode;
    private Double taxRate;
    private String regulation;
    private String status;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }
    public String getHsCode() { return hsCode; }
    public void setHsCode(String hsCode) { this.hsCode = hsCode; }
    public Double getTaxRate() { return taxRate; }
    public void setTaxRate(Double taxRate) { this.taxRate = taxRate; }
    public String getRegulation() { return regulation; }
    public void setRegulation(String regulation) { this.regulation = regulation; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
