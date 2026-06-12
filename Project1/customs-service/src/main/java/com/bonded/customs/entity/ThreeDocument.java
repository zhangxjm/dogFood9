package com.bonded.customs.entity;

public class ThreeDocument {
    private Long id;
    private Long orderId;
    private String orderNo;
    private String orderDocument;
    private String paymentDocument;
    private String logisticsDocument;
    private String matchStatus;
    private String matchResult;
    private String createTime;
    private String verifyTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getOrderId() { return orderId; }
    public void setOrderId(Long orderId) { this.orderId = orderId; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getOrderDocument() { return orderDocument; }
    public void setOrderDocument(String orderDocument) { this.orderDocument = orderDocument; }
    public String getPaymentDocument() { return paymentDocument; }
    public void setPaymentDocument(String paymentDocument) { this.paymentDocument = paymentDocument; }
    public String getLogisticsDocument() { return logisticsDocument; }
    public void setLogisticsDocument(String logisticsDocument) { this.logisticsDocument = logisticsDocument; }
    public String getMatchStatus() { return matchStatus; }
    public void setMatchStatus(String matchStatus) { this.matchStatus = matchStatus; }
    public String getMatchResult() { return matchResult; }
    public void setMatchResult(String matchResult) { this.matchResult = matchResult; }
    public String getCreateTime() { return createTime; }
    public void setCreateTime(String createTime) { this.createTime = createTime; }
    public String getVerifyTime() { return verifyTime; }
    public void setVerifyTime(String verifyTime) { this.verifyTime = verifyTime; }
}
