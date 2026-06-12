package com.fraudguard.repository;

import com.fraudguard.entity.RiskRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RiskRuleRepository extends JpaRepository<RiskRule, Long> {

    Optional<RiskRule> findByRuleCode(String ruleCode);

    List<RiskRule> findByEnabledTrue();

    List<RiskRule> findByRuleType(String ruleType);

    List<RiskRule> findByEnabledTrueAndRuleType(String ruleType);

    List<RiskRule> findByEnabledTrueOrderByScoreWeightDesc();
}
