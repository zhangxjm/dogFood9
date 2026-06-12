package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.entity.PackTask;
import com.bonded.warehouse.service.PackTaskService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/pack")
public class PackTaskController {

    private final PackTaskService packTaskService;

    public PackTaskController(PackTaskService packTaskService) {
        this.packTaskService = packTaskService;
    }

    @GetMapping("/list")
    public Result<List<PackTask>> list() {
        return Result.success(packTaskService.list());
    }

    @GetMapping("/order/{orderId}")
    public Result<List<PackTask>> getByOrderId(@PathVariable Long orderId) {
        return Result.success(packTaskService.getByOrderId(orderId));
    }

    @PostMapping("/{id}/complete")
    public Result<Integer> complete(@PathVariable Long id) {
        return Result.success(packTaskService.complete(id));
    }
}
