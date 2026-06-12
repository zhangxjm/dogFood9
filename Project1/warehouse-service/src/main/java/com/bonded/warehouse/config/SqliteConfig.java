package com.bonded.warehouse.config;

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
        SqliteUtil.ensureDatabase("data/warehouse.db");
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);

        jdbc.execute("CREATE TABLE IF NOT EXISTS goods (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "sku TEXT NOT NULL," +
                "name TEXT NOT NULL," +
                "category TEXT," +
                "origin_country TEXT," +
                "brand TEXT," +
                "specification TEXT," +
                "unit TEXT," +
                "hs_code TEXT," +
                "value REAL," +
                "status TEXT DEFAULT '正常'," +
                "create_time TEXT," +
                "update_time TEXT)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS warehouse_location (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "zone TEXT NOT NULL," +
                "row TEXT NOT NULL," +
                "column TEXT NOT NULL," +
                "layer TEXT NOT NULL," +
                "status TEXT DEFAULT '空闲'," +
                "goods_id INTEGER," +
                "goods_name TEXT," +
                "capacity INTEGER DEFAULT 100," +
                "used_capacity INTEGER DEFAULT 0," +
                "update_time TEXT)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS inbound_order (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_no TEXT NOT NULL," +
                "supplier TEXT," +
                "total_quantity INTEGER," +
                "total_value REAL," +
                "status TEXT DEFAULT '待处理'," +
                "operator TEXT," +
                "create_time TEXT," +
                "complete_time TEXT)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS inbound_item (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_id INTEGER NOT NULL," +
                "goods_id INTEGER NOT NULL," +
                "goods_name TEXT," +
                "quantity INTEGER," +
                "location_id INTEGER," +
                "location_code TEXT)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS outbound_order (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_no TEXT NOT NULL," +
                "total_quantity INTEGER," +
                "status TEXT DEFAULT '待处理'," +
                "operator TEXT," +
                "create_time TEXT," +
                "complete_time TEXT)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS outbound_item (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_id INTEGER NOT NULL," +
                "goods_id INTEGER NOT NULL," +
                "goods_name TEXT," +
                "quantity INTEGER," +
                "location_id INTEGER," +
                "location_code TEXT)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS sort_task (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_id INTEGER NOT NULL," +
                "goods_id INTEGER NOT NULL," +
                "goods_name TEXT," +
                "from_location TEXT," +
                "to_location TEXT," +
                "quantity INTEGER," +
                "status TEXT DEFAULT '待处理'," +
                "create_time TEXT," +
                "complete_time TEXT)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS pack_task (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_id INTEGER NOT NULL," +
                "goods_id INTEGER NOT NULL," +
                "goods_name TEXT," +
                "quantity INTEGER," +
                "pack_type TEXT," +
                "weight REAL," +
                "status TEXT DEFAULT '待处理'," +
                "create_time TEXT," +
                "complete_time TEXT)");

        jdbc.execute("CREATE TABLE IF NOT EXISTS inventory_alert (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "goods_id INTEGER NOT NULL," +
                "goods_name TEXT," +
                "alert_type TEXT," +
                "threshold INTEGER," +
                "current_quantity INTEGER," +
                "status TEXT DEFAULT '未处理'," +
                "create_time TEXT)");
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
