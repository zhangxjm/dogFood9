package com.fraudguard.controller;

import com.fraudguard.entity.FraudPatternDetection;
import com.fraudguard.service.FraudPatternDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/fraud-pattern")
@RequiredArgsConstructor
public class FraudPatternDetectionController {

    private final FraudPatternDetectionService fraudPatternDetectionService;

    @GetMapping("/transaction/{transactionId}")
    public ResponseEntity<FraudPatternDetection> getByTransaction(@PathVariable String transactionId) {
        FraudPatternDetection detection = fraudPatternDetectionService.getDetectionByTransaction(transactionId);
        if (detection == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(detection);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getPatternStats() {
        return ResponseEntity.ok(fraudPatternDetectionService.getPatternDetectionStats());
    }

    @PostMapping("/analyze/{transactionId}")
    public ResponseEntity<FraudPatternDetection> analyzeTransaction(@PathVariable String transactionId) {
        return ResponseEntity.status(501).build();
    }
}
