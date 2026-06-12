package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.entity.Goods;
import com.bonded.warehouse.entity.OutboundItem;
import com.bonded.warehouse.entity.OutboundOrder;
import com.bonded.warehouse.mapper.GoodsMapper;
import com.bonded.warehouse.service.OutboundService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/outbound")
public class OutboundController {

    private final OutboundService outboundService;
    private final GoodsMapper goodsMapper;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final AtomicInteger SEQ = new AtomicInteger(0);

    public OutboundController(OutboundService outboundService, GoodsMapper goodsMapper) {
        this.outboundService = outboundService;
        this.goodsMapper = goodsMapper;
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
        String orderNo = (String) params.get("orderNo");
        if (orderNo == null || orderNo.isBlank()) {
            orderNo = "CK" + LocalDateTime.now().format(FMT) + String.format("%03d", SEQ.incrementAndGet() % 1000);
        }
        order.setOrderNo(orderNo);
        order.setTotalQuantity(params.get("totalQuantity") != null ? ((Number) params.get("totalQuantity")).intValue() : 0);
        order.setOperator((String) params.get("operator"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemList = (List<Map<String, Object>>) params.get("items");
        List<OutboundItem> items = null;
        if (itemList != null) {
            items = new java.util.ArrayList<>();
            for (Map<String, Object> itemMap : itemList) {
                OutboundItem item = new OutboundItem();
                long gid = ((Number) itemMap.get("goodsId")).longValue();
                item.setGoodsId(gid);
                String gn = (String) itemMap.get("goodsName");
                if (gn == null || gn.isBlank()) {
                    Goods goods = goodsMapper.findById(gid);
                    if (goods != null) {
                        gn = goods.getName();
                    }
                }
                item.setGoodsName(gn);
                item.setQuantity(itemMap.get("quantity") != null ? ((Number) itemMap.get("quantity")).intValue() : 0);
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
