package com.bonded.warehouse.mapper;

import com.bonded.warehouse.entity.Goods;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class GoodsMapper {

    private final JdbcTemplate jdbc;

    public GoodsMapper(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public List<Goods> findAll() {
        return jdbc.query("SELECT * FROM goods ORDER BY id", (rs, rowNum) -> {
            Goods g = new Goods();
            g.setId(rs.getLong("id"));
            g.setSku(rs.getString("sku"));
            g.setName(rs.getString("name"));
            g.setCategory(rs.getString("category"));
            g.setOriginCountry(rs.getString("origin_country"));
            g.setBrand(rs.getString("brand"));
            g.setSpecification(rs.getString("specification"));
            g.setUnit(rs.getString("unit"));
            g.setHsCode(rs.getString("hs_code"));
            g.setValue(rs.getDouble("value"));
            g.setStatus(rs.getString("status"));
            g.setCreateTime(rs.getString("create_time"));
            g.setUpdateTime(rs.getString("update_time"));
            return g;
        });
    }

    public Goods findById(Long id) {
        List<Goods> list = jdbc.query("SELECT * FROM goods WHERE id=?", (rs, rowNum) -> {
            Goods g = new Goods();
            g.setId(rs.getLong("id"));
            g.setSku(rs.getString("sku"));
            g.setName(rs.getString("name"));
            g.setCategory(rs.getString("category"));
            g.setOriginCountry(rs.getString("origin_country"));
            g.setBrand(rs.getString("brand"));
            g.setSpecification(rs.getString("specification"));
            g.setUnit(rs.getString("unit"));
            g.setHsCode(rs.getString("hs_code"));
            g.setValue(rs.getDouble("value"));
            g.setStatus(rs.getString("status"));
            g.setCreateTime(rs.getString("create_time"));
            g.setUpdateTime(rs.getString("update_time"));
            return g;
        }, id);
        return list.isEmpty() ? null : list.get(0);
    }

    public Goods findBySku(String sku) {
        List<Goods> list = jdbc.query("SELECT * FROM goods WHERE sku=?", (rs, rowNum) -> {
            Goods g = new Goods();
            g.setId(rs.getLong("id"));
            g.setSku(rs.getString("sku"));
            g.setName(rs.getString("name"));
            g.setCategory(rs.getString("category"));
            g.setOriginCountry(rs.getString("origin_country"));
            g.setBrand(rs.getString("brand"));
            g.setSpecification(rs.getString("specification"));
            g.setUnit(rs.getString("unit"));
            g.setHsCode(rs.getString("hs_code"));
            g.setValue(rs.getDouble("value"));
            g.setStatus(rs.getString("status"));
            g.setCreateTime(rs.getString("create_time"));
            g.setUpdateTime(rs.getString("update_time"));
            return g;
        }, sku);
        return list.isEmpty() ? null : list.get(0);
    }

    public int insert(Goods g) {
        return jdbc.update("INSERT INTO goods(sku,name,category,origin_country,brand,specification,unit,hs_code,value,status,create_time,update_time) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)",
                g.getSku(), g.getName(), g.getCategory(), g.getOriginCountry(), g.getBrand(),
                g.getSpecification(), g.getUnit(), g.getHsCode(), g.getValue(), g.getStatus(),
                g.getCreateTime(), g.getUpdateTime());
    }

    public int update(Goods g) {
        return jdbc.update("UPDATE goods SET sku=?,name=?,category=?,origin_country=?,brand=?,specification=?,unit=?,hs_code=?,value=?,status=?,update_time=? WHERE id=?",
                g.getSku(), g.getName(), g.getCategory(), g.getOriginCountry(), g.getBrand(),
                g.getSpecification(), g.getUnit(), g.getHsCode(), g.getValue(), g.getStatus(),
                g.getUpdateTime(), g.getId());
    }

    public int delete(Long id) {
        return jdbc.update("DELETE FROM goods WHERE id=?", id);
    }

    public List<Goods> findByCategory(String category) {
        return jdbc.query("SELECT * FROM goods WHERE category=? ORDER BY id", (rs, rowNum) -> {
            Goods g = new Goods();
            g.setId(rs.getLong("id"));
            g.setSku(rs.getString("sku"));
            g.setName(rs.getString("name"));
            g.setCategory(rs.getString("category"));
            g.setOriginCountry(rs.getString("origin_country"));
            g.setBrand(rs.getString("brand"));
            g.setSpecification(rs.getString("specification"));
            g.setUnit(rs.getString("unit"));
            g.setHsCode(rs.getString("hs_code"));
            g.setValue(rs.getDouble("value"));
            g.setStatus(rs.getString("status"));
            g.setCreateTime(rs.getString("create_time"));
            g.setUpdateTime(rs.getString("update_time"));
            return g;
        }, category);
    }
}
