package com.bonded.warehouse.service;

import com.bonded.warehouse.entity.Goods;
import com.bonded.warehouse.mapper.GoodsMapper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class GoodsService {

    private final GoodsMapper goodsMapper;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public GoodsService(GoodsMapper goodsMapper) {
        this.goodsMapper = goodsMapper;
    }

    public List<Goods> list() {
        return goodsMapper.findAll();
    }

    public Goods getById(Long id) {
        return goodsMapper.findById(id);
    }

    public Goods getBySku(String sku) {
        return goodsMapper.findBySku(sku);
    }

    public int create(Goods goods) {
        String now = LocalDateTime.now().format(FMT);
        goods.setCreateTime(now);
        goods.setUpdateTime(now);
        if (goods.getStatus() == null) {
            goods.setStatus("正常");
        }
        return goodsMapper.insert(goods);
    }

    public int update(Goods goods) {
        goods.setUpdateTime(LocalDateTime.now().format(FMT));
        return goodsMapper.update(goods);
    }

    public int delete(Long id) {
        return goodsMapper.delete(id);
    }

    public List<Goods> listByCategory(String category) {
        return goodsMapper.findByCategory(category);
    }
}
