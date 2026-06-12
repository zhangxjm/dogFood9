package com.bonded.order.controller;

import com.bonded.common.result.Result;
import com.bonded.order.entity.Logistics;
import com.bonded.order.service.LogisticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/logistics")
public class LogisticsController {

    private final LogisticsService logisticsService;

    public LogisticsController(LogisticsService logisticsService) {
        this.logisticsService = logisticsService;
    }

    @GetMapping("/list")
    public Result<List<Logistics>> list() {
        return Result.success(logisticsService.list());
    }

    @GetMapping("/order/{orderId}")
    public Result<List<Logistics>> getByOrderId(@PathVariable Long orderId) {
        return Result.success(logisticsService.getByOrderId(orderId));
    }

    @GetMapping("/no/{orderNo}")
    public Result<List<Logistics>> getByOrderNo(@PathVariable String orderNo) {
        return Result.success(logisticsService.getByOrderNo(orderNo));
    }

    @PostMapping
    public Result<Logistics> create(@RequestBody Logistics logistics) {
        return Result.success(logisticsService.create(logistics));
    }

    @PostMapping("/ship/{orderId}")
    public Result<Logistics> shipOrder(@PathVariable Long orderId) {
        try {
            return Result.success(logisticsService.shipOrder(orderId));
        } catch (RuntimeException e) {
            return Result.fail(e.getMessage());
        }
    }
}
