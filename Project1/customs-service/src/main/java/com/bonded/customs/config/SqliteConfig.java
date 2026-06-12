package com.bonded.customs.config;

import com.bonded.common.util.SqliteUtil;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.annotation.PostConstruct;
import javax.sql.DataSource;

@Configuration
public class SqliteConfig {

    private final DataSource dataSource;

    public SqliteConfig(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @PostConstruct
    public void initSchema() {
        SqliteUtil.ensureDatabase("data/customs.db");
        JdbcTemplate jt = new JdbcTemplate(dataSource);

        jt.execute("CREATE TABLE IF NOT EXISTS customs_declaration (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "declaration_no TEXT," +
                "order_no TEXT," +
                "buyer_name TEXT," +
                "buyer_id_no TEXT," +
                "seller_name TEXT," +
                "goods_summary TEXT," +
                "total_value REAL," +
                "currency TEXT," +
                "status TEXT," +
                "create_time TEXT," +
                "audit_time TEXT," +
                "reject_reason TEXT)");

        jt.execute("CREATE TABLE IF NOT EXISTS three_document (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_id INTEGER," +
                "order_no TEXT," +
                "order_document TEXT," +
                "payment_document TEXT," +
                "logistics_document TEXT," +
                "match_status TEXT," +
                "match_result TEXT," +
                "create_time TEXT," +
                "verify_time TEXT)");

        jt.execute("CREATE TABLE IF NOT EXISTS customs_rule (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "rule_name TEXT," +
                "hs_code TEXT," +
                "tax_rate REAL," +
                "regulation TEXT," +
                "status TEXT)");

        jt.execute("CREATE TABLE IF NOT EXISTS customs_log (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "declaration_id INTEGER," +
                "action TEXT," +
                "detail TEXT," +
                "operator TEXT," +
                "create_time TEXT)");
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
