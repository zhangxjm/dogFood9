package com.bonded.warehouse.mapper;

import com.bonded.warehouse.entity.InboundItem;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class InboundItemMapper {

    private final JdbcTemplate jdbc;

    public InboundItemMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private InboundItem mapRow(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        InboundItem item = new InboundItem();
        item.setId(rs.getLong("id"));
        item.setOrderId(rs.getLong("order_id"));
        item.setGoodsId(rs.getLong("goods_id"));
        item.setGoodsName(rs.getString("goods_name"));
        item.setQuantity(rs.getInt("quantity"));
        item.setLocationId(rs.getObject("location_id") != null ? rs.getLong("location_id") : null);
        item.setLocationCode(rs.getString("location_code"));
        return item;
    }

    public List<InboundItem> findByOrderId(Long orderId) {
        return jdbc.query("SELECT * FROM inbound_item WHERE order_id=?", this::mapRow, orderId);
    }

    public int insert(InboundItem item) {
        return jdbc.update("INSERT INTO inbound_item(order_id,goods_id,goods_name,quantity,location_id,location_code) VALUES(?,?,?,?,?,?)",
                item.getOrderId(), item.getGoodsId(), item.getGoodsName(), item.getQuantity(),
                item.getLocationId(), item.getLocationCode());
    }

    public InboundItem findById(Long id) {
        List<InboundItem> list = jdbc.query("SELECT * FROM inbound_item WHERE id=?", this::mapRow, id);
        return list.isEmpty() ? null : list.get(0);
    }
}
