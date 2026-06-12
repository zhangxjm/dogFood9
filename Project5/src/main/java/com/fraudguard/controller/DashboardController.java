package com.fraudguard.controller;

import com.fraudguard.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DashboardController {

    private final TransactionService transactionService;
    private final FraudAlertService fraudAlertService;
    private final UserAccountService userAccountService;
    private final BlacklistService blacklistService;
    private final TransactionStreamService transactionStreamService;
    private final MockTransactionGenerator mockTransactionGenerator;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        Map<String, Object> summary = new HashMap<>();

        Map<String, Object> txStats = transactionService.getTransactionStatistics();
        Map<String, Object> alertStats = fraudAlertService.getAlertStatistics();
        Map<String, Object> userStats = userAccountService.getUserStatistics();

        summary.put("transactions", txStats);
        summary.put("alerts", alertStats);
        summary.put("users", userStats);
        summary.put("blacklistCount", blacklistService.getBlacklistCount());
        summary.put("streamRunning", transactionStreamService.isStreamRunning());
        summary.put("mockGeneratorRunning", mockTransactionGenerator.isGenerating());

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/stream/status")
    public ResponseEntity<Map<String, Object>> getStreamStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("running", transactionStreamService.isStreamRunning());
        status.put("queueSize", transactionStreamService.getQueueSize());
        status.put("processedCount", transactionStreamService.getProcessedCount());
        status.put("throughput", transactionStreamService.getThroughput());
        return ResponseEntity.ok(status);
    }

    @PostMapping("/stream/start")
    public ResponseEntity<Map<String, Object>> startStream() {
        transactionStreamService.startStreamProcessing();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "流计算已启动");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/stream/stop")
    public ResponseEntity<Map<String, Object>> stopStream() {
        transactionStreamService.stopStreamProcessing();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "流计算已停止");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/mock/start")
    public ResponseEntity<Map<String, Object>> startMockGenerator(
            @RequestBody(required = false) Map<String, Integer> body) {
        int tpm = body != null ? body.getOrDefault("transactionsPerMinute", 60) : 60;
        mockTransactionGenerator.startGenerating(tpm);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "模拟交易生成器已启动，速率: " + tpm + " 笔/分钟");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/mock/stop")
    public ResponseEntity<Map<String, Object>> stopMockGenerator() {
        mockTransactionGenerator.stopGenerating();
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "模拟交易生成器已停止");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/mock/generate")
    public ResponseEntity<Map<String, Object>> generateMockTransactions(
            @RequestBody(required = false) Map<String, Integer> body) {
        int count = body != null ? body.getOrDefault("count", 10) : 10;
        mockTransactionGenerator.generateBatchTransactions(count);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("message", "已生成 " + count + " 笔模拟交易");
        return ResponseEntity.ok(result);
    }
}
