package com.bonded.warehouse.mapper;

import com.bonded.warehouse.entity.PackTask;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PackTaskMapper {

    private final JdbcTemplate jdbc;

    public PackTaskMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private PackTask mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        PackTask t = new PackTask();
        t.setId(rs.getLong("id"));
        t.setOrderId(rs.getLong("order_id"));
        t.setGoodsId(rs.getLong("goods_id"));
        t.setGoodsName(rs.getString("goods_name"));
        t.setQuantity(rs.getInt("quantity"));
        t.setPackType(rs.getString("pack_type"));
        t.setWeight(rs.getDouble("weight"));
        t.setStatus(rs.getString("status"));
        t.setCreateTime(rs.getString("create_time"));
        t.setCompleteTime(rs.getString("complete_time"));
        return t;
    }

    public List<PackTask> findAll() {
        return jdbc.query("SELECT * FROM pack_task ORDER BY id DESC", this::mapRow);
    }

    public List<PackTask> findByOrderId(Long orderId) {
        return jdbc.query("SELECT * FROM pack_task WHERE order_id=?", this::mapRow, orderId);
    }

    public int insert(PackTask t) {
        return jdbc.update("INSERT INTO pack_task(order_id,goods_id,goods_name,quantity,pack_type,weight,status,create_time,complete_time) VALUES(?,?,?,?,?,?,?,?,?)",
                t.getOrderId(), t.getGoodsId(), t.getGoodsName(), t.getQuantity(),
                t.getPackType(), t.getWeight(), t.getStatus(), t.getCreateTime(), t.getCompleteTime());
    }

    public int updateStatus(Long id, String status) {
        return jdbc.update("UPDATE pack_task SET status=?, complete_time=datetime('now','localtime') WHERE id=?", status, id);
    }

    public List<PackTask> findPending() {
        return jdbc.query("SELECT * FROM pack_task WHERE status='待处理' ORDER BY id", this::mapRow);
    }
}
