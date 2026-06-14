package com.smartparking.controller;

import com.smartparking.entity.Vehicle;
import com.smartparking.service.VehicleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list() {
        List<Vehicle> vehicles = vehicleService.listAll();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", vehicles));
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Vehicle vehicle) {
        if (vehicle.getPlateNumber() == null || vehicle.getPlateNumber().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "车牌号不能为空", "data", ""));
        }
        Vehicle saved = vehicleService.register(vehicle);
        if (saved == null) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "该车牌号已注册", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "注册成功", "data", saved));
    }

    @GetMapping("/{plateNumber}")
    public ResponseEntity<Map<String, Object>> getByPlate(@PathVariable String plateNumber) {
        Vehicle vehicle = vehicleService.findByPlateNumber(plateNumber);
        if (vehicle == null) {
            return ResponseEntity.status(404).body(Map.of("code", 404, "message", "车辆不存在", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", vehicle));
    }
}
