package com.bonded.customs.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public DataInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        initCustomsRules();
        initCustomsDeclarations();
        initThreeDocuments();
        initCustomsLogs();
    }

    private void initCustomsRules() {
        List<Map<String, Object>> existing = jdbcTemplate.queryForList("SELECT COUNT(*) AS cnt FROM customs_rule");
        if (((Number) existing.get(0).get("cnt")).longValue() > 0) {
            return;
        }

        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "化妆品-护肤品", "33049900", 30.0, "进口化妆品需提供备案凭证", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "化妆品-彩妆", "33041000", 30.0, "进口彩妆需提供卫生许可", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "奶粉-婴幼儿配方", "19011010", 15.0, "婴幼儿配方奶粉需提供注册证书", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "奶粉-成人奶粉", "04022100", 10.0, "成人奶粉需提供检疫证明", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "保健品-维生素", "21069090", 20.0, "保健食品需提供蓝帽子批文", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "保健品-鱼油", "15041000", 20.0, "深海鱼油需提供原产地证明", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "婴儿纸尿裤", "96190011", 10.0, "纸尿裤需提供质检报告", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "婴儿辅食", "21069090", 15.0, "婴幼儿辅食需提供营养成分表", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "婴儿洗护用品", "33079000", 15.0, "婴儿洗护用品需提供无刺激性检测", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "营养补充剂-蛋白粉", "21061000", 20.0, "蛋白粉需提供成分检测报告", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "面部精华液", "33049900", 30.0, "面部精华需提供功效成分声明", "启用");
        jdbcTemplate.update("INSERT INTO customs_rule (rule_name, hs_code, tax_rate, regulation, status) VALUES (?, ?, ?, ?, ?)",
                "防晒霜", "33049900", 30.0, "防晒产品需提供SPF检测报告", "停用");
    }

    private void initCustomsDeclarations() {
        List<Map<String, Object>> existing = jdbcTemplate.queryForList("SELECT COUNT(*) AS cnt FROM customs_declaration");
        if (((Number) existing.get(0).get("cnt")).longValue() > 0) {
            return;
        }

        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());

        jdbcTemplate.update("INSERT INTO customs_declaration (declaration_no, order_no, buyer_name, buyer_id_no, seller_name, goods_summary, total_value, currency, status, create_time, audit_time, reject_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "BGD20260601001", "ORD20260601001", "张三", "310101199001011234", "海外美妆旗舰店", "兰蔻小黑瓶精华50ml×2", 899.0, "CNY", "已通过", "2026-06-01 10:00:00", "2026-06-01 10:30:00", null);
        jdbcTemplate.update("INSERT INTO customs_declaration (declaration_no, order_no, buyer_name, buyer_id_no, seller_name, goods_summary, total_value, currency, status, create_time, audit_time, reject_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "BGD20260602001", "ORD20260602001", "李四", "310101199202022345", "全球母婴精选", "爱他美奶粉3段×6", 1580.0, "CNY", "已通过", "2026-06-02 09:00:00", "2026-06-02 09:25:00", null);
        jdbcTemplate.update("INSERT INTO customs_declaration (declaration_no, order_no, buyer_name, buyer_id_no, seller_name, goods_summary, total_value, currency, status, create_time, audit_time, reject_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "BGD20260603001", "ORD20260603001", "王五", "310101199303033456", "健康生活馆", "Swisse鱼油胶囊200粒×3", 670.0, "CNY", "已驳回", "2026-06-03 14:00:00", "2026-06-03 14:20:00", "三单比对不一致：支付人姓名与订单购买人不匹配");
        jdbcTemplate.update("INSERT INTO customs_declaration (declaration_no, order_no, buyer_name, buyer_id_no, seller_name, goods_summary, total_value, currency, status, create_time, audit_time, reject_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "BGD20260604001", "ORD20260604001", "赵六", "310101199404044567", "日韩美妆馆", "SK-II神仙水230ml×1", 1250.0, "CNY", "待提交", "2026-06-04 11:00:00", null, null);
        jdbcTemplate.update("INSERT INTO customs_declaration (declaration_no, order_no, buyer_name, buyer_id_no, seller_name, goods_summary, total_value, currency, status, create_time, audit_time, reject_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "BGD20260605001", "ORD20260605001", "孙七", "310101199505055678", "全球母婴精选", "花王纸尿裤NB×8", 960.0, "CNY", "审核中", "2026-06-05 08:00:00", null, null);
        jdbcTemplate.update("INSERT INTO customs_declaration (declaration_no, order_no, buyer_name, buyer_id_no, seller_name, goods_summary, total_value, currency, status, create_time, audit_time, reject_reason) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                "BGD20260606001", "ORD20260606001", "周八", "310101199606066789", "海外美妆旗舰店", "雅诗兰黛眼霜15ml×2", 1100.0, "CNY", "已通过", "2026-06-06 15:00:00", "2026-06-06 15:22:00", null);
    }

    private void initThreeDocuments() {
        List<Map<String, Object>> existing = jdbcTemplate.queryForList("SELECT COUNT(*) AS cnt FROM three_document");
        if (((Number) existing.get(0).get("cnt")).longValue() > 0) {
            return;
        }

        jdbcTemplate.update("INSERT INTO three_document (order_id, order_no, order_document, payment_document, logistics_document, match_status, match_result, create_time, verify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                1L, "ORD20260601001",
                "{\"buyerName\":\"张三\",\"goods\":\"兰蔻小黑瓶精华50ml×2\",\"totalAmount\":899.0}",
                "{\"payerName\":\"张三\",\"paymentAmount\":899.0,\"paymentNo\":\"PAY20260601001\"}",
                "{\"receiverName\":\"张三\",\"goods\":\"兰蔻小黑瓶精华50ml×2\",\"trackingNo\":\"SF1234567890\"}",
                "一致", "三单比对通过", "2026-06-01 10:00:00", "2026-06-01 10:28:00");
        jdbcTemplate.update("INSERT INTO three_document (order_id, order_no, order_document, payment_document, logistics_document, match_status, match_result, create_time, verify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                2L, "ORD20260602001",
                "{\"buyerName\":\"李四\",\"goods\":\"爱他美奶粉3段×6\",\"totalAmount\":1580.0}",
                "{\"payerName\":\"李四\",\"paymentAmount\":1580.0,\"paymentNo\":\"PAY20260602001\"}",
                "{\"receiverName\":\"李四\",\"goods\":\"爱他美奶粉3段×6\",\"trackingNo\":\"SF2345678901\"}",
                "一致", "三单比对通过", "2026-06-02 09:00:00", "2026-06-02 09:23:00");
        jdbcTemplate.update("INSERT INTO three_document (order_id, order_no, order_document, payment_document, logistics_document, match_status, match_result, create_time, verify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                3L, "ORD20260603001",
                "{\"buyerName\":\"王五\",\"goods\":\"Swisse鱼油胶囊200粒×3\",\"totalAmount\":670.0}",
                "{\"payerName\":\"王五替\",\"paymentAmount\":670.0,\"paymentNo\":\"PAY20260603001\"}",
                "{\"receiverName\":\"王五\",\"goods\":\"Swisse鱼油胶囊200粒×3\",\"trackingNo\":\"SF3456789012\"}",
                "不一致", "支付人姓名[王五替]与订单购买人[王五]不匹配", "2026-06-03 14:00:00", "2026-06-03 14:18:00");
        jdbcTemplate.update("INSERT INTO three_document (order_id, order_no, order_document, payment_document, logistics_document, match_status, match_result, create_time, verify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                4L, "ORD20260604001",
                "{\"buyerName\":\"赵六\",\"goods\":\"SK-II神仙水230ml×1\",\"totalAmount\":1250.0}",
                "{\"payerName\":\"赵六\",\"paymentAmount\":1250.0,\"paymentNo\":\"PAY20260604001\"}",
                "{\"receiverName\":\"赵六\",\"goods\":\"SK-II神仙水230ml×1\",\"trackingNo\":\"SF4567890123\"}",
                "待比对", null, "2026-06-04 11:00:00", null);
        jdbcTemplate.update("INSERT INTO three_document (order_id, order_no, order_document, payment_document, logistics_document, match_status, match_result, create_time, verify_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                5L, "ORD20260605001",
                "{\"buyerName\":\"孙七\",\"goods\":\"花王纸尿裤NB×8\",\"totalAmount\":960.0}",
                "{\"payerName\":\"孙七\",\"paymentAmount\":960.0,\"paymentNo\":\"PAY20260605001\"}",
                "{\"receiverName\":\"孙七\",\"goods\":\"花王纸尿裤NB×8\",\"trackingNo\":\"SF5678901234\"}",
                "待比对", null, "2026-06-05 08:00:00", null);
    }

    private void initCustomsLogs() {
        List<Map<String, Object>> existing = jdbcTemplate.queryForList("SELECT COUNT(*) AS cnt FROM customs_log");
        if (((Number) existing.get(0).get("cnt")).longValue() > 0) {
            return;
        }

        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                1L, "创建申报", "创建清关申报单BGD20260601001", "系统", "2026-06-01 10:00:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                1L, "提交审核", "提交清关申报单待审核", "系统", "2026-06-01 10:05:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                1L, "三单比对", "三单比对结果：一致", "系统", "2026-06-01 10:28:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                1L, "审核通过", "清关申报自动审核通过", "系统", "2026-06-01 10:30:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                2L, "创建申报", "创建清关申报单BGD20260602001", "系统", "2026-06-02 09:00:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                2L, "提交审核", "提交清关申报单待审核", "系统", "2026-06-02 09:05:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                2L, "审核通过", "清关申报自动审核通过", "系统", "2026-06-02 09:25:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                3L, "创建申报", "创建清关申报单BGD20260603001", "系统", "2026-06-03 14:00:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                3L, "提交审核", "提交清关申报单待审核", "系统", "2026-06-03 14:05:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                3L, "三单比对", "三单比对结果：不一致，支付人姓名[王五替]与订单购买人[王五]不匹配", "系统", "2026-06-03 14:18:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                3L, "审核驳回", "清关申报审核驳回：三单比对不一致", "系统", "2026-06-03 14:20:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                6L, "创建申报", "创建清关申报单BGD20260606001", "系统", "2026-06-06 15:00:00");
        jdbcTemplate.update("INSERT INTO customs_log (declaration_id, action, detail, operator, create_time) VALUES (?, ?, ?, ?, ?)",
                6L, "审核通过", "清关申报自动审核通过", "系统", "2026-06-06 15:22:00");
    }
}
