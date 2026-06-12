package com.bonded.warehouse.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final JdbcTemplate jdbc;

    public DataInitializer(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM goods", Integer.class);
        if (count != null && count > 0) {
            return;
        }

        initGoods();
        initLocations();
        initInboundOrders();
        initOutboundOrders();
        initSortTasks();
        initPackTasks();
        initAlerts();
    }

    private void initGoods() {
        Object[][] goods = {
                {"SKU001", "兰蔻小黑瓶精华液", "化妆品", "法国", "兰蔻", "50ml", "瓶", "3304990090", 899.0, "正常"},
                {"SKU002", "雅诗兰黛眼霜", "化妆品", "美国", "雅诗兰黛", "15ml", "瓶", "3304990090", 599.0, "正常"},
                {"SKU003", "SK-II神仙水", "化妆品", "日本", "SK-II", "230ml", "瓶", "3304990090", 1199.0, "正常"},
                {"SKU004", "迪奥口红", "化妆品", "法国", "迪奥", "3.5g", "支", "3304990090", 320.0, "正常"},
                {"SKU005", "资生堂防晒霜", "化妆品", "日本", "资生堂", "50ml", "瓶", "3304990090", 259.0, "正常"},
                {"SKU006", "惠氏启赋奶粉1段", "奶粉", "爱尔兰", "惠氏", "900g", "罐", "0402210000", 368.0, "正常"},
                {"SKU007", "美素佳儿奶粉2段", "奶粉", "荷兰", "美素佳儿", "900g", "罐", "0402210000", 298.0, "正常"},
                {"SKU008", "爱他美奶粉3段", "奶粉", "德国", "爱他美", "800g", "罐", "0402210000", 268.0, "正常"},
                {"SKU009", "飞鹤星飞帆奶粉", "奶粉", "中国", "飞鹤", "700g", "罐", "0402210000", 248.0, "正常"},
                {"SKU010", "a2奶粉1段", "奶粉", "新西兰", "a2", "900g", "罐", "0402210000", 398.0, "正常"},
                {"SKU011", "Swisse维C泡腾片", "保健品", "澳大利亚", "Swisse", "60片", "瓶", "2106909090", 129.0, "正常"},
                {"SKU012", "Blackmores鱼油", "保健品", "澳大利亚", "Blackmores", "400粒", "瓶", "1504100000", 159.0, "正常"},
                {"SKU013", "Move Free氨糖", "保健品", "美国", "Move Free", "120粒", "瓶", "2106909090", 259.0, "正常"},
                {"SKU014", "汤臣倍健蛋白粉", "保健品", "中国", "汤臣倍健", "450g", "罐", "2106100000", 198.0, "正常"},
                {"SKU015", "澳洲袋鼠精", "保健品", "澳大利亚", "Healthy Care", "100粒", "瓶", "2106909090", 189.0, "正常"},
                {"SKU016", "花王纸尿裤NB", "母婴用品", "日本", "花王", "90片", "包", "4818400000", 149.0, "正常"},
                {"SKU017", "大王纸尿裤S", "母婴用品", "日本", "大王", "120片", "包", "4818400000", 139.0, "正常"},
                {"SKU018", "贝亲奶瓶", "母婴用品", "日本", "贝亲", "240ml", "个", "7013100000", 99.0, "正常"},
                {"SKU019", "NUK安抚奶嘴", "母婴用品", "德国", "NUK", "0-6月", "个", "3926909090", 49.0, "正常"},
                {"SKU020", "婴儿辅食米粉", "母婴用品", "中国", "亨氏", "225g", "盒", "1901100000", 39.0, "正常"},
                {"SKU021", "奔富红酒Bin389", "酒类", "澳大利亚", "奔富", "750ml", "瓶", "2204210000", 468.0, "正常"},
                {"SKU022", "拉菲红酒", "酒类", "法国", "拉菲", "750ml", "瓶", "2204210000", 899.0, "正常"},
                {"SKU023", "象印保温杯", "日用品", "日本", "象印", "500ml", "个", "7323930000", 259.0, "正常"}
        };

        for (Object[] g : goods) {
            jdbc.update("INSERT INTO goods(sku,name,category,origin_country,brand,specification,unit,hs_code,value,status,create_time,update_time) VALUES(?,?,?,?,?,?,?,?,?,?,datetime('now','localtime'),datetime('now','localtime'))",
                    g[0], g[1], g[2], g[3], g[4], g[5], g[6], g[7], g[8], g[9]);
        }
    }

    private void initLocations() {
        String[] zones = {"A", "B", "C"};
        for (String zone : zones) {
            for (int row = 1; row <= 5; row++) {
                for (int col = 1; col <= 4; col++) {
                    for (int layer = 1; layer <= 2; layer++) {
                        jdbc.update("INSERT INTO warehouse_location(zone,row,column,layer,status,capacity,used_capacity,update_time) VALUES(?,?,?,?,?,?,?,datetime('now','localtime'))",
                                zone, String.valueOf(row), String.valueOf(col), String.valueOf(layer), "空闲", 100, 0);
                    }
                }
            }
        }
    }

    private void initInboundOrders() {
        Object[][] orders = {
                {"IN20260601001", "法国兰蔻供应商", 50, 44950.0, "待处理", "张明"},
                {"IN20260602001", "澳大利亚Swisse供应商", 100, 12890.0, "已完成", "李华"},
                {"IN20260603001", "日本花王供应商", 80, 11920.0, "待处理", "王芳"},
                {"IN20260604001", "荷兰美素佳儿供应商", 60, 17880.0, "已完成", "张明"},
                {"IN20260605001", "新西兰a2供应商", 40, 15920.0, "待处理", "李华"},
                {"IN20260606001", "美国雅诗兰黛供应商", 30, 17970.0, "已完成", "王芳"}
        };
        for (Object[] o : orders) {
            jdbc.update("INSERT INTO inbound_order(order_no,supplier,total_quantity,total_value,status,operator,create_time,complete_time) VALUES(?,?,?,?,?,?,datetime('now','localtime'),?)",
                    o[0], o[1], o[2], o[3], o[4], o[5],
                    o[4].equals("已完成") ? "2026-06-05 14:30:00" : null);
        }

        Object[][] items = {
                {1L, 1L, "兰蔻小黑瓶精华液", 30, 1L, "A-1-1-1"},
                {1L, 2L, "雅诗兰黛眼霜", 20, 2L, "A-1-1-2"},
                {2L, 11L, "Swisse维C泡腾片", 60, 3L, "B-1-1-1"},
                {2L, 12L, "Blackmores鱼油", 40, 4L, "B-1-1-2"},
                {3L, 16L, "花王纸尿裤NB", 50, 5L, "C-1-1-1"},
                {3L, 17L, "大王纸尿裤S", 30, 6L, "C-1-1-2"},
                {4L, 7L, "美素佳儿奶粉2段", 30, 7L, "A-2-1-1"},
                {4L, 8L, "爱他美奶粉3段", 30, 8L, "A-2-1-2"},
                {5L, 10L, "a2奶粉1段", 40, 9L, "B-2-1-1"},
                {6L, 2L, "雅诗兰黛眼霜", 15, 10L, "A-3-1-1"},
                {6L, 4L, "迪奥口红", 15, 11L, "A-3-1-2"}
        };
        for (Object[] i : items) {
            jdbc.update("INSERT INTO inbound_item(order_id,goods_id,goods_name,quantity,location_id,location_code) VALUES(?,?,?,?,?,?)",
                    i[0], i[1], i[2], i[3], i[4], i[5]);
        }
    }

    private void initOutboundOrders() {
        Object[][] orders = {
                {"OUT20260601001", 30, "已完成", "赵丽"},
                {"OUT20260602001", 20, "待处理", "孙伟"},
                {"OUT20260603001", 15, "待处理", "赵丽"}
        };
        for (Object[] o : orders) {
            jdbc.update("INSERT INTO outbound_order(order_no,total_quantity,status,operator,create_time,complete_time) VALUES(?,?,?,?,datetime('now','localtime'),?)",
                    o[0], o[1], o[2], o[3],
                    o[2].equals("已完成") ? "2026-06-04 16:20:00" : null);
        }

        Object[][] items = {
                {1L, 11L, "Swisse维C泡腾片", 20, 3L, "B-1-1-1"},
                {1L, 16L, "花王纸尿裤NB", 10, 5L, "C-1-1-1"},
                {2L, 6L, "惠氏启赋奶粉1段", 10, null, null},
                {2L, 1L, "兰蔻小黑瓶精华液", 10, null, null},
                {3L, 4L, "迪奥口红", 15, 11L, "A-3-1-2"}
        };
        for (Object[] i : items) {
            jdbc.update("INSERT INTO outbound_item(order_id,goods_id,goods_name,quantity,location_id,location_code) VALUES(?,?,?,?,?,?)",
                    i[0], i[1], i[2], i[3], i[4], i[5]);
        }
    }

    private void initSortTasks() {
        Object[][] tasks = {
                {2L, 11L, "Swisse维C泡腾片", "收货区", "B-1-1-1", 60, "已完成"},
                {2L, 12L, "Blackmores鱼油", "收货区", "B-1-1-2", 40, "已完成"},
                {4L, 7L, "美素佳儿奶粉2段", "收货区", "A-2-1-1", 30, "已完成"},
                {4L, 8L, "爱他美奶粉3段", "收货区", "A-2-1-2", 30, "待处理"},
                {5L, 10L, "a2奶粉1段", "收货区", "B-2-1-1", 40, "待处理"}
        };
        for (Object[] t : tasks) {
            jdbc.update("INSERT INTO sort_task(order_id,goods_id,goods_name,from_location,to_location,quantity,status,create_time,complete_time) VALUES(?,?,?,?,?,?,?,datetime('now','localtime'),?)",
                    t[0], t[1], t[2], t[3], t[4], t[5], t[6],
                    t[6].equals("已完成") ? "2026-06-05 14:35:00" : null);
        }
    }

    private void initPackTasks() {
        Object[][] tasks = {
                {2L, 11L, "Swisse维C泡腾片", 60, "标准包装", 3.0, "已完成"},
                {2L, 12L, "Blackmores鱼油", 40, "标准包装", 2.0, "待处理"},
                {4L, 7L, "美素佳儿奶粉2段", 30, "加固包装", 15.0, "已完成"},
                {5L, 10L, "a2奶粉1段", 40, "加固包装", 20.0, "待处理"}
        };
        for (Object[] t : tasks) {
            jdbc.update("INSERT INTO pack_task(order_id,goods_id,goods_name,quantity,pack_type,weight,status,create_time,complete_time) VALUES(?,?,?,?,?,?,?,datetime('now','localtime'),?)",
                    t[0], t[1], t[2], t[3], t[4], t[5], t[6],
                    t[6].equals("已完成") ? "2026-06-05 15:00:00" : null);
        }
    }

    private void initAlerts() {
        Object[][] alerts = {
                {9L, "飞鹤星飞帆奶粉", "库存不足", 10, 0, "未处理"},
                {14L, "汤臣倍健蛋白粉", "库存不足", 10, 0, "未处理"},
                {20L, "婴儿辅食米粉", "库存不足", 10, 0, "已处理"}
        };
        for (Object[] a : alerts) {
            jdbc.update("INSERT INTO inventory_alert(goods_id,goods_name,alert_type,threshold,current_quantity,status,create_time) VALUES(?,?,?,?,?,?,datetime('now','localtime'))",
                    a[0], a[1], a[2], a[3], a[4], a[5]);
        }
    }
}
