package com.fraudguard.controller;

import com.fraudguard.entity.Blacklist;
import com.fraudguard.service.BlacklistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blacklist")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BlacklistController {

    private final BlacklistService blacklistService;

    @GetMapping
    public ResponseEntity<List<Blacklist>> getAllBlacklist(
            @RequestParam(required = false) String type) {
        List<Blacklist> result;
        if (type != null && !type.isEmpty()) {
            result = blacklistService.getBlacklistByType(type);
        } else {
            result = blacklistService.getAllBlacklist();
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkBlacklist(
            @RequestParam String type,
            @RequestParam String value) {
        boolean isBlacklisted = blacklistService.isBlacklisted(type, value);
        Map<String, Object> result = new HashMap<>();
        result.put("blacklisted", isBlacklisted);
        result.put("type", type);
        result.put("value", value);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<Blacklist> addToBlacklist(@RequestBody Map<String, String> body) {
        String type = body.get("type");
        String value = body.get("value");
        String description = body.getOrDefault("description", "");
        String riskLevel = body.getOrDefault("riskLevel", "HIGH");
        String source = body.getOrDefault("source", "MANUAL");

        Blacklist blacklist = blacklistService.addToBlacklist(type, value, description, riskLevel, source);
        return ResponseEntity.ok(blacklist);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> removeFromBlacklist(
            @RequestParam String type,
            @RequestParam String value) {
        boolean success = blacklistService.removeFromBlacklist(type, value);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getCount() {
        long count = blacklistService.getBlacklistCount();
        Map<String, Object> result = new HashMap<>();
        result.put("count", count);
        return ResponseEntity.ok(result);
    }
}
