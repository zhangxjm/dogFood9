package com.fraudguard.service;

import com.fraudguard.entity.Transaction;

import java.math.BigDecimal;
import java.util.Map;

public interface RiskAssessmentService {

    Transaction assessRisk(Transaction transaction);

    String determineRiskLevel(BigDecimal score);

    String makeDecision(BigDecimal score, String riskLevel);

    Map<String, Object> getRiskStats();
}
