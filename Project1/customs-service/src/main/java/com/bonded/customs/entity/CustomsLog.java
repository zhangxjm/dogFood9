package com.bonded.customs.entity;

public class CustomsLog {
    private Long id;
    private Long declarationId;
    private String action;
    private String detail;
    private String operator;
    private String createTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getDeclarationId() { return declarationId; }
    public void setDeclarationId(Long declarationId) { this.declarationId = declarationId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public String getOperator() { return operator; }
    public void setOperator(String operator) { this.operator = operator; }
    public String getCreateTime() { return createTime; }
    public void setCreateTime(String createTime) { this.createTime = createTime; }
}
