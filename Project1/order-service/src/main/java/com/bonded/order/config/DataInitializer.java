package com.bonded.order.config;

import com.bonded.order.entity.Logistics;
import com.bonded.order.entity.Order;
import com.bonded.order.entity.OrderItem;
import com.bonded.order.entity.Payment;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public DataInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM t_order", Integer.class);
        if (count != null && count > 0) {
            return;
        }

        String[][] orderData = {
            {"张三", "110101199001011234", "13800001001", "299.00", "CNY", "已支付", "已支付", "未发货", "未申报"},
            {"李四", "110101199002021234", "13800001002", "599.00", "CNY", "已支付", "已支付", "已发货", "已申报"},
            {"王五", "110101199003031234", "13800001003", "1599.00", "CNY", "已完成", "已支付", "已签收", "已放行"},
            {"赵六", "110101199004041234", "13800001004", "89.00", "CNY", "已取消", "已退款", "未发货", "未申报"},
            {"钱七", "110101199005051234", "13800001005", "459.00", "CNY", "待支付", "未支付", "未发货", "未申报"},
            {"孙八", "110101199006061234", "13800001006", "789.00", "CNY", "已支付", "已支付", "未发货", "已申报"},
            {"周九", "110101199007071234", "13800001007", "199.00", "CNY", "已支付", "已支付", "已发货", "已申报"},
            {"吴十", "110101199008081234", "13800001008", "1299.00", "CNY", "已完成", "已支付", "已签收", "已放行"},
            {"郑十一", "110101199009091234", "13800001009", "399.00", "CNY", "待支付", "未支付", "未发货", "未申报"},
            {"陈十二", "110101199010101234", "13800001010", "699.00", "CNY", "已支付", "已支付", "已发货", "已申报"},
            {"林十三", "110101199101111234", "13800001011", "259.00", "CNY", "已完成", "已支付", "已签收", "已放行"},
            {"黄十四", "110101199102121234", "13800001012", "1099.00", "CNY", "已取消", "已退款", "未发货", "未申报"},
            {"何十五", "110101199103131234", "13800001013", "549.00", "CNY", "待支付", "未支付", "未发货", "未申报"},
            {"罗十六", "110101199104141234", "13800001014", "899.00", "CNY", "已支付", "已支付", "未发货", "已申报"},
            {"梁十七", "110101199105151234", "13800001015", "349.00", "CNY", "已支付", "已支付", "已发货", "已申报"},
            {"宋十八", "110101199106161234", "13800001016", "1499.00", "CNY", "已完成", "已支付", "已签收", "已放行"},
            {"唐十九", "110101199107171234", "13800001017", "199.00", "CNY", "待支付", "未支付", "未发货", "未申报"},
            {"许二十", "110101199108181234", "13800001018", "799.00", "CNY", "已支付", "已支付", "已发货", "已申报"},
            {"韩廿一", "110101199109191234", "13800001019", "459.00", "CNY", "已完成", "已支付", "已签收", "已放行"},
            {"冯廿二", "110101199110201234", "13800001020", "649.00", "CNY", "已取消", "已退款", "未发货", "未申报"},
            {"董廿三", "110101199201211234", "13800001021", "999.00", "CNY", "待支付", "未支付", "未发货", "未申报"},
            {"程廿四", "110101199202221234", "13800001022", "559.00", "CNY", "已支付", "已支付", "未发货", "已申报"},
            {"曹廿五", "110101199203231234", "13800001023", "329.00", "CNY", "已支付", "已支付", "已发货", "已申报"},
            {"袁廿六", "110101199204241234", "13800001024", "1199.00", "CNY", "已完成", "已支付", "已签收", "已放行"},
            {"邓廿七", "110101199205251234", "13800001025", "249.00", "CNY", "待支付", "未支付", "未发货", "未申报"},
            {"萧廿八", "110101199206261234", "13800001026", "879.00", "CNY", "已支付", "已支付", "已发货", "已申报"},
            {"田廿九", "110101199207271234", "13800001027", "499.00", "CNY", "已完成", "已支付", "已签收", "已放行"},
            {"潘三十", "110101199208281234", "13800001028", "369.00", "CNY", "已取消", "已退款", "未发货", "未申报"},
            {"蒋三十一", "110101199209291234", "13800001029", "759.00", "CNY", "待支付", "未支付", "未发货", "未申报"},
            {"蔡三十二", "110101199210301234", "13800001030", "659.00", "CNY", "已支付", "已支付", "未发货", "已申报"},
            {"魏三十三", "110101199301311234", "13800001031", "439.00", "CNY", "已支付", "已支付", "已发货", "已申报"},
        };

        LocalDateTime baseTime = LocalDateTime.of(2025, 1, 1, 10, 0, 0);
        String[][] goodsList = {
            {"进口奶粉", "SKU-MILK-001", "199.00"},
            {"进口红酒", "SKU-WINE-001", "299.00"},
            {"进口巧克力", "SKU-CHOC-001", "89.00"},
            {"进口橄榄油", "SKU-OIL-001", "159.00"},
            {"进口蜂蜜", "SKU-HONEY-001", "129.00"},
            {"进口咖啡", "SKU-COFFEE-001", "79.00"},
            {"进口麦片", "SKU-OAT-001", "59.00"},
            {"进口饼干", "SKU-BISCUIT-001", "49.00"},
        };

        for (int i = 0; i < orderData.length; i++) {
            String[] d = orderData[i];
            String orderNo = "ORD2025010" + String.format("%03d", i + 1);
            LocalDateTime createTime = baseTime.plusHours(i);
            String status = d[5];
            String paymentStatus = d[6];
            String logisticsStatus = d[7];
            String customsStatus = d[8];

            String payTime = paymentStatus.equals("已支付") ? createTime.plusHours(1).format(FMT) : null;
            String shipTime = logisticsStatus.equals("已发货") || logisticsStatus.equals("已签收") ? createTime.plusHours(24).format(FMT) : null;
            String completeTime = logisticsStatus.equals("已签收") ? createTime.plusHours(72).format(FMT) : null;

            jdbcTemplate.update(
                "INSERT INTO t_order (order_no, buyer_name, buyer_id_no, buyer_phone, total_amount, currency, status, payment_status, logistics_status, customs_status, version, create_time, pay_time, ship_time, complete_time) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                orderNo, d[0], d[1], d[2], Double.parseDouble(d[3]), d[4], status, paymentStatus, logisticsStatus, customsStatus, 1, createTime.format(FMT), payTime, shipTime, completeTime
            );

            Long orderId = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Long.class);

            String[] g = goodsList[i % goodsList.length];
            int qty = (i % 3) + 1;
            double price = Double.parseDouble(g[2]);
            double amount = price * qty;
            jdbcTemplate.update(
                "INSERT INTO t_order_item (order_id, goods_id, goods_name, sku, quantity, price, amount) VALUES (?,?,?,?,?,?,?)",
                orderId, (long) (i + 1), g[0], g[1], qty, price, amount
            );

            if (paymentStatus.equals("已支付")) {
                String paymentNo = "PAY" + System.currentTimeMillis() + String.format("%03d", i + 1);
                String[] channels = {"支付宝", "微信支付", "银联支付"};
                String channel = channels[i % channels.length];
                jdbcTemplate.update(
                    "INSERT INTO t_payment (order_id, order_no, payment_no, payment_amount, payment_time, payment_channel, status) VALUES (?,?,?,?,?,?,?)",
                    orderId, orderNo, paymentNo, Double.parseDouble(d[3]), payTime, channel, "已支付"
                );
            } else if (paymentStatus.equals("已退款")) {
                String paymentNo = "PAY" + System.currentTimeMillis() + String.format("%03d", i + 1);
                String[] channels = {"支付宝", "微信支付", "银联支付"};
                String channel = channels[i % channels.length];
                jdbcTemplate.update(
                    "INSERT INTO t_payment (order_id, order_no, payment_no, payment_amount, payment_time, payment_channel, status) VALUES (?,?,?,?,?,?,?)",
                    orderId, orderNo, paymentNo, Double.parseDouble(d[3]), createTime.plusHours(1).format(FMT), channel, "已退款"
                );
            }

            if (logisticsStatus.equals("已发货") || logisticsStatus.equals("已签收")) {
                String trackingNo = "SF" + String.format("%012d", 100000000001L + i);
                String[] companies = {"顺丰速运", "中通快递", "圆通速递"};
                String company = companies[i % companies.length];
                String lStatus = logisticsStatus.equals("已签收") ? "已签收" : "运输中";
                jdbcTemplate.update(
                    "INSERT INTO t_logistics (order_id, order_no, tracking_no, logistics_company, status, receiver_name, receiver_phone, receiver_address, create_time, update_time) VALUES (?,?,?,?,?,?,?,?,?,?)",
                    orderId, orderNo, trackingNo, company, lStatus, d[0], d[2], "上海市浦东新区陆家嘴路" + (100 + i) + "号", shipTime, completeTime != null ? completeTime : shipTime
                );
            }
        }
    }
}
