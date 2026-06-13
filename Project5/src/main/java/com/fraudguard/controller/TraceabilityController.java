package com.fraudguard.controller;

import com.fraudguard.entity.TraceabilityRecord;
import com.fraudguard.service.TraceabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/traceability")
@RequiredArgsConstructor
public class TraceabilityController {

    private final TraceabilityService traceabilityService;

    @GetMapping("/{transactionId}")
    public ResponseEntity<TraceabilityRecord> getTraceRecord(@PathVariable String transactionId) {
        TraceabilityRecord record = traceabilityService.getTraceRecord(transactionId);
        if (record == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(record);
    }

    @GetMapping("/{transactionId}/report")
    public ResponseEntity<String> getTraceReport(@PathVariable String transactionId) {
        String report = traceabilityService.getFullTraceReport(transactionId);
        return ResponseEntity.ok()
            .header("Content-Type", "text/plain; charset=UTF-8")
            .body(report);
    }

    @PostMapping("/{transactionId}/manual")
    public ResponseEntity<TraceabilityRecord> recordManualIntervention(
            @PathVariable String transactionId,
            @RequestParam String operator,
            @RequestParam String action,
            @RequestParam String reason) {
        TraceabilityRecord record = traceabilityService.recordManualIntervention(
            transactionId, operator, action, reason);
        return ResponseEntity.ok(record);
    }
}
