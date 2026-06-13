package com.fraudguard.service;

import com.fraudguard.entity.FraudPatternDetection;
import com.fraudguard.entity.Transaction;
import com.fraudguard.entity.UserAccount;

import java.util.Map;

public interface FraudPatternDetectionService {

    FraudPatternDetection detectFraudPatterns(Transaction transaction, UserAccount userAccount);

    double detectStolenCard(Transaction transaction, UserAccount userAccount, StringBuilder evidence);

    double detectCashOut(Transaction transaction, UserAccount userAccount, StringBuilder evidence);

    double detectFakeTransaction(Transaction transaction, UserAccount userAccount, StringBuilder evidence);

    double detectAccountTakeover(Transaction transaction, UserAccount userAccount, StringBuilder evidence);

    double detectMoneyLaundering(Transaction transaction, UserAccount userAccount, StringBuilder evidence);

    Map<String, Object> getPatternDetectionStats();

    FraudPatternDetection getDetectionByTransaction(String transactionId);
}
