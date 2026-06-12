package com.bonded.order.controller;

import com.bonded.common.result.Result;
import com.bonded.order.entity.Order;
import com.bonded.order.entity.OrderItem;
import com.bonded.order.service.OrderService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/order")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @GetMapping("/list")
    public Result<List<Order>> list() {
        return Result.success(orderService.list());
    }

    @GetMapping("/{id}")
    public Result<Order> getById(@PathVariable Long id) {
        Order order = orderService.getById(id);
        if (order == null) {
            return Result.fail(404, "订单不存在");
        }
        return Result.success(order);
    }

    @GetMapping("/no/{orderNo}")
    public Result<Order> getByOrderNo(@PathVariable String orderNo) {
        Order order = orderService.getByOrderNo(orderNo);
        if (order == null) {
            return Result.fail(404, "订单不存在");
        }
        return Result.success(order);
    }

    @PostMapping
    public Result<Order> create(@RequestBody Map<String, Object> body) {
        Order order = new Order();
        order.setBuyerName((String) body.get("buyerName"));
        order.setBuyerIdNo((String) body.get("buyerIdNo"));
        order.setBuyerPhone((String) body.get("buyerPhone"));
        if (body.get("currency") != null) {
            order.setCurrency((String) body.get("currency"));
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> itemMaps = (List<Map<String, Object>>) body.get("items");
        List<OrderItem> items = new java.util.ArrayList<>();
        if (itemMaps != null) {
            for (Map<String, Object> m : itemMaps) {
                OrderItem item = new OrderItem();
                item.setGoodsId(Long.valueOf(m.get("goodsId").toString()));
                item.setGoodsName((String) m.get("goodsName"));
                item.setSku((String) m.get("sku"));
                item.setQuantity(Integer.valueOf(m.get("quantity").toString()));
                item.setPrice(Double.valueOf(m.get("price").toString()));
                items.add(item);
            }
        }

        Order created = orderService.create(order, items);
        return Result.success(created);
    }

    @PutMapping("/{id}/status")
    public Result<Void> updateStatus(@PathVariable Long id,
                                     @RequestParam(required = false) String status,
                                     @RequestBody(required = false) Map<String, String> body) {
        if (status == null && body != null) {
            status = body.get("status");
        }
        boolean ok = orderService.updateStatus(id, status);
        return ok ? Result.success() : Result.fail("更新订单状态失败");
    }

    @PutMapping("/{id}/payment-status")
    public Result<Void> updatePaymentStatus(@PathVariable Long id,
                                            @RequestParam(required = false) String paymentStatus,
                                            @RequestBody(required = false) Map<String, String> body) {
        if (paymentStatus == null && body != null) {
            paymentStatus = body.get("paymentStatus");
        }
        boolean ok = orderService.updatePaymentStatus(id, paymentStatus);
        return ok ? Result.success() : Result.fail("更新支付状态失败");
    }

    @PutMapping("/{id}/logistics-status")
    public Result<Void> updateLogisticsStatus(@PathVariable Long id,
                                              @RequestParam(required = false) String logisticsStatus,
                                              @RequestBody(required = false) Map<String, String> body) {
        if (logisticsStatus == null && body != null) {
            logisticsStatus = body.get("logisticsStatus");
        }
        boolean ok = orderService.updateLogisticsStatus(id, logisticsStatus);
        return ok ? Result.success() : Result.fail("更新物流状态失败");
    }

    @PutMapping("/{id}/customs-status")
    public Result<Void> updateCustomsStatus(@PathVariable Long id,
                                            @RequestParam(required = false) String customsStatus,
                                            @RequestBody(required = false) Map<String, String> body) {
        if (customsStatus == null && body != null) {
            customsStatus = body.get("customsStatus");
        }
        boolean ok = orderService.updateCustomsStatus(id, customsStatus);
        return ok ? Result.success() : Result.fail("更新清关状态失败");
    }

    @GetMapping("/status/{status}")
    public Result<List<Order>> listByStatus(@PathVariable String status) {
        return Result.success(orderService.listByStatus(status));
    }

    @GetMapping("/statistics")
    public Result<Map<String, Integer>> statistics() {
        return Result.success(orderService.getOrderStatistics());
    }

    @GetMapping("/paged")
    public Result<Map<String, Object>> listPaged(@RequestParam(defaultValue = "1") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        List<Order> orders = orderService.listPaged(page, size);
        Map<String, Object> result = new HashMap<>();
        result.put("list", orders);
        result.put("page", page);
        result.put("size", size);
        return Result.success(result);
    }
}
