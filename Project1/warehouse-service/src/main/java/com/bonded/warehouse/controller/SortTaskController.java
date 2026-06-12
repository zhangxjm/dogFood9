package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.entity.SortTask;
import com.bonded.warehouse.service.SortTaskService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/sort")
public class SortTaskController {

    private final SortTaskService sortTaskService;

    public SortTaskController(SortTaskService sortTaskService) {
        this.sortTaskService = sortTaskService;
    }

    @GetMapping("/list")
    public Result<List<SortTask>> list() {
        return Result.success(sortTaskService.list());
    }

    @GetMapping("/order/{orderId}")
    public Result<List<SortTask>> getByOrderId(@PathVariable Long orderId) {
        return Result.success(sortTaskService.getByOrderId(orderId));
    }

    @PostMapping("/{id}/complete")
    public Result<Integer> complete(@PathVariable Long id) {
        return Result.success(sortTaskService.complete(id));
    }
}
