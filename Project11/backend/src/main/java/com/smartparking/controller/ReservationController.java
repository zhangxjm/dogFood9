package com.smartparking.controller;

import com.smartparking.entity.Reservation;
import com.smartparking.service.ReservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    @Autowired
    private ReservationService reservationService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list() {
        List<Reservation> reservations = reservationService.listReservations();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", reservations));
    }

    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> create(@RequestBody Reservation reservation) {
        if (reservation.getPlateNumber() == null || reservation.getPlateNumber().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "车牌号不能为空", "data", ""));
        }
        Reservation saved = reservationService.createReservation(reservation);
        if (saved == null) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "预约失败，无可用车位", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "预约成功", "data", saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> cancel(@PathVariable Long id) {
        boolean success = reservationService.cancelReservation(id);
        if (!success) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "取消预约失败", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "取消预约成功", "data", ""));
    }
}
