package com.bonded.order.config;

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
        SqliteUtil.ensureDatabase("data/order.db");
        JdbcTemplate jt = new JdbcTemplate(dataSource);

        jt.execute("CREATE TABLE IF NOT EXISTS t_order (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_no TEXT NOT NULL UNIQUE," +
                "buyer_name TEXT," +
                "buyer_id_no TEXT," +
                "buyer_phone TEXT," +
                "total_amount REAL," +
                "currency TEXT DEFAULT 'CNY'," +
                "status TEXT DEFAULT '待支付'," +
                "payment_status TEXT DEFAULT '未支付'," +
                "logistics_status TEXT DEFAULT '未发货'," +
                "customs_status TEXT DEFAULT '未申报'," +
                "version INTEGER DEFAULT 1," +
                "create_time TEXT," +
                "pay_time TEXT," +
                "ship_time TEXT," +
                "complete_time TEXT)");

        jt.execute("CREATE TABLE IF NOT EXISTS t_order_item (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_id INTEGER NOT NULL," +
                "goods_id INTEGER," +
                "goods_name TEXT," +
                "sku TEXT," +
                "quantity INTEGER," +
                "price REAL," +
                "amount REAL)");

        jt.execute("CREATE TABLE IF NOT EXISTS t_payment (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_id INTEGER NOT NULL," +
                "order_no TEXT," +
                "payment_no TEXT NOT NULL UNIQUE," +
                "payment_amount REAL," +
                "payment_time TEXT," +
                "payment_channel TEXT," +
                "status TEXT DEFAULT '待支付')");

        jt.execute("CREATE TABLE IF NOT EXISTS t_logistics (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "order_id INTEGER NOT NULL," +
                "order_no TEXT," +
                "tracking_no TEXT," +
                "logistics_company TEXT," +
                "status TEXT DEFAULT '待揽收'," +
                "receiver_name TEXT," +
                "receiver_phone TEXT," +
                "receiver_address TEXT," +
                "create_time TEXT," +
                "update_time TEXT)");
    }

    @Bean
    public JdbcTemplate jdbcTemplate(DataSource dataSource) {
        return new JdbcTemplate(dataSource);
    }
}
