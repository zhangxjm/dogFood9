package com.bonded.warehouse.mapper;

import com.bonded.warehouse.entity.InventoryAlert;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class InventoryAlertMapper {

    private final JdbcTemplate jdbc;

    public InventoryAlertMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private InventoryAlert mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        InventoryAlert a = new InventoryAlert();
        a.setId(rs.getLong("id"));
        a.setGoodsId(rs.getLong("goods_id"));
        a.setGoodsName(rs.getString("goods_name"));
        a.setAlertType(rs.getString("alert_type"));
        a.setThreshold(rs.getInt("threshold"));
        a.setCurrentQuantity(rs.getInt("current_quantity"));
        a.setStatus(rs.getString("status"));
        a.setCreateTime(rs.getString("create_time"));
        return a;
    }

    public List<InventoryAlert> findAll() {
        return jdbc.query("SELECT * FROM inventory_alert ORDER BY id DESC", this::mapRow);
    }

    public List<InventoryAlert> findByStatus(String status) {
        return jdbc.query("SELECT * FROM inventory_alert WHERE status=?", this::mapRow, status);
    }

    public int insert(InventoryAlert a) {
        return jdbc.update("INSERT INTO inventory_alert(goods_id,goods_name,alert_type,threshold,current_quantity,status,create_time) VALUES(?,?,?,?,?,?,?)",
                a.getGoodsId(), a.getGoodsName(), a.getAlertType(), a.getThreshold(),
                a.getCurrentQuantity(), a.getStatus(), a.getCreateTime());
    }

    public int updateStatus(Long id, String status) {
        return jdbc.update("UPDATE inventory_alert SET status=? WHERE id=?", status, id);
    }

    public List<InventoryAlert> findByGoodsId(Long goodsId) {
        return jdbc.query("SELECT * FROM inventory_alert WHERE goods_id=?", this::mapRow, goodsId);
    }
}
