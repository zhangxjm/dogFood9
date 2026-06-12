package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.entity.OutboundItem;
import com.bonded.warehouse.entity.OutboundOrder;
import com.bonded.warehouse.service.OutboundService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/outbound")
public class OutboundController {

    private final OutboundService outboundService;

    public OutboundController(OutboundService outboundService) {
        this.outboundService = outboundService;
    }

    @GetMapping("/list")
    public Result<List<OutboundOrder>> list() {
        return Result.success(outboundService.list());
    }

    @GetMapping("/{id}")
    public Result<OutboundOrder> getById(@PathVariable Long id) {
        OutboundOrder order = outboundService.getById(id);
        if (order == null) {
            return Result.fail(404, "出库单不存在");
        }
        return Result.success(order);
    }

    @PostMapping
    public Result<OutboundOrder> create(@RequestBody Map<String, Object> params) {
        OutboundOrder order = new OutboundOrder();
        order.setOrderNo((String) params.get("orderNo"));
        order.setTotalQuantity((Integer) params.get("totalQuantity"));
        order.setOperator((String) params.get("operator"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemList = (List<Map<String, Object>>) params.get("items");
        List<OutboundItem> items = null;
        if (itemList != null) {
            items = new java.util.ArrayList<>();
            for (Map<String, Object> itemMap : itemList) {
                OutboundItem item = new OutboundItem();
                item.setGoodsId(((Number) itemMap.get("goodsId")).longValue());
                item.setGoodsName((String) itemMap.get("goodsName"));
                item.setQuantity((Integer) itemMap.get("quantity"));
                items.add(item);
            }
        }
        return Result.success(outboundService.create(order, items));
    }

    @PostMapping("/{id}/complete")
    public Result<Integer> complete(@PathVariable Long id) {
        return Result.success(outboundService.complete(id));
    }
}
