package com.bonded.order.mapper;

import com.bonded.order.entity.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class OrderMapper {

    private final JdbcTemplate jdbc;

    public OrderMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private Order mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        Order o = new Order();
        o.setId(rs.getLong("id"));
        o.setOrderNo(rs.getString("order_no"));
        o.setBuyerName(rs.getString("buyer_name"));
        o.setBuyerIdNo(rs.getString("buyer_id_no"));
        o.setBuyerPhone(rs.getString("buyer_phone"));
        o.setTotalAmount(rs.getDouble("total_amount"));
        o.setCurrency(rs.getString("currency"));
        o.setStatus(rs.getString("status"));
        o.setPaymentStatus(rs.getString("payment_status"));
        o.setLogisticsStatus(rs.getString("logistics_status"));
        o.setCustomsStatus(rs.getString("customs_status"));
        o.setVersion(rs.getInt("version"));
        o.setCreateTime(rs.getString("create_time"));
        o.setPayTime(rs.getString("pay_time"));
        o.setShipTime(rs.getString("ship_time"));
        o.setCompleteTime(rs.getString("complete_time"));
        return o;
    }

    public List<Order> findAll() {
        return jdbc.query("SELECT * FROM t_order ORDER BY id DESC", this::mapRow);
    }

    public Order findById(Long id) {
        List<Order> list = jdbc.query("SELECT * FROM t_order WHERE id = ?", this::mapRow, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public Order findByOrderNo(String orderNo) {
        List<Order> list = jdbc.query("SELECT * FROM t_order WHERE order_no = ?", this::mapRow, orderNo);
        return list.isEmpty() ? null : list.get(0);
    }

    public int insert(Order order) {
        return jdbc.update(
            "INSERT INTO t_order (order_no, buyer_name, buyer_id_no, buyer_phone, total_amount, currency, status, payment_status, logistics_status, customs_status, version, create_time, pay_time, ship_time, complete_time) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            order.getOrderNo(), order.getBuyerName(), order.getBuyerIdNo(), order.getBuyerPhone(),
            order.getTotalAmount(), order.getCurrency(), order.getStatus(), order.getPaymentStatus(),
            order.getLogisticsStatus(), order.getCustomsStatus(), order.getVersion(),
            order.getCreateTime(), order.getPayTime(), order.getShipTime(), order.getCompleteTime()
        );
    }

    public int updateStatus(Long id, String status) {
        return jdbc.update("UPDATE t_order SET status = ?, version = version + 1 WHERE id = ? AND version = (SELECT version FROM t_order WHERE id = ?)", status, id, id);
    }

    public int updatePaymentStatus(Long id, String paymentStatus) {
        return jdbc.update("UPDATE t_order SET payment_status = ?, version = version + 1 WHERE id = ? AND version = (SELECT version FROM t_order WHERE id = ?)", paymentStatus, id, id);
    }

    public int updateLogisticsStatus(Long id, String logisticsStatus) {
        return jdbc.update("UPDATE t_order SET logistics_status = ?, version = version + 1 WHERE id = ? AND version = (SELECT version FROM t_order WHERE id = ?)", logisticsStatus, id, id);
    }

    public int updateCustomsStatus(Long id, String customsStatus) {
        return jdbc.update("UPDATE t_order SET customs_status = ?, version = version + 1 WHERE id = ? AND version = (SELECT version FROM t_order WHERE id = ?)", customsStatus, id, id);
    }

    public List<Order> findByStatus(String status) {
        return jdbc.query("SELECT * FROM t_order WHERE status = ? ORDER BY id DESC", this::mapRow, status);
    }

    public int count() {
        Integer c = jdbc.queryForObject("SELECT COUNT(*) FROM t_order", Integer.class);
        return c != null ? c : 0;
    }

    public List<Order> findPaged(int limit, int offset) {
        return jdbc.query("SELECT * FROM t_order ORDER BY id DESC LIMIT ? OFFSET ?", this::mapRow, limit, offset);
    }

    public int updateWithVersion(Order order) {
        return jdbc.update(
            "UPDATE t_order SET status = ?, payment_status = ?, logistics_status = ?, customs_status = ?, pay_time = ?, ship_time = ?, complete_time = ?, version = version + 1 WHERE id = ? AND version = ?",
            order.getStatus(), order.getPaymentStatus(), order.getLogisticsStatus(), order.getCustomsStatus(),
            order.getPayTime(), order.getShipTime(), order.getCompleteTime(), order.getId(), order.getVersion()
        );
    }
}
