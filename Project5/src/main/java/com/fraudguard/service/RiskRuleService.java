package com.fraudguard.service;

import com.fraudguard.entity.RiskRule;

import java.util.List;
import java.util.Optional;

public interface RiskRuleService {

    List<RiskRule> getAllRules();

    List<RiskRule> getEnabledRules();

    Optional<RiskRule> getRuleByCode(String ruleCode);

    RiskRule createRule(RiskRule rule);

    RiskRule updateRule(String ruleCode, RiskRule rule);

    boolean deleteRule(String ruleCode);

    boolean enableRule(String ruleCode);

    boolean disableRule(String ruleCode);

    void initializeDefaultRules();
}
