package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.entity.InventoryAlert;
import com.bonded.warehouse.service.InventoryAlertService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/alert")
public class InventoryAlertController {

    private final InventoryAlertService alertService;

    public InventoryAlertController(InventoryAlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping("/list")
    public Result<List<InventoryAlert>> list() {
        return Result.success(alertService.list());
    }

    @GetMapping("/pending")
    public Result<List<InventoryAlert>> listPending() {
        return Result.success(alertService.listPending());
    }

    @PostMapping("/check")
    public Result<Integer> check() {
        return Result.success(alertService.checkAndAlert());
    }

    @PostMapping
    public Result<Integer> createAlert(@RequestBody Map<String, Object> params) {
        Long goodsId = ((Number) params.get("goodsId")).longValue();
        String alertType = (String) params.get("alertType");
        Integer threshold = (Integer) params.get("threshold");
        return Result.success(alertService.createAlert(goodsId, alertType, threshold));
    }

    @PostMapping("/{id}/resolve")
    public Result<Integer> resolveAlert(@PathVariable Long id) {
        return Result.success(alertService.resolveAlert(id));
    }
}
