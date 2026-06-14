package com.smartparking.repository;

import com.smartparking.entity.BillingRule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface BillingRuleRepository extends JpaRepository<BillingRule, Long> {
    Optional<BillingRule> findByType(String type);
}
