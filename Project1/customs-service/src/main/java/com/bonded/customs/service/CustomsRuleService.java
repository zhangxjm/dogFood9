package com.bonded.customs.service;

import com.bonded.customs.entity.CustomsRule;
import com.bonded.customs.mapper.CustomsRuleMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CustomsRuleService {

    private final CustomsRuleMapper ruleMapper;

    public CustomsRuleService(CustomsRuleMapper ruleMapper) {
        this.ruleMapper = ruleMapper;
    }

    public List<CustomsRule> list() {
        return ruleMapper.findAll();
    }

    public CustomsRule getById(Long id) {
        return ruleMapper.findById(id);
    }

    public List<CustomsRule> getByHsCode(String hsCode) {
        return ruleMapper.findByHsCode(hsCode);
    }

    public CustomsRule create(CustomsRule rule) {
        ruleMapper.insert(rule);
        return ruleMapper.findById(rule.getId());
    }

    public CustomsRule update(CustomsRule rule) {
        ruleMapper.update(rule);
        return ruleMapper.findById(rule.getId());
    }
}
