package com.bonded.customs.controller;

import com.bonded.common.result.Result;
import com.bonded.customs.entity.CustomsRule;
import com.bonded.customs.service.CustomsRuleService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/rule")
public class CustomsRuleController {

    private final CustomsRuleService ruleService;

    public CustomsRuleController(CustomsRuleService ruleService) {
        this.ruleService = ruleService;
    }

    @GetMapping("/list")
    public Result<List<CustomsRule>> list() {
        return Result.success(ruleService.list());
    }

    @GetMapping("/{id}")
    public Result<CustomsRule> getById(@PathVariable Long id) {
        CustomsRule rule = ruleService.getById(id);
        if (rule == null) {
            return Result.fail(404, "规则不存在");
        }
        return Result.success(rule);
    }

    @GetMapping("/hscode/{hsCode}")
    public Result<List<CustomsRule>> getByHsCode(@PathVariable String hsCode) {
        return Result.success(ruleService.getByHsCode(hsCode));
    }

    @PostMapping
    public Result<CustomsRule> create(@RequestBody CustomsRule rule) {
        return Result.success(ruleService.create(rule));
    }

    @PutMapping
    public Result<CustomsRule> update(@RequestBody CustomsRule rule) {
        return Result.success(ruleService.update(rule));
    }
}
