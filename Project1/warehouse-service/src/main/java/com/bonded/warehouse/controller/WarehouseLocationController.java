package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.entity.WarehouseLocation;
import com.bonded.warehouse.service.WarehouseLocationService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/location")
public class WarehouseLocationController {

    private final WarehouseLocationService locationService;

    public WarehouseLocationController(WarehouseLocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/list")
    public Result<List<WarehouseLocation>> list() {
        return Result.success(locationService.list());
    }

    @GetMapping("/{id}")
    public Result<WarehouseLocation> getById(@PathVariable Long id) {
        WarehouseLocation loc = locationService.getById(id);
        if (loc == null) {
            return Result.fail(404, "库位不存在");
        }
        return Result.success(loc);
    }

    @PostMapping
    public Result<Integer> create(@RequestBody WarehouseLocation location) {
        return Result.success(locationService.create(location));
    }

    @PutMapping
    public Result<Integer> update(@RequestBody WarehouseLocation location) {
        return Result.success(locationService.update(location));
    }

    @GetMapping("/available")
    public Result<List<WarehouseLocation>> listAvailable() {
        return Result.success(locationService.listAvailable());
    }

    @PostMapping("/assign")
    public Result<Integer> assignGoods(@RequestBody Map<String, Long> params) {
        Long goodsId = params.get("goodsId");
        Long locationId = params.get("locationId");
        return Result.success(locationService.assignGoods(goodsId, locationId));
    }

    @PostMapping("/optimize")
    public Result<List<WarehouseLocation>> optimizeLocations() {
        return Result.success(locationService.optimizeLocations());
    }
}
