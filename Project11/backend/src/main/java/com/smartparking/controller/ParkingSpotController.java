package com.smartparking.controller;

import com.smartparking.entity.ParkingSpot;
import com.smartparking.service.ParkingSpotService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/spots")
public class ParkingSpotController {

    @Autowired
    private ParkingSpotService parkingSpotService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list() {
        List<ParkingSpot> spots = parkingSpotService.listAll();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", spots));
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary() {
        Map<String, Long> summary = parkingSpotService.countByStatus();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", summary));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        String statusStr = body.get("status");
        String plateNumber = body.get("plateNumber");
        if (statusStr == null) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "状态不能为空", "data", ""));
        }
        try {
            ParkingSpot.SpotStatus status = ParkingSpot.SpotStatus.valueOf(statusStr);
            ParkingSpot spot = parkingSpotService.updateStatus(id, status, plateNumber);
            if (spot == null) {
                return ResponseEntity.badRequest().body(Map.of("code", 404, "message", "车位不存在", "data", ""));
            }
            return ResponseEntity.ok(Map.of("code", 200, "message", "状态更新成功", "data", spot));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "无效的状态值", "data", ""));
        }
    }
}
