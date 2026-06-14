package com.smartparking.controller;

import com.smartparking.service.DashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> overview() {
        Map<String, Object> data = dashboardService.getOverview();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", data));
    }

    @GetMapping("/today")
    public ResponseEntity<Map<String, Object>> today() {
        Map<String, Object> data = dashboardService.getTodayStats();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", data));
    }

    @GetMapping("/chart")
    public ResponseEntity<Map<String, Object>> chart() {
        Map<String, Object> data = dashboardService.getChartData();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", data));
    }
}
