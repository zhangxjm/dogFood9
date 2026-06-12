package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.entity.Goods;
import com.bonded.warehouse.service.GoodsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/goods")
public class GoodsController {

    private final GoodsService goodsService;

    public GoodsController(GoodsService goodsService) {
        this.goodsService = goodsService;
    }

    @GetMapping("/list")
    public Result<List<Goods>> list() {
        return Result.success(goodsService.list());
    }

    @GetMapping("/{id}")
    public Result<Goods> getById(@PathVariable Long id) {
        Goods goods = goodsService.getById(id);
        if (goods == null) {
            return Result.fail(404, "商品不存在");
        }
        return Result.success(goods);
    }

    @PostMapping
    public Result<Integer> create(@RequestBody Goods goods) {
        return Result.success(goodsService.create(goods));
    }

    @PutMapping
    public Result<Integer> update(@RequestBody Goods goods) {
        return Result.success(goodsService.update(goods));
    }

    @DeleteMapping("/{id}")
    public Result<Integer> delete(@PathVariable Long id) {
        return Result.success(goodsService.delete(id));
    }

    @GetMapping("/category/{category}")
    public Result<List<Goods>> listByCategory(@PathVariable String category) {
        return Result.success(goodsService.listByCategory(category));
    }
}
