package com.bonded.order.mapper;

import com.bonded.order.entity.OrderItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class OrderItemMapper {

    private final JdbcTemplate jdbc;

    public OrderItemMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private OrderItem mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        OrderItem item = new OrderItem();
        item.setId(rs.getLong("id"));
        item.setOrderId(rs.getLong("order_id"));
        item.setGoodsId(rs.getLong("goods_id"));
        item.setGoodsName(rs.getString("goods_name"));
        item.setSku(rs.getString("sku"));
        item.setQuantity(rs.getInt("quantity"));
        item.setPrice(rs.getDouble("price"));
        item.setAmount(rs.getDouble("amount"));
        return item;
    }

    public List<OrderItem> findByOrderId(Long orderId) {
        return jdbc.query("SELECT * FROM t_order_item WHERE order_id = ?", this::mapRow, orderId);
    }

    public int insert(OrderItem item) {
        return jdbc.update(
            "INSERT INTO t_order_item (order_id, goods_id, goods_name, sku, quantity, price, amount) VALUES (?,?,?,?,?,?,?)",
            item.getOrderId(), item.getGoodsId(), item.getGoodsName(), item.getSku(),
            item.getQuantity(), item.getPrice(), item.getAmount()
        );
    }

    public OrderItem findById(Long id) {
        List<OrderItem> list = jdbc.query("SELECT * FROM t_order_item WHERE id = ?", this::mapRow, id);
        return list.isEmpty() ? null : list.get(0);
    }
}
