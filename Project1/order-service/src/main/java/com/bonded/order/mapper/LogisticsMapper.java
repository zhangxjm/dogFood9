package com.bonded.order.mapper;

import com.bonded.order.entity.Logistics;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class LogisticsMapper {

    private final JdbcTemplate jdbc;

    public LogisticsMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private Logistics mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        Logistics l = new Logistics();
        l.setId(rs.getLong("id"));
        l.setOrderId(rs.getLong("order_id"));
        l.setOrderNo(rs.getString("order_no"));
        l.setTrackingNo(rs.getString("tracking_no"));
        l.setLogisticsCompany(rs.getString("logistics_company"));
        l.setStatus(rs.getString("status"));
        l.setReceiverName(rs.getString("receiver_name"));
        l.setReceiverPhone(rs.getString("receiver_phone"));
        l.setReceiverAddress(rs.getString("receiver_address"));
        l.setCreateTime(rs.getString("create_time"));
        l.setUpdateTime(rs.getString("update_time"));
        return l;
    }

    public List<Logistics> findAll() {
        return jdbc.query("SELECT * FROM t_logistics ORDER BY id DESC", this::mapRow);
    }

    public List<Logistics> findByOrderId(Long orderId) {
        return jdbc.query("SELECT * FROM t_logistics WHERE order_id = ?", this::mapRow, orderId);
    }

    public List<Logistics> findByOrderNo(String orderNo) {
        return jdbc.query("SELECT * FROM t_logistics WHERE order_no = ?", this::mapRow, orderNo);
    }

    public int insert(Logistics logistics) {
        return jdbc.update(
            "INSERT INTO t_logistics (order_id, order_no, tracking_no, logistics_company, status, receiver_name, receiver_phone, receiver_address, create_time, update_time) VALUES (?,?,?,?,?,?,?,?,?,?)",
            logistics.getOrderId(), logistics.getOrderNo(), logistics.getTrackingNo(),
            logistics.getLogisticsCompany(), logistics.getStatus(), logistics.getReceiverName(),
            logistics.getReceiverPhone(), logistics.getReceiverAddress(), logistics.getCreateTime(), logistics.getUpdateTime()
        );
    }

    public int updateStatus(Long id, String status) {
        return jdbc.update("UPDATE t_logistics SET status = ?, update_time = ? WHERE id = ?", status,
            new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new java.util.Date()), id);
    }
}
