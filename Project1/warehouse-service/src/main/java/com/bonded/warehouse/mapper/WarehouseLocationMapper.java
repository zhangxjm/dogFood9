package com.bonded.warehouse.mapper;

import com.bonded.warehouse.entity.WarehouseLocation;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class WarehouseLocationMapper {

    private final JdbcTemplate jdbc;

    public WarehouseLocationMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private WarehouseLocation mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        WarehouseLocation loc = new WarehouseLocation();
        loc.setId(rs.getLong("id"));
        loc.setZone(rs.getString("zone"));
        loc.setRow(rs.getString("row"));
        loc.setColumn(rs.getString("column"));
        loc.setLayer(rs.getString("layer"));
        loc.setStatus(rs.getString("status"));
        loc.setGoodsId(rs.getObject("goods_id") != null ? rs.getLong("goods_id") : null);
        loc.setGoodsName(rs.getString("goods_name"));
        loc.setCapacity(rs.getInt("capacity"));
        loc.setUsedCapacity(rs.getInt("used_capacity"));
        loc.setUpdateTime(rs.getString("update_time"));
        return loc;
    }

    public List<WarehouseLocation> findAll() {
        return jdbc.query("SELECT * FROM warehouse_location ORDER BY zone, row, column, layer", this::mapRow);
    }

    public WarehouseLocation findById(Long id) {
        List<WarehouseLocation> list = jdbc.query("SELECT * FROM warehouse_location WHERE id=?", this::mapRow, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public List<WarehouseLocation> findByZone(String zone) {
        return jdbc.query("SELECT * FROM warehouse_location WHERE zone=? ORDER BY row, column, layer", this::mapRow, zone);
    }

    public int insert(WarehouseLocation loc) {
        return jdbc.update("INSERT INTO warehouse_location(zone,row,column,layer,status,goods_id,goods_name,capacity,used_capacity,update_time) VALUES(?,?,?,?,?,?,?,?,?,?)",
                loc.getZone(), loc.getRow(), loc.getColumn(), loc.getLayer(), loc.getStatus(),
                loc.getGoodsId(), loc.getGoodsName(), loc.getCapacity(), loc.getUsedCapacity(), loc.getUpdateTime());
    }

    public int update(WarehouseLocation loc) {
        return jdbc.update("UPDATE warehouse_location SET zone=?,row=?,column=?,layer=?,status=?,goods_id=?,goods_name=?,capacity=?,used_capacity=?,update_time=? WHERE id=?",
                loc.getZone(), loc.getRow(), loc.getColumn(), loc.getLayer(), loc.getStatus(),
                loc.getGoodsId(), loc.getGoodsName(), loc.getCapacity(), loc.getUsedCapacity(),
                loc.getUpdateTime(), loc.getId());
    }

    public int updateStatus(Long id, String status) {
        return jdbc.update("UPDATE warehouse_location SET status=?, update_time=datetime('now','localtime') WHERE id=?", status, id);
    }

    public List<WarehouseLocation> findAvailable() {
        return jdbc.query("SELECT * FROM warehouse_location WHERE status='空闲' ORDER BY zone, row, column, layer", this::mapRow);
    }

    public List<WarehouseLocation> findByGoodsId(Long goodsId) {
        return jdbc.query("SELECT * FROM warehouse_location WHERE goods_id=? ORDER BY zone, row, column, layer", this::mapRow, goodsId);
    }
}
