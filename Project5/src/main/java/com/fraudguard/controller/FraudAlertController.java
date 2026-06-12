package com.fraudguard.controller;

import com.fraudguard.entity.FraudAlert;
import com.fraudguard.service.FraudAlertService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FraudAlertController {

    private final FraudAlertService fraudAlertService;

    @GetMapping("/{alertId}")
    public ResponseEntity<FraudAlert> getAlert(@PathVariable String alertId) {
        FraudAlert alert = fraudAlertService.getAlertById(alertId);
        if (alert == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(alert);
    }

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<FraudAlert> getAlertByTransaction(@PathVariable String transactionId) {
        FraudAlert alert = fraudAlertService.getAlertByTransactionId(transactionId);
        if (alert == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(alert);
    }

    @GetMapping
    public ResponseEntity<Page<FraudAlert>> getAlerts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String level) {

        Pageable pageable = PageRequest.of(page, size);
        Page<FraudAlert> result;

        if (status != null && !status.isEmpty()) {
            result = fraudAlertService.getAlertsByStatus(status, pageable);
        } else if (level != null && !level.isEmpty()) {
            result = fraudAlertService.getAlertsByLevel(level, pageable);
        } else {
            result = fraudAlertService.getAlertsByStatus("PENDING", pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<FraudAlert>> getRecentAlerts(
            @RequestParam(defaultValue = "10") int limit) {
        List<FraudAlert> alerts = fraudAlertService.getRecentAlerts(limit);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = fraudAlertService.getAlertStatistics();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/{alertId}/handle")
    public ResponseEntity<FraudAlert> handleAlert(
            @PathVariable String alertId,
            @RequestBody Map<String, String> body) {
        String handler = body.getOrDefault("handler", "SYSTEM");
        String note = body.getOrDefault("note", "");
        String status = body.getOrDefault("status", "HANDLED");

        FraudAlert alert = fraudAlertService.handleAlert(alertId, handler, note, status);
        if (alert == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(alert);
    }
}
