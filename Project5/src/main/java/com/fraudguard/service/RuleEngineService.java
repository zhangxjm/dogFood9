package com.fraudguard.service;

import com.fraudguard.dto.RuleResult;
import com.fraudguard.entity.Transaction;
import com.fraudguard.entity.UserAccount;

import java.util.List;

public interface RuleEngineService {

    List<RuleResult> evaluateRules(Transaction transaction, UserAccount userAccount);

    String generateRiskReasons(List<RuleResult> results);
}
