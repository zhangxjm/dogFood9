package com.fraudguard.service;

import com.fraudguard.entity.Transaction;
import com.fraudguard.entity.UserAccount;

import java.math.BigDecimal;

public interface MLScoringService {

    BigDecimal calculateRiskScore(Transaction transaction, UserAccount userAccount);

    String extractFeatures(Transaction transaction, UserAccount userAccount);
}
