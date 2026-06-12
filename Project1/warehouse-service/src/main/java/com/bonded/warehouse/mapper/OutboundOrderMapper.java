package com.bonded.warehouse.mapper;

import com.bonded.warehouse.entity.OutboundOrder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class OutboundOrderMapper {

    private final JdbcTemplate jdbc;

    public OutboundOrderMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private OutboundOrder mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        OutboundOrder o = new OutboundOrder();
        o.setId(rs.getLong("id"));
        o.setOrderNo(rs.getString("order_no"));
        o.setTotalQuantity(rs.getInt("total_quantity"));
        o.setStatus(rs.getString("status"));
        o.setOperator(rs.getString("operator"));
        o.setCreateTime(rs.getString("create_time"));
        o.setCompleteTime(rs.getString("complete_time"));
        return o;
    }

    public List<OutboundOrder> findAll() {
        return jdbc.query("SELECT * FROM outbound_order ORDER BY id DESC", this::mapRow);
    }

    public OutboundOrder findById(Long id) {
        List<OutboundOrder> list = jdbc.query("SELECT * FROM outbound_order WHERE id=?", this::mapRow, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public OutboundOrder findByOrderNo(String orderNo) {
        List<OutboundOrder> list = jdbc.query("SELECT * FROM outbound_order WHERE order_no=?", this::mapRow, orderNo);
        return list.isEmpty() ? null : list.get(0);
    }

    public int insert(OutboundOrder o) {
        return jdbc.update("INSERT INTO outbound_order(order_no,total_quantity,status,operator,create_time,complete_time) VALUES(?,?,?,?,?,?)",
                o.getOrderNo(), o.getTotalQuantity(), o.getStatus(), o.getOperator(),
                o.getCreateTime(), o.getCompleteTime());
    }

    public int updateStatus(Long id, String status) {
        return jdbc.update("UPDATE outbound_order SET status=?, complete_time=datetime('now','localtime') WHERE id=?", status, id);
    }

    public List<OutboundOrder> findPending() {
        return jdbc.query("SELECT * FROM outbound_order WHERE status='待处理' ORDER BY id", this::mapRow);
    }
}
