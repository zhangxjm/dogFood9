package com.bonded.customs.mapper;

import com.bonded.customs.entity.CustomsRule;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class CustomsRuleMapper {

    private final JdbcTemplate jdbcTemplate;

    public CustomsRuleMapper(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    private CustomsRule mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        CustomsRule rule = new CustomsRule();
        rule.setId(rs.getLong("id"));
        rule.setRuleName(rs.getString("rule_name"));
        rule.setHsCode(rs.getString("hs_code"));
        rule.setTaxRate(rs.getDouble("tax_rate"));
        rule.setRegulation(rs.getString("regulation"));
        rule.setStatus(rs.getString("status"));
        return rule;
    }

    public List<CustomsRule> findAll() {
        String sql = "SELECT * FROM customs_rule ORDER BY id";
        return jdbcTemplate.query(sql, this::mapRow);
    }

    public CustomsRule findById(Long id) {
        String sql = "SELECT * FROM customs_rule WHERE id = ?";
        List<CustomsRule> list = jdbcTemplate.query(sql, this::mapRow, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public List<CustomsRule> findByHsCode(String hsCode) {
        String sql = "SELECT * FROM customs_rule WHERE hs_code = ?";
        return jdbcTemplate.query(sql, this::mapRow, hsCode);
    }

    public int insert(CustomsRule rule) {
        String sql = "INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)";
        return jdbcTemplate.update(sql, rule.getRuleName(), rule.getHsCode(), rule.getTaxRate(), rule.getRegulation(), rule.getStatus());
    }

    public int update(CustomsRule rule) {
        String sql = "UPDATE customs_rule SET rule_name = ?, hs_code = ?, tax_rate = ?, regulation = ?, status = ? WHERE id = ?";
        return jdbcTemplate.update(sql, rule.getRuleName(), rule.getHsCode(), rule.getTaxRate(), rule.getRegulation(), rule.getStatus(), rule.getId());
    }
}
