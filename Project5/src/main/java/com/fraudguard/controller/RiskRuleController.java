package com.fraudguard.controller;

import com.fraudguard.entity.RiskRule;
import com.fraudguard.service.RiskRuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rules")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RiskRuleController {

    private final RiskRuleService riskRuleService;

    @GetMapping
    public ResponseEntity<List<RiskRule>> getAllRules(
            @RequestParam(defaultValue = "false") boolean enabledOnly) {
        List<RiskRule> rules = enabledOnly ?
            riskRuleService.getEnabledRules() :
            riskRuleService.getAllRules();
        return ResponseEntity.ok(rules);
    }

    @GetMapping("/{ruleCode}")
    public ResponseEntity<RiskRule> getRule(@PathVariable String ruleCode) {
        return riskRuleService.getRuleByCode(ruleCode)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<RiskRule> createRule(@RequestBody RiskRule rule) {
        RiskRule created = riskRuleService.createRule(rule);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{ruleCode}")
    public ResponseEntity<RiskRule> updateRule(
            @PathVariable String ruleCode,
            @RequestBody RiskRule rule) {
        RiskRule updated = riskRuleService.updateRule(ruleCode, rule);
        if (updated == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{ruleCode}")
    public ResponseEntity<Map<String, Object>> deleteRule(@PathVariable String ruleCode) {
        boolean success = riskRuleService.deleteRule(ruleCode);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{ruleCode}/enable")
    public ResponseEntity<Map<String, Object>> enableRule(@PathVariable String ruleCode) {
        boolean success = riskRuleService.enableRule(ruleCode);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{ruleCode}/disable")
    public ResponseEntity<Map<String, Object>> disableRule(@PathVariable String ruleCode) {
        boolean success = riskRuleService.disableRule(ruleCode);
        Map<String, Object> result = new HashMap<>();
        result.put("success", success);
        return ResponseEntity.ok(result);
    }
}
