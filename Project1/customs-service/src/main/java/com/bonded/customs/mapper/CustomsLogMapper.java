package com.bonded.customs.mapper;

import com.bonded.customs.entity.CustomsLog;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CustomsLogMapper {

    private final JdbcTemplate jdbcTemplate;

    public CustomsLogMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private CustomsLog mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        CustomsLog log = new CustomsLog();
        log.setId(rs.getLong("id"));
        log.setDeclarationId(rs.getLong("declaration_id"));
        log.setAction(rs.getString("action"));
        log.setDetail(rs.getString("detail"));
        log.setOperator(rs.getString("operator"));
        log.setCreateTime(rs.getString("create_time"));
        return log;
    }

    public List<CustomsLog> findByDeclarationId(Long declarationId) {
        String sql = "SELECT * FROM customs_log WHERE declaration_id = ? ORDER BY id";
        return jdbcTemplate.query(sql, this::mapRow, declarationId);
    }

    public int insert(CustomsLog log) {
        String sql = "INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql, log.getDeclarationId(), log.getAction(), log.getDetail(), log.getOperator(), log.getCreateTime());
    }
}
