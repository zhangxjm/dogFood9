package com.smartparking.controller;

import com.smartparking.entity.BillingRecord;
import com.smartparking.entity.BillingRule;
import com.smartparking.service.BillingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/billing")
public class BillingController {

    @Autowired
    private BillingService billingService;

    @GetMapping("/current/{plateNumber}")
    public ResponseEntity<Map<String, Object>> getCurrentBilling(@PathVariable String plateNumber) {
        Map<String, Object> billing = billingService.calculateFee(plateNumber);
        if (billing == null) {
            return ResponseEntity.status(404).body(Map.of("code", 404, "message", "未找到该车辆的计费信息", "data", ""));
        }
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", billing));
    }

    @GetMapping("/records")
    public ResponseEntity<Map<String, Object>> listRecords() {
        var records = billingService.listBillingRecords();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", records));
    }

    @PostMapping("/pay")
    public ResponseEntity<Map<String, Object>> pay(@RequestBody Map<String, Object> body) {
        Long billingId = Long.valueOf(body.get("billingId").toString());
        String payMethodStr = (String) body.get("payMethod");
        if (billingId == null || payMethodStr == null) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "参数不完整", "data", ""));
        }
        try {
            BillingRecord.PayMethod payMethod = BillingRecord.PayMethod.valueOf(payMethodStr);
            BillingRecord record = billingService.processPayment(billingId, payMethod);
            if (record == null) {
                return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "支付失败，账单不存在或已支付", "data", ""));
            }
            return ResponseEntity.ok(Map.of("code", 200, "message", "支付成功", "data", record));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("code", 400, "message", "无效的支付方式", "data", ""));
        }
    }

    @GetMapping("/rules")
    public ResponseEntity<Map<String, Object>> getRules() {
        BillingRule rule = billingService.getRule();
        return ResponseEntity.ok(Map.of("code", 200, "message", "查询成功", "data", rule));
    }

    @PutMapping("/rules")
    public ResponseEntity<Map<String, Object>> updateRules(@RequestBody Map<String, Double> body) {
        BillingRule rule = billingService.updateRule(
                body.get("firstHourFee"),
                body.get("additionalHourFee"),
                body.get("dailyMaxFee"),
                body.get("monthlyFee")
        );
        return ResponseEntity.ok(Map.of("code", 200, "message", "规则更新成功", "data", rule));
    }
}
