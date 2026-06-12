package com.bonded.order.mapper;

import com.bonded.order.entity.Payment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class PaymentMapper {

    private final JdbcTemplate jdbc;

    public PaymentMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private Payment mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        Payment p = new Payment();
        p.setId(rs.getLong("id"));
        p.setOrderId(rs.getLong("order_id"));
        p.setOrderNo(rs.getString("order_no"));
        p.setPaymentNo(rs.getString("payment_no"));
        p.setPaymentAmount(rs.getDouble("payment_amount"));
        p.setPaymentTime(rs.getString("payment_time"));
        p.setPaymentChannel(rs.getString("payment_channel"));
        p.setStatus(rs.getString("status"));
        return p;
    }

    public List<Payment> findAll() {
        return jdbc.query("SELECT * FROM t_payment ORDER BY id DESC", this::mapRow);
    }

    public List<Payment> findByOrderId(Long orderId) {
        return jdbc.query("SELECT * FROM t_payment WHERE order_id = ?", this::mapRow, orderId);
    }

    public List<Payment> findByOrderNo(String orderNo) {
        return jdbc.query("SELECT * FROM t_payment WHERE order_no = ?", this::mapRow, orderNo);
    }

    public int insert(Payment payment) {
        return jdbc.update(
            "INSERT INTO t_payment (order_id, order_no, payment_no, payment_amount, payment_time, payment_channel, status) VALUES (?,?,?,?,?,?,?)",
            payment.getOrderId(), payment.getOrderNo(), payment.getPaymentNo(),
            payment.getPaymentAmount(), payment.getPaymentTime(), payment.getPaymentChannel(), payment.getStatus()
        );
    }

    public int updateStatus(Long id, String status) {
        return jdbc.update("UPDATE t_payment SET status = ? WHERE id = ?", status, id);
    }
}
