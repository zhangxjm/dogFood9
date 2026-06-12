package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.entity.InboundItem;
import com.bonded.warehouse.entity.InboundOrder;
import com.bonded.warehouse.service.InboundService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/inbound")
public class InboundController {

    private final InboundService inboundService;

    public InboundController(InboundService inboundService) {
        this.inboundService = inboundService;
    }

    @GetMapping("/list")
    public Result<List<InboundOrder>> list() {
        return Result.success(inboundService.list());
    }

    @GetMapping("/{id}")
    public Result<InboundOrder> getById(@PathVariable Long id) {
        InboundOrder order = inboundService.getById(id);
        if (order == null) {
            return Result.fail(404, "入库单不存在");
        }
        return Result.success(order);
    }

    @PostMapping
    public Result<InboundOrder> create(@RequestBody Map<String, Object> params) {
        InboundOrder order = new InboundOrder();
        order.setOrderNo((String) params.get("orderNo"));
        order.setSupplier((String) params.get("supplier"));
        order.setTotalQuantity((Integer) params.get("totalQuantity"));
        order.setTotalValue(params.get("totalValue") != null ? ((Number) params.get("totalValue")).doubleValue() : 0);
        order.setOperator((String) params.get("operator"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemList = (List<Map<String, Object>>) params.get("items");
        List<InboundItem> items = null;
        if (itemList != null) {
            items = new java.util.ArrayList<>();
            for (Map<String, Object> itemMap : itemList) {
                InboundItem item = new InboundItem();
                item.setGoodsId(((Number) itemMap.get("goodsId")).longValue());
                item.setGoodsName((String) itemMap.get("goodsName"));
                item.setQuantity((Integer) itemMap.get("quantity"));
                items.add(item);
            }
        }
        return Result.success(inboundService.create(order, items));
    }

    @PostMapping("/{id}/complete")
    public Result<Integer> complete(@PathVariable Long id) {
        return Result.success(inboundService.complete(id));
    }
}
