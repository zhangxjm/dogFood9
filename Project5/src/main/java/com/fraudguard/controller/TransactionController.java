package com.fraudguard.controller;

import com.fraudguard.entity.Transaction;
import com.fraudguard.service.TransactionService;
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
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    @PostMapping
    public ResponseEntity<Transaction> createTransaction(@RequestBody Transaction transaction) {
        Transaction created = transactionService.createTransaction(transaction);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<Transaction> getTransaction(@PathVariable String transactionId) {
        Transaction transaction = transactionService.getTransactionById(transactionId);
        if (transaction == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(transaction);
    }

    @GetMapping
    public ResponseEntity<Page<Transaction>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String riskLevel,
            @RequestParam(required = false) String userId) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Transaction> result;

        if (userId != null && !userId.isEmpty()) {
            result = transactionService.getTransactionsByUserId(userId, pageable);
        } else if (status != null && !status.isEmpty()) {
            result = transactionService.getTransactionsByStatus(status, pageable);
        } else if (riskLevel != null && !riskLevel.isEmpty()) {
            result = transactionService.getTransactionsByRiskLevel(riskLevel, pageable);
        } else {
            result = transactionService.getTransactions(pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Transaction>> getRecentTransactions(
            @RequestParam(defaultValue = "20") int limit) {
        List<Transaction> transactions = transactionService.getRecentTransactions(limit);
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = transactionService.getTransactionStatistics();
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/{transactionId}/intercept")
    public ResponseEntity<Map<String, Object>> interceptTransaction(
            @PathVariable String transactionId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "人工拦截") : "人工拦截";
        boolean success = transactionService.interceptTransaction(transactionId, reason);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("message", success ? "交易已拦截" : "拦截失败");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{transactionId}/approve")
    public ResponseEntity<Map<String, Object>> approveTransaction(@PathVariable String transactionId) {
        boolean success = transactionService.approveTransaction(transactionId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("message", success ? "交易已通过" : "操作失败");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{transactionId}/reject")
    public ResponseEntity<Map<String, Object>> rejectTransaction(
            @PathVariable String transactionId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "风险过高") : "风险过高";
        boolean success = transactionService.rejectTransaction(transactionId, reason);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("message", success ? "交易已拒绝" : "操作失败");
        return ResponseEntity.ok(result);
    }
}
