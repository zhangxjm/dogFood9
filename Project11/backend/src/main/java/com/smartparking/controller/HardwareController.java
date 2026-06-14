package com.smartparking.controller;

import com.smartparking.entity.HardwareDevice;
import com.smartparking.service.HardwareService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hardware/devices")
public class HardwareController {

    @Autowired
    private HardwareService hardwareService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list() {
        List<HardwareDevice> devices = hardwareService.listDevices();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", devices));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getById(@PathVariable Long id) {
        HardwareDevice device = hardwareService.getDeviceById(id);
        if (device == null) {
            return ResponseEntity.status(404).body(Map.of("code", 404, "message", "设备不存在", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", device));
    }

    @PostMapping("/{id}/command")
    public ResponseEntity<Map<String, Object>> sendCommand(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String command = body.get("command");
        if (command == null || command.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "指令不能为空", "data", ""));
        }
        Map<String, Object> result = hardwareService.sendCommand(id, command);
        int code = (boolean) result.get("success") ? 200 : 400;
        return ResponseEntity.status(code).body(Map.of("code", code, "message", result.get("message"), "data", result));
    }

    @PostMapping("/{id}/reconnect")
    public ResponseEntity<Map<String, Object>> reconnect(@PathVariable Long id) {
        Map<String, Object> result = hardwareService.triggerReconnect(id);
        int code = (boolean) result.get("success") ? 200 : 400;
        return ResponseEntity.status(code).body(Map.of("code", code, "message", result.get("message"), "data", result));
    }
}
