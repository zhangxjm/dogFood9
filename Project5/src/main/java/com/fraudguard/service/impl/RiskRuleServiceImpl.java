package com.fraudguard.service.impl;

import com.fraudguard.entity.RiskRule;
import com.fraudguard.repository.RiskRuleRepository;
import com.fraudguard.service.RiskRuleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class RiskRuleServiceImpl implements RiskRuleService {

    private final RiskRuleRepository riskRuleRepository;

    @Override
    public List<RiskRule> getAllRules() {
        return riskRuleRepository.findAll();
    }

    @Override
    @Cacheable(value = "riskRules", key = "'enabled'")
    public List<RiskRule> getEnabledRules() {
        return riskRuleRepository.findByEnabledTrueOrderByScoreWeightDesc();
    }

    @Override
    public Optional<RiskRule> getRuleByCode(String ruleCode) {
        return riskRuleRepository.findByRuleCode(ruleCode);
    }

    @Override
    @Transactional
    @CacheEvict(value = "riskRules", allEntries = true)
    public RiskRule createRule(RiskRule rule) {
        return riskRuleRepository.save(rule);
    }

    @Override
    @Transactional
    @CacheEvict(value = "riskRules", allEntries = true)
    public RiskRule updateRule(String ruleCode, RiskRule rule) {
        return riskRuleRepository.findByRuleCode(ruleCode)
            .map(existing -> {
                existing.setRuleName(rule.getRuleName());
                existing.setDescription(rule.getDescription());
                existing.setRuleType(rule.getRuleType());
                existing.setSeverity(rule.getSeverity());
                existing.setScoreWeight(rule.getScoreWeight());
                existing.setConditionExpression(rule.getConditionExpression());
                existing.setThresholdValue(rule.getThresholdValue());
                existing.setThresholdUnit(rule.getThresholdUnit());
                existing.setTimeWindowSeconds(rule.getTimeWindowSeconds());
                existing.setAction(rule.getAction());
                existing.setEnabled(rule.getEnabled());
                return riskRuleRepository.save(existing);
            }).orElse(null);
    }

    @Override
    @Transactional
    @CacheEvict(value = "riskRules", allEntries = true)
    public boolean deleteRule(String ruleCode) {
        return riskRuleRepository.findByRuleCode(ruleCode)
            .map(rule -> {
                riskRuleRepository.delete(rule);
                return true;
            }).orElse(false);
    }

    @Override
    @Transactional
    @CacheEvict(value = "riskRules", allEntries = true)
    public boolean enableRule(String ruleCode) {
        return riskRuleRepository.findByRuleCode(ruleCode)
            .map(rule -> {
                rule.setEnabled(true);
                riskRuleRepository.save(rule);
                return true;
            }).orElse(false);
    }

    @Override
    @Transactional
    @CacheEvict(value = "riskRules", allEntries = true)
    public boolean disableRule(String ruleCode) {
        return riskRuleRepository.findByRuleCode(ruleCode)
            .map(rule -> {
                rule.setEnabled(false);
                riskRuleRepository.save(rule);
                return true;
            }).orElse(false);
    }

    @Override
    @Transactional
    public void initializeDefaultRules() {
        createRuleIfNotExists("AMOUNT_LIMIT", "单笔金额超限规则", "单笔交易金额超过设定阈值时触发",
            "AMOUNT", "HIGH", new BigDecimal("25"), 60, "ALERT");
        createRuleIfNotExists("VELOCITY_CHECK", "交易速率检测规则", "单位时间内交易次数超过阈值时触发",
            "VELOCITY", "HIGH", new BigDecimal("20"), 60, "ALERT");
        createRuleIfNotExists("DAILY_LIMIT", "日交易限额规则", "当日累计交易金额超过用户日限额时触发",
            "LIMIT", "MEDIUM", new BigDecimal("15"), 86400, "ALERT");
        createRuleIfNotExists("BLACKLIST_CHECK", "黑名单检测规则", "交易涉及黑名单中的账户/卡号/IP时触发",
            "BLACKLIST", "CRITICAL", new BigDecimal("30"), null, "REJECT");
        createRuleIfNotExists("UNUSUAL_TIME", "异常交易时间规则", "在深夜等异常时段进行交易时触发",
            "TIME", "LOW", new BigDecimal("10"), null, "ALERT");
        createRuleIfNotExists("UNUSUAL_LOCATION", "异常地点规则", "交易地点与用户常用地点不符时触发",
            "LOCATION", "MEDIUM", new BigDecimal("15"), null, "ALERT");
        createRuleIfNotExists("DEVICE_CHANGE", "设备变更检测规则", "使用新设备进行交易时触发",
            "DEVICE", "MEDIUM", new BigDecimal("12"), null, "ALERT");
        createRuleIfNotExists("IP_RISK", "IP风险检测规则", "IP地址存在风险特征时触发",
            "IP", "MEDIUM", new BigDecimal("15"), 3600, "ALERT");
        createRuleIfNotExists("REPEATED_REJECTION", "重复拒付检测规则", "账户近期有多次拒付记录时触发",
            "BEHAVIOR", "HIGH", new BigDecimal("18"), 86400, "ALERT");
        createRuleIfNotExists("HIGH_RISK_MERCHANT", "高风险商户规则", "交易涉及高风险商户时触发",
            "MERCHANT", "HIGH", new BigDecimal("20"), null, "ALERT");

        log.info("Default risk rules initialized");
    }

    private void createRuleIfNotExists(String ruleCode, String ruleName, String description,
                                        String ruleType, String severity, BigDecimal scoreWeight,
                                        Integer timeWindow, String action) {
        if (riskRuleRepository.findByRuleCode(ruleCode).isEmpty()) {
            RiskRule rule = new RiskRule();
            rule.setRuleCode(ruleCode);
            rule.setRuleName(ruleName);
            rule.setDescription(description);
            rule.setRuleType(ruleType);
            rule.setSeverity(severity);
            rule.setScoreWeight(scoreWeight);
            rule.setTimeWindowSeconds(timeWindow);
            rule.setAction(action);
            rule.setEnabled(true);
            rule.setCreatedBy("SYSTEM");
            riskRuleRepository.save(rule);
        }
    }
}
