package com.bonded.customs.entity;

public class CustomsDeclaration {
    private Long id;
    private String declarationNo;
    private String orderNo;
    private String buyerName;
    private String buyerIdNo;
    private String sellerName;
    private String goodsSummary;
    private Double totalValue;
    private String currency;
    private String status;
    private String createTime;
    private String auditTime;
    private String rejectReason;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getDeclarationNo() { return declarationNo; }
    public void setDeclarationNo(String declarationNo) { this.declarationNo = declarationNo; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public String getBuyerIdNo() { return buyerIdNo; }
    public void setBuyerIdNo(String buyerIdNo) { this.buyerIdNo = buyerIdNo; }
    public String getSellerName() { return sellerName; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
    public String getGoodsSummary() { return goodsSummary; }
    public void setGoodsSummary(String goodsSummary) { this.goodsSummary = goodsSummary; }
    public Double getTotalValue() { return totalValue; }
    public void setTotalValue(Double totalValue) { this.totalValue = totalValue; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getCreateTime() { return createTime; }
    public void setCreateTime(String createTime) { this.createTime = createTime; }
    public String getAuditTime() { return auditTime; }
    public void setAuditTime(String auditTime) { this.auditTime = auditTime; }
    public String getRejectReason() { return rejectReason; }
    public void setRejectReason(String rejectReason) { this.rejectReason = rejectReason; }
}
