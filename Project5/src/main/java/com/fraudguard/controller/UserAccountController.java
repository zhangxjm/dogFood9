package com.fraudguard.controller;

import com.fraudguard.entity.UserAccount;
import com.fraudguard.service.UserAccountService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserAccountController {

    private final UserAccountService userAccountService;

    @GetMapping
    public ResponseEntity<Page<UserAccount>> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword) {

        Pageable pageable = PageRequest.of(page, size);
        Page<UserAccount> result;

        if (keyword != null && !keyword.isEmpty()) {
            result = userAccountService.searchUsers(keyword, pageable);
        } else {
            result = userAccountService.getAllUsers(pageable);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserAccount> getUser(@PathVariable String userId) {
        return userAccountService.getUserByUserId(userId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/account/{accountNumber}")
    public ResponseEntity<UserAccount> getUserByAccount(@PathVariable String accountNumber) {
        return userAccountService.getUserByAccountNumber(accountNumber)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<UserAccount> createUser(@RequestBody UserAccount user) {
        UserAccount created = userAccountService.createUser(user);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{userId}/risk-level")
    public ResponseEntity<UserAccount> updateRiskLevel(
            @PathVariable String userId,
            @RequestBody Map<String, String> body) {
        String riskLevel = body.get("riskLevel");
        UserAccount updated = userAccountService.updateUserRiskLevel(userId, riskLevel);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/{userId}/freeze")
    public ResponseEntity<Map<String, Object>> freezeAccount(
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = body != null ? body.getOrDefault("reason", "风险管控") : "风险管控";
        boolean success = userAccountService.freezeAccount(userId, reason);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("message", success ? "账户已冻结" : "冻结失败");
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{userId}/unfreeze")
    public ResponseEntity<Map<String, Object>> unfreezeAccount(@PathVariable String userId) {
        boolean success = userAccountService.unfreezeAccount(userId);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        result.put("message", success ? "账户已解冻" : "解冻失败");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        Map<String, Object> stats = userAccountService.getUserStatistics();
        return ResponseEntity.ok(stats);
    }
}
