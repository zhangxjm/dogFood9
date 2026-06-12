package com.bonded.warehouse.mapper;

import com.bonded.warehouse.entity.InboundOrder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class InboundOrderMapper {

    private final JdbcTemplate jdbc;

    public InboundOrderMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private InboundOrder mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        InboundOrder o = new InboundOrder();
        o.setId(rs.getLong("id"));
        o.setOrderNo(rs.getString("order_no"));
        o.setSupplier(rs.getString("supplier"));
        o.setTotalQuantity(rs.getInt("total_quantity"));
        o.setTotalValue(rs.getDouble("total_value"));
        o.setStatus(rs.getString("status"));
        o.setOperator(rs.getString("operator"));
        o.setCreateTime(rs.getString("create_time"));
        o.setCompleteTime(rs.getString("complete_time"));
        return o;
    }

    public List<InboundOrder> findAll() {
        return jdbc.query("SELECT * FROM inbound_order ORDER BY id DESC", this::mapRow);
    }

    public InboundOrder findById(Long id) {
        List<InboundOrder> list = jdbc.query("SELECT * FROM inbound_order WHERE id=?", this::mapRow, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public InboundOrder findByOrderNo(String orderNo) {
        List<InboundOrder> list = jdbc.query("SELECT * FROM inbound_order WHERE order_no=?", this::mapRow, orderNo);
        return list.isEmpty() ? null : list.get(0);
    }

    public int insert(InboundOrder o) {
        return jdbc.update("INSERT INTO inbound_order(order_no,supplier,total_quantity,total_value,status,operator,create_time,complete_time) VALUES(?,?,?,?,?,?,?,?)",
                o.getOrderNo(), o.getSupplier(), o.getTotalQuantity(), o.getTotalValue(),
                o.getStatus(), o.getOperator(), o.getCreateTime(), o.getCompleteTime());
    }

    public int updateStatus(Long id, String status) {
        return jdbc.update("UPDATE inbound_order SET status=?, complete_time=datetime('now','localtime') WHERE id=?", status, id);
    }

    public List<InboundOrder> findPending() {
        return jdbc.query("SELECT * FROM inbound_order WHERE status='待处理' ORDER BY id", this::mapRow);
    }
}
