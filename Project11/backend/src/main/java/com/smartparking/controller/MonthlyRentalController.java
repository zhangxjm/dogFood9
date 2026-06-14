package com.smartparking.controller;

import com.smartparking.entity.MonthlyRental;
import com.smartparking.service.MonthlyRentalService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/monthly")
public class MonthlyRentalController {

    @Autowired
    private MonthlyRentalService monthlyRentalService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list() {
        List<MonthlyRental> rentals = monthlyRentalService.listRentals();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", rentals));
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> create(@RequestBody MonthlyRental rental) {
        if (rental.getPlateNumber() == null || rental.getPlateNumber().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "车牌号不能为空", "data", ""));
        }
        MonthlyRental saved = monthlyRentalService.createRental(rental);
        return ResponseEntity.ok(Map.of("code", 200, "message", "月租创建成功", "data", saved));
    }

    @PutMapping("/{id}/renew")
    public ResponseEntity<Map<String, Object>> renew(@PathVariable Long id, @RequestBody Map<String, Integer> body) {
        Integer months = body.get("months");
        if (months == null || months <= 0) {
            months = 1;
        }
        MonthlyRental rental = monthlyRentalService.renewRental(id, months);
        if (rental == null) {
            return ResponseEntity.badRequest().body(Map.of("code", 404, "message", "月租记录不存在", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "续租成功", "data", rental));
    }

    @GetMapping("/expiring")
    public ResponseEntity<Map<String, Object>> expiring() {
        List<MonthlyRental> rentals = monthlyRentalService.findExpiringRentals();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", rentals));
    }
}
