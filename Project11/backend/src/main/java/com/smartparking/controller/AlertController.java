package com.smartparking.controller;

import com.smartparking.entity.AlertEvent;
import com.smartparking.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String status) {
        List<AlertEvent> alerts;
        if (type != null && status != null) {
            alerts = alertService.findByType(AlertEvent.AlertType.valueOf(type));
            alerts = alerts.stream()
                    .filter(a -> a.getStatus().name().equals(status))
                    .collect(Collectors.toList());
        } else if (type != null) {
            alerts = alertService.findByType(AlertEvent.AlertType.valueOf(type));
        } else if (status != null) {
            alerts = alertService.findByStatus(AlertEvent.AlertStatus.valueOf(status));
        } else {
            alerts = alertService.listAlerts();
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", alerts));
    }

    @PutMapping("/{id}/resolve")
    public ResponseEntity<Map<String, Object>> resolve(@PathVariable Long id) {
        AlertEvent alert = alertService.resolveAlert(id);
        if (alert == null) {
            return ResponseEntity.badRequest().body(Map.of("code", 404, "message", "告警不存在", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "告警已解决", "data", alert));
    }

    @GetMapping("/types")
    public ResponseEntity<Map<String, Object>> types() {
        List<String> types = Arrays.stream(AlertEvent.AlertType.values())
                .map(Enum::name)
                .collect(Collectors.toList());
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", types));
    }
}
