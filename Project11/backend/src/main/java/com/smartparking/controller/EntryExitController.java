package com.smartparking.controller;

import com.smartparking.service.EntryExitService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
public class EntryExitController {

    @Autowired
    private EntryExitService entryExitService;

    @PostMapping("/api/entry")
    public ResponseEntity<Map<String, Object>> entry(@RequestBody Map<String, String> body) {
        String plateNumber = body.get("plateNumber");
        if (plateNumber == null || plateNumber.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "车牌号不能为空", "data", ""));
        }
        var record = entryExitService.vehicleEntry(plateNumber);
        if (record == null) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "入场失败，车辆已在场内或无可用车位", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "入场成功", "data", record));
    }

    @PostMapping("/api/exit")
    public ResponseEntity<Map<String, Object>> exit(@RequestBody Map<String, String> body) {
        String plateNumber = body.get("plateNumber");
        if (plateNumber == null || plateNumber.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "车牌号不能为空", "data", ""));
        }
        Map<String, Object> result = entryExitService.vehicleExit(plateNumber);
        if (result == null) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "出场失败，未找到该车辆的在场记录", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "出场成功", "data", result));
    }

    @GetMapping("/api/records")
    public ResponseEntity<Map<String, Object>> listRecords() {
        var records = entryExitService.listRecords();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", records));
    }

    @GetMapping("/api/records/current")
    public ResponseEntity<Map<String, Object>> currentParked() {
        var records = entryExitService.getCurrentParkedVehicles();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", records));
    }
}
