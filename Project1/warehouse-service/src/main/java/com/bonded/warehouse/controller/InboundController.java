package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.entity.Goods;
import com.bonded.warehouse.entity.InboundItem;
import com.bonded.warehouse.entity.InboundOrder;
import com.bonded.warehouse.mapper.GoodsMapper;
import com.bonded.warehouse.service.InboundService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

@RestController
@RequestMapping("/inbound")
public class InboundController {

    private final InboundService inboundService;
    private final GoodsMapper goodsMapper;
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final AtomicInteger SEQ = new AtomicInteger(0);

    public InboundController(InboundService inboundService, GoodsMapper goodsMapper) {
        this.inboundService = inboundService;
        this.goodsMapper = goodsMapper;
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
        String orderNo = (String) params.get("orderNo");
        if (orderNo == null || orderNo.isBlank()) {
            orderNo = "RK" + LocalDateTime.now().format(FMT) + String.format("%03d", SEQ.incrementAndGet() % 1000);
        }
        order.setOrderNo(orderNo);
        order.setSupplier((String) params.get("supplier"));
        order.setTotalQuantity(params.get("totalQuantity") != null ? ((Number) params.get("totalQuantity")).intValue() : 0);
        order.setTotalValue(params.get("totalValue") != null ? ((Number) params.get("totalValue")).doubleValue() : 0);
        order.setOperator((String) params.get("operator"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemList = (List<Map<String, Object>>) params.get("items");
        List<InboundItem> items = null;
        if (itemList != null) {
            items = new java.util.ArrayList<>();
            for (Map<String, Object> itemMap : itemList) {
                InboundItem item = new InboundItem();
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
        return Result.success(inboundService.create(order, items));
    }

    @PostMapping("/{id}/complete")
    public Result<Integer> complete(@PathVariable Long id) {
        return Result.success(inboundService.complete(id));
    }
}
