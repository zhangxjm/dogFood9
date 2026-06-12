package com.bonded.order.entity;

public class Order {
    private Long id;
    private String orderNo;
    private String buyerName;
    private String buyerIdNo;
    private String buyerPhone;
    private Double totalAmount;
    private String currency;
    private String status;
    private String paymentStatus;
    private String logisticsStatus;
    private String customsStatus;
    private Integer version;
    private String createTime;
    private String payTime;
    private String shipTime;
    private String completeTime;

    public Order() {
        this.version = 1;
        this.currency = "CNY";
        this.status = "待支付";
        this.paymentStatus = "未支付";
        this.logisticsStatus = "未发货";
        this.customsStatus = "未申报";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNo() { return orderNo; }
    public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
    public String getBuyerName() { return buyerName; }
    public void setBuyerName(String buyerName) { this.buyerName = buyerName; }
    public String getBuyerIdNo() { return buyerIdNo; }
    public void setBuyerIdNo(String buyerIdNo) { this.buyerIdNo = buyerIdNo; }
    public String getBuyerPhone() { return buyerPhone; }
    public void setBuyerPhone(String buyerPhone) { this.buyerPhone = buyerPhone; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getLogisticsStatus() { return logisticsStatus; }
    public void setLogisticsStatus(String logisticsStatus) { this.logisticsStatus = logisticsStatus; }
    public String getCustomsStatus() { return customsStatus; }
    public void setCustomsStatus(String customsStatus) { this.customsStatus = customsStatus; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public String getCreateTime() { return createTime; }
    public void setCreateTime(String createTime) { this.createTime = createTime; }
    public String getPayTime() { return payTime; }
    public void setPayTime(String payTime) { this.payTime = payTime; }
    public String getShipTime() { return shipTime; }
    public void setShipTime(String shipTime) { this.shipTime = shipTime; }
    public String getCompleteTime() { return completeTime; }
    public void setCompleteTime(String completeTime) { this.completeTime = completeTime; }
}
