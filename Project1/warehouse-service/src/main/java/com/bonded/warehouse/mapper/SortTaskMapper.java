package com.bonded.warehouse.mapper;

import com.bonded.warehouse.entity.SortTask;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class SortTaskMapper {

    private final JdbcTemplate jdbc;

    public SortTaskMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private SortTask mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        SortTask t = new SortTask();
        t.setId(rs.getLong("id"));
        t.setOrderId(rs.getLong("order_id"));
        t.setGoodsId(rs.getLong("goods_id"));
        t.setGoodsName(rs.getString("goods_name"));
        t.setFromLocation(rs.getString("from_location"));
        t.setToLocation(rs.getString("to_location"));
        t.setQuantity(rs.getInt("quantity"));
        t.setStatus(rs.getString("status"));
        t.setCreateTime(rs.getString("create_time"));
        t.setCompleteTime(rs.getString("complete_time"));
        return t;
    }

    public List<SortTask> findAll() {
        return jdbc.query("SELECT * FROM sort_task ORDER BY id DESC", this::mapRow);
    }

    public List<SortTask> findByOrderId(Long orderId) {
        return jdbc.query("SELECT * FROM sort_task WHERE order_id=?", this::mapRow, orderId);
    }

    public int insert(SortTask t) {
        return jdbc.update("INSERT INTO sort_task(order_id,goods_id,goods_name,from_location,to_location,quantity,status,create_time,complete_time) VALUES(?,?,?,?,?,?,?,?,?)",
                t.getOrderId(), t.getGoodsId(), t.getGoodsName(), t.getFromLocation(),
                t.getToLocation(), t.getQuantity(), t.getStatus(), t.getCreateTime(), t.getCompleteTime());
    }

    public int updateStatus(Long id, String status) {
        return jdbc.update("UPDATE sort_task SET status=?, complete_time=datetime('now','localtime') WHERE id=?", status, id);
    }

    public List<SortTask> findPending() {
        return jdbc.query("SELECT * FROM sort_task WHERE status='待处理' ORDER BY id", this::mapRow);
    }
}
