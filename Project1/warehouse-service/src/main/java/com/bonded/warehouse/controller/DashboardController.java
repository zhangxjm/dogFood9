package com.bonded.warehouse.controller;

import com.bonded.common.result.Result;
import com.bonded.warehouse.service.WarehouseDashboardService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    private final WarehouseDashboardService dashboardService;

    public DashboardController(WarehouseDashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @GetMapping
    public Result<Map<String, Object>> getDashboard() {
        return Result.success(dashboardService.getDashboard());
    }
}
