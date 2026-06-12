package com.bonded.customs.mapper;

import com.bonded.customs.entity.ThreeDocument;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ThreeDocumentMapper {

    private final JdbcTemplate jdbcTemplate;

    public ThreeDocumentMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private ThreeDocument mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        ThreeDocument doc = new ThreeDocument();
        doc.setId(rs.getLong("id"));
        doc.setOrderId(rs.getLong("order_id"));
        doc.setOrderNo(rs.getString("order_no"));
        doc.setOrderDocument(rs.getString("order_document"));
        doc.setPaymentDocument(rs.getString("payment_document"));
        doc.setLogisticsDocument(rs.getString("logistics_document"));
        doc.setMatchStatus(rs.getString("match_status"));
        doc.setMatchResult(rs.getString("match_result"));
        doc.setCreateTime(rs.getString("create_time"));
        doc.setVerifyTime(rs.getString("verify_time"));
        return doc;
    }

    public List<ThreeDocument> findAll() {
        String sql = "SELECT * FROM three_document ORDER BY id DESC";
        return jdbcTemplate.query(sql, this::mapRow);
    }

    public ThreeDocument findByOrderId(Long orderId) {
        String sql = "SELECT * FROM three_document WHERE order_id = ?";
        List<ThreeDocument> list = jdbcTemplate.query(sql, this::mapRow, orderId);
        return list.isEmpty() ? null : list.get(0);
    }

    public ThreeDocument findByOrderNo(String orderNo) {
        String sql = "SELECT * FROM three_document WHERE order_no = ?";
        List<ThreeDocument> list = jdbcTemplate.query(sql, this::mapRow, orderNo);
        return list.isEmpty() ? null : list.get(0);
    }

    public int insert(ThreeDocument doc) {
        String sql = "INSERT INTO three_document (order_id, order_no, order_document, payment_document, logistics_document, match_status, match_result, create_time, verify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql, doc.getOrderId(), doc.getOrderNo(), doc.getOrderDocument(), doc.getPaymentDocument(), doc.getLogisticsDocument(), doc.getMatchStatus(), doc.getMatchResult(), doc.getCreateTime(), doc.getVerifyTime());
    }

    public int updateMatchStatus(Long id, String matchStatus, String matchResult, String verifyTime) {
        String sql = "UPDATE three_document SET match_status = ?, match_result = ?, verify_time = ? WHERE id = ?";
        return jdbcTemplate.update(sql, matchStatus, matchResult, verifyTime, id);
    }

    public List<ThreeDocument> findByMatchStatus(String matchStatus) {
        String sql = "SELECT * FROM three_document WHERE match_status = ? ORDER BY id DESC";
        return jdbcTemplate.query(sql, this::mapRow, matchStatus);
    }
}
