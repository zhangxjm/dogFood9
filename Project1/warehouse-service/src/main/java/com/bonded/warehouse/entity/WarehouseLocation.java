package com.bonded.warehouse.entity;

public class WarehouseLocation {
    private Long id;
    private String zone;
    private String row;
    private String column;
    private String layer;
    private String status;
    private Long goodsId;
    private String goodsName;
    private Integer capacity;
    private Integer usedCapacity;
    private String updateTime;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getZone() { return zone; }
    public void setZone(String zone) { this.zone = zone; }
    public String getRow() { return row; }
    public void setRow(String row) { this.row = row; }
    public String getColumn() { return column; }
    public void setColumn(String column) { this.column = column; }
    public String getLayer() { return layer; }
    public void setLayer(String layer) { this.layer = layer; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Long getGoodsId() { return goodsId; }
    public void setGoodsId(Long goodsId) { this.goodsId = goodsId; }
    public String getGoodsName() { return goodsName; }
    public void setGoodsName(String goodsName) { this.goodsName = goodsName; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public Integer getUsedCapacity() { return usedCapacity; }
    public void setUsedCapacity(Integer usedCapacity) { this.usedCapacity = usedCapacity; }
    public String getUpdateTime() { return updateTime; }
    public void setUpdateTime(String updateTime) { this.updateTime = updateTime; }
}
