package com.bonded.customs.mapper;

import com.bonded.customs.entity.CustomsDeclaration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CustomsDeclarationMapper {

    private final JdbcTemplate jdbcTemplate;

    public CustomsDeclarationMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public List<CustomsDeclaration> findAll() {
        String sql = "SELECT * FROM customs_declaration ORDER BY id DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            CustomsDeclaration d = new CustomsDeclaration();
            d.setId(rs.getLong("id"));
            d.setDeclarationNo(rs.getString("declaration_no"));
            d.setOrderNo(rs.getString("order_no"));
            d.setBuyerName(rs.getString("buyer_name"));
            d.setBuyerIdNo(rs.getString("buyer_id_no"));
            d.setSellerName(rs.getString("seller_name"));
            d.setGoodsSummary(rs.getString("goods_summary"));
            d.setTotalValue(rs.getDouble("total_value"));
            d.setCurrency(rs.getString("currency"));
            d.setStatus(rs.getString("status"));
            d.setCreateTime(rs.getString("create_time"));
            d.setAuditTime(rs.getString("audit_time"));
            d.setRejectReason(rs.getString("reject_reason"));
            return d;
        });
    }

    public CustomsDeclaration findById(Long id) {
        String sql = "SELECT * FROM customs_declaration WHERE id = ?";
        List<CustomsDeclaration> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            CustomsDeclaration d = new CustomsDeclaration();
            d.setId(rs.getLong("id"));
            d.setDeclarationNo(rs.getString("declaration_no"));
            d.setOrderNo(rs.getString("order_no"));
            d.setBuyerName(rs.getString("buyer_name"));
            d.setBuyerIdNo(rs.getString("buyer_id_no"));
            d.setSellerName(rs.getString("seller_name"));
            d.setGoodsSummary(rs.getString("goods_summary"));
            d.setTotalValue(rs.getDouble("total_value"));
            d.setCurrency(rs.getString("currency"));
            d.setStatus(rs.getString("status"));
            d.setCreateTime(rs.getString("create_time"));
            d.setAuditTime(rs.getString("audit_time"));
            d.setRejectReason(rs.getString("reject_reason"));
            return d;
        }, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public CustomsDeclaration findByDeclarationNo(String declarationNo) {
        String sql = "SELECT * FROM customs_declaration WHERE declaration_no = ?";
        List<CustomsDeclaration> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            CustomsDeclaration d = new CustomsDeclaration();
            d.setId(rs.getLong("id"));
            d.setDeclarationNo(rs.getString("declaration_no"));
            d.setOrderNo(rs.getString("order_no"));
            d.setBuyerName(rs.getString("buyer_name"));
            d.setBuyerIdNo(rs.getString("buyer_id_no"));
            d.setSellerName(rs.getString("seller_name"));
            d.setGoodsSummary(rs.getString("goods_summary"));
            d.setTotalValue(rs.getDouble("total_value"));
            d.setCurrency(rs.getString("currency"));
            d.setStatus(rs.getString("status"));
            d.setCreateTime(rs.getString("create_time"));
            d.setAuditTime(rs.getString("audit_time"));
            d.setRejectReason(rs.getString("reject_reason"));
            return d;
        }, declarationNo);
        return list.isEmpty() ? null : list.get(0);
    }

    public CustomsDeclaration findByOrderNo(String orderNo) {
        String sql = "SELECT * FROM customs_declaration WHERE order_no = ?";
        List<CustomsDeclaration> list = jdbcTemplate.query(sql, (rs, rowNum) -> {
            CustomsDeclaration d = new CustomsDeclaration();
            d.setId(rs.getLong("id"));
            d.setDeclarationNo(rs.getString("declaration_no"));
            d.setOrderNo(rs.getString("order_no"));
            d.setBuyerName(rs.getString("buyer_name"));
            d.setBuyerIdNo(rs.getString("buyer_id_no"));
            d.setSellerName(rs.getString("seller_name"));
            d.setGoodsSummary(rs.getString("goods_summary"));
            d.setTotalValue(rs.getDouble("total_value"));
            d.setCurrency(rs.getString("currency"));
            d.setStatus(rs.getString("status"));
            d.setCreateTime(rs.getString("create_time"));
            d.setAuditTime(rs.getString("audit_time"));
            d.setRejectReason(rs.getString("reject_reason"));
            return d;
        }, orderNo);
        return list.isEmpty() ? null : list.get(0);
    }

    public int insert(CustomsDeclaration d) {
        String sql = "INSERT INTO customs_declaration (declaration_no, order_no, buyer_name, buyer_id_no, seller_name, goods_summary, total_value, currency, status, create_time, audit_time, reject_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql, d.getDeclarationNo(), d.getOrderNo(), d.getBuyerName(), d.getBuyerIdNo(), d.getSellerName(), d.getGoodsSummary(), d.getTotalValue(), d.getCurrency(), d.getStatus(), d.getCreateTime(), d.getAuditTime(), d.getRejectReason());
    }

    public int updateStatus(Long id, String status, String auditTime, String rejectReason) {
        String sql = "UPDATE customs_declaration SET status = ?, audit_time = ?, reject_reason = ? WHERE id = ?";
        return jdbcTemplate.update(sql, status, auditTime, rejectReason, id);
    }

    public List<CustomsDeclaration> findByStatus(String status) {
        String sql = "SELECT * FROM customs_declaration WHERE status = ? ORDER BY id DESC";
        return jdbcTemplate.query(sql, (rs, rowNum) -> {
            CustomsDeclaration d = new CustomsDeclaration();
            d.setId(rs.getLong("id"));
            d.setDeclarationNo(rs.getString("declaration_no"));
            d.setOrderNo(rs.getString("order_no"));
            d.setBuyerName(rs.getString("buyer_name"));
            d.setBuyerIdNo(rs.getString("buyer_id_no"));
            d.setSellerName(rs.getString("seller_name"));
            d.setGoodsSummary(rs.getString("goods_summary"));
            d.setTotalValue(rs.getDouble("total_value"));
            d.setCurrency(rs.getString("currency"));
            d.setStatus(rs.getString("status"));
            d.setCreateTime(rs.getString("create_time"));
            d.setAuditTime(rs.getString("audit_time"));
            d.setRejectReason(rs.getString("reject_reason"));
            return d;
        }, status);
    }
}
