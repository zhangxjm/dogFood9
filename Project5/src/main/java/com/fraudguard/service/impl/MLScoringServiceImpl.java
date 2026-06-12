package com.fraudguard.service.impl;

import com.fraudguard.entity.Transaction;
import com.fraudguard.entity.UserAccount;
import com.fraudguard.repository.TransactionRepository;
import com.fraudguard.service.MLScoringService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MLScoringServiceImpl implements MLScoringService {

    private final TransactionRepository transactionRepository;

    @Override
    public BigDecimal calculateRiskScore(Transaction transaction, UserAccount userAccount) {
        double score = 0.0;

        score += calculateAmountRisk(transaction) * 0.25;
        score += calculateVelocityRisk(transaction) * 0.20;
        score += calculateTimeRisk(transaction) * 0.10;
        score += calculateLocationRisk(transaction, userAccount) * 0.15;
        score += calculateHistoryRisk(transaction, userAccount) * 0.20;
        score += calculateBehavioralRisk(transaction, userAccount) * 0.10;

        score = Math.min(score, 100.0);
        score = Math.max(score, 0.0);

        return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
    }

    private double calculateAmountRisk(Transaction transaction) {
        BigDecimal amount = transaction.getAmount();
        double amountDouble = amount.doubleValue();

        if (amountDouble > 100000) {
            return 90.0;
        } else if (amountDouble > 50000) {
            return 70.0;
        } else if (amountDouble > 20000) {
            return 50.0;
        } else if (amountDouble > 10000) {
            return 30.0;
        } else if (amountDouble > 5000) {
            return 15.0;
        } else {
            return 5.0;
        }
    }

    private double calculateVelocityRisk(Transaction transaction) {
        LocalDateTime startTime = transaction.getCreatedAt().minusMinutes(10);
        Long count = transactionRepository.countByUserIdAndTimeRange(
            transaction.getUserId(), startTime, transaction.getCreatedAt());

        long transactionCount = count != null ? count : 0;

        if (transactionCount >= 15) {
            return 95.0;
        } else if (transactionCount >= 10) {
            return 80.0;
        } else if (transactionCount >= 7) {
            return 60.0;
        } else if (transactionCount >= 5) {
            return 40.0;
        } else if (transactionCount >= 3) {
            return 25.0;
        } else {
            return 10.0;
        }
    }

    private double calculateTimeRisk(Transaction transaction) {
        LocalTime transactionTime = transaction.getCreatedAt().toLocalTime();
        int hour = transactionTime.getHour();

        if (hour >= 0 && hour < 5) {
            return 75.0;
        } else if (hour >= 5 && hour < 7) {
            return 50.0;
        } else if (hour >= 22 && hour < 24) {
            return 45.0;
        } else if (hour >= 19 && hour < 22) {
            return 20.0;
        } else {
            return 10.0;
        }
    }

    private double calculateLocationRisk(Transaction transaction, UserAccount userAccount) {
        if (userAccount == null || userAccount.getRegisteredCity() == null
            || transaction.getLocation() == null) {
            return 30.0;
        }

        boolean sameCity = transaction.getLocation().contains(userAccount.getRegisteredCity())
            || userAccount.getRegisteredCity().contains(transaction.getLocation());

        return sameCity ? 10.0 : 65.0;
    }

    private double calculateHistoryRisk(Transaction transaction, UserAccount userAccount) {
        if (userAccount == null) {
            return 50.0;
        }

        String riskLevel = userAccount.getRiskLevel();
        double baseRisk;

        switch (riskLevel != null ? riskLevel : "LOW") {
            case "CRITICAL":
                baseRisk = 90.0;
                break;
            case "HIGH":
                baseRisk = 70.0;
                break;
            case "MEDIUM":
                baseRisk = 45.0;
                break;
            case "LOW":
            default:
                baseRisk = 15.0;
                break;
        }

        LocalDateTime oneMonthAgo = LocalDateTime.now().minusDays(30);
        Long rejectedCount = transactionRepository.countRejectedByFromAccountAndCreatedAtAfter(
            transaction.getFromAccount(), oneMonthAgo);

        if (rejectedCount != null && rejectedCount > 0) {
            baseRisk += rejectedCount * 10;
        }

        return Math.min(baseRisk, 100.0);
    }

    private double calculateBehavioralRisk(Transaction transaction, UserAccount userAccount) {
        double risk = 20.0;

        if (transaction.getDeviceId() != null) {
            LocalDateTime oneMonthAgo = LocalDateTime.now().minusDays(30);
            Long deviceCount = transactionRepository.countByDeviceIdAndCreatedAtAfter(
                transaction.getDeviceId(), oneMonthAgo);
            if (deviceCount != null && deviceCount == 0) {
                risk += 25.0;
            }
        }

        if (transaction.getIpAddress() != null) {
            LocalDateTime oneMonthAgo = LocalDateTime.now().minusDays(30);
            Long ipCount = transactionRepository.countByIpAddressAndCreatedAtAfter(
                transaction.getIpAddress(), oneMonthAgo);
            if (ipCount != null && ipCount == 0) {
                risk += 15.0;
            }
        }

        if (transaction.getTransactionType() != null && userAccount != null) {
            String type = transaction.getTransactionType().toLowerCase();
            if (type.contains("transfer") || type.contains("转账")) {
                risk += 10.0;
            }
        }

        return Math.min(risk, 85.0);
    }

    @Override
    public String extractFeatures(Transaction transaction, UserAccount userAccount) {
        List<String> features = new ArrayList<>();

        features.add("amount=" + transaction.getAmount());
        features.add("currency=" + transaction.getCurrency());
        features.add("transactionType=" + transaction.getTransactionType());
        features.add("hour=" + transaction.getCreatedAt().getHour());
        features.add("dayOfWeek=" + transaction.getCreatedAt().getDayOfWeek());

        if (userAccount != null) {
            features.add("userRiskLevel=" + userAccount.getRiskLevel());
            features.add("accountType=" + userAccount.getAccountType());
            if (userAccount.getCreditScore() != null) {
                features.add("creditScore=" + userAccount.getCreditScore());
            }
        }

        if (transaction.getLocation() != null) {
            features.add("location=" + transaction.getLocation());
        }

        if (transaction.getMerchant() != null) {
            features.add("merchant=" + transaction.getMerchant());
        }

        return String.join("|", features);
    }
}
