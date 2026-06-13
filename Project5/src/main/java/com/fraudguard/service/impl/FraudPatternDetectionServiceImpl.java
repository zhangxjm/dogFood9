package com.fraudguard.service.impl;

import com.fraudguard.entity.FraudPatternDetection;
import com.fraudguard.entity.Transaction;
import com.fraudguard.entity.UserAccount;
import com.fraudguard.repository.FraudPatternDetectionRepository;
import com.fraudguard.repository.TransactionRepository;
import com.fraudguard.service.FraudPatternDetectionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class FraudPatternDetectionServiceImpl implements FraudPatternDetectionService {

    private final FraudPatternDetectionRepository detectionRepository;
    private final TransactionRepository transactionRepository;

    private static final double STOLEN_CARD_THRESHOLD = 70.0;
    private static final double CASH_OUT_THRESHOLD = 65.0;
    private static final double FAKE_TXN_THRESHOLD = 70.0;
    private static final double ACCOUNT_TAKEOVER_THRESHOLD = 65.0;
    private static final double MONEY_LAUNDERING_THRESHOLD = 75.0;

    @Override
    @Transactional
    public FraudPatternDetection detectFraudPatterns(Transaction transaction, UserAccount userAccount) {
        FraudPatternDetection detection = new FraudPatternDetection();
        detection.setTransactionId(transaction.getTransactionId());
        detection.setUserId(transaction.getUserId());

        StringBuilder stolenEvidence = new StringBuilder();
        StringBuilder cashOutEvidence = new StringBuilder();
        StringBuilder fakeEvidence = new StringBuilder();
        StringBuilder takeoverEvidence = new StringBuilder();
        StringBuilder launderingEvidence = new StringBuilder();

        double stolenCardScore = detectStolenCard(transaction, userAccount, stolenEvidence);
        double cashOutScore = detectCashOut(transaction, userAccount, cashOutEvidence);
        double fakeTxnScore = detectFakeTransaction(transaction, userAccount, fakeEvidence);
        double takeoverScore = detectAccountTakeover(transaction, userAccount, takeoverEvidence);
        double launderingScore = detectMoneyLaundering(transaction, userAccount, launderingEvidence);

        detection.setStolenCardScore(round(stolenCardScore));
        detection.setCashOutScore(round(cashOutScore));
        detection.setFakeTransactionScore(round(fakeTxnScore));
        detection.setAccountTakeoverScore(round(takeoverScore));
        detection.setMoneyLaunderingScore(round(launderingScore));

        detection.setIsStolenCard(stolenCardScore >= STOLEN_CARD_THRESHOLD);
        detection.setIsCashOut(cashOutScore >= CASH_OUT_THRESHOLD);
        detection.setIsFakeTransaction(fakeTxnScore >= FAKE_TXN_THRESHOLD);
        detection.setIsAccountTakeover(takeoverScore >= ACCOUNT_TAKEOVER_THRESHOLD);
        detection.setIsMoneyLaundering(launderingScore >= MONEY_LAUNDERING_THRESHOLD);

        detection.setStolenCardEvidence(stolenEvidence.toString());
        detection.setCashOutEvidence(cashOutEvidence.toString());
        detection.setFakeTransactionEvidence(fakeEvidence.toString());
        detection.setAccountTakeoverEvidence(takeoverEvidence.toString());
        detection.setMoneyLaunderingEvidence(launderingEvidence.toString());

        String fraudType = determinePrimaryFraudType(detection);
        detection.setFraudType(fraudType);

        double maxScore = stolenCardScore;
        maxScore = Math.max(maxScore, cashOutScore);
        maxScore = Math.max(maxScore, fakeTxnScore);
        maxScore = Math.max(maxScore, takeoverScore);
        maxScore = Math.max(maxScore, launderingScore);
        detection.setConfidenceScore(round(maxScore));

        detection.setPatternFeatures(extractPatternFeatures(transaction, userAccount, detection));
        detection.setModelVersion("FraudGuard-ML-v2.0");

        detection = detectionRepository.save(detection);

        if (detection.getIsStolenCard() || detection.getIsCashOut() || detection.getIsFakeTransaction()
            || detection.getIsAccountTakeover() || detection.getIsMoneyLaundering()) {
            log.warn("Fraud pattern detected [{}] for transaction {}: confidence={}",
                fraudType, transaction.getTransactionId(), detection.getConfidenceScore());
        }

        return detection;
    }

    @Override
    public double detectStolenCard(Transaction txn, UserAccount user, StringBuilder evidence) {
        double score = 0.0;
        List<String> evidences = new ArrayList<>();

        double amount = txn.getAmount().doubleValue();
        if (amount > 30000) {
            score += 25;
            evidences.add("大额交易(" + amount + "元)");
        } else if (amount > 10000) {
            score += 15;
            evidences.add("较大金额(" + amount + "元)");
        }

        LocalTime txnTime = txn.getCreatedAt().toLocalTime();
        if (txnTime.isAfter(LocalTime.of(23, 0)) || txnTime.isBefore(LocalTime.of(5, 0))) {
            score += 20;
            evidences.add("深夜时段交易(" + txnTime + ")");
        } else if (txnTime.isAfter(LocalTime.of(1, 0)) && txnTime.isBefore(LocalTime.of(4, 0))) {
            score += 15;
            evidences.add("凌晨时段交易");
        }

        if (user != null && user.getRegisteredCity() != null && txn.getLocation() != null) {
            boolean locationMatch = txn.getLocation().contains(user.getRegisteredCity())
                || user.getRegisteredCity().contains(txn.getLocation());
            if (!locationMatch) {
                score += 20;
                evidences.add("异地交易(" + txn.getLocation() + " vs " + user.getRegisteredCity() + ")");
            }
        }

        if (txn.getDeviceId() != null) {
            LocalDateTime oneMonthAgo = LocalDateTime.now().minusDays(30);
            Long deviceCount = transactionRepository.countByDeviceIdAndCreatedAtAfter(txn.getDeviceId(), oneMonthAgo);
            if (deviceCount != null && deviceCount == 0) {
                score += 15;
                evidences.add("新设备首次交易");
            }
        }

        if (txn.getIpAddress() != null) {
            LocalDateTime oneWeekAgo = LocalDateTime.now().minusDays(7);
            Long ipCount = transactionRepository.countByIpAddressAndCreatedAtAfter(txn.getIpAddress(), oneWeekAgo);
            if (ipCount != null && ipCount == 0) {
                score += 10;
                evidences.add("陌生IP地址");
            }
        }

        LocalDateTime tenMinutesAgo = txn.getCreatedAt().minusMinutes(10);
        Long velocityCount = transactionRepository.countByUserIdAndTimeRange(
            txn.getUserId(), tenMinutesAgo, txn.getCreatedAt());
        if (velocityCount != null && velocityCount >= 5) {
            score += 15;
            evidences.add("短时间内密集交易(" + velocityCount + "笔)");
        }

        if (txn.getMerchant() != null) {
            String merchant = txn.getMerchant().toLowerCase();
            if (merchant.contains("奢侈品") || merchant.contains("珠宝") || merchant.contains("手表")
                || merchant.contains("奢侈品") || merchant.contains("gold") || merchant.contains("jewelry")) {
                score += 10;
                evidences.add("高变现商品类别");
            }
        }

        if (user != null && "HIGH".equals(user.getRiskLevel())) {
            score += 10;
            evidences.add("用户高风险等级");
        }

        score = Math.min(score, 100);
        if (score >= STOLEN_CARD_THRESHOLD) {
            evidence.append("【盗刷特征】").append(String.join("; ", evidences));
        }
        return score;
    }

    @Override
    public double detectCashOut(Transaction txn, UserAccount user, StringBuilder evidence) {
        double score = 0.0;
        List<String> evidences = new ArrayList<>();

        String txnType = txn.getTransactionType() != null ? txn.getTransactionType().toLowerCase() : "";
        if (txnType.contains("消费") || txnType.contains("purchase")) {
            double amount = txn.getAmount().doubleValue();
            if (amount >= 9000 && amount <= 10000) {
                score += 25;
                evidences.add("整数额度消费(" + amount + "元，接近万元整)");
            } else if (amount >= 48000 && amount <= 50000) {
                score += 25;
                evidences.add("大额度整数消费(" + amount + "元)");
            } else if (Math.abs(amount - Math.round(amount / 1000) * 1000) < 100 && amount > 5000) {
                score += 15;
                evidences.add("整千/整万消费(" + amount + "元)");
            }
        }

        String userId = txn.getUserId();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        List<Transaction> todayTxns = transactionRepository.findByUserIdAndCreatedAtAfter(userId, todayStart);
        long bigTicketCount = todayTxns.stream()
            .filter(t -> t.getAmount().doubleValue() >= 5000)
            .count();
        if (bigTicketCount >= 3) {
            score += 20;
            evidences.add("当日大额交易笔数异常(" + bigTicketCount + "笔≥5000元)");
        }

        BigDecimal dailyTotal = transactionRepository.sumApprovedAmountByUserIdAndCreatedAtAfter(
            userId, todayStart);
        double dailyAmount = dailyTotal != null ? dailyTotal.doubleValue() : 0;
        if (dailyAmount > 50000) {
            score += 15;
            evidences.add("当日累计交易额高(" + dailyAmount + "元)");
        }

        if (txn.getMerchant() != null) {
            String merchant = txn.getMerchant().toLowerCase();
            if (merchant.contains("pos") || merchant.contains("机") || merchant.contains("套现")
                || merchant.contains("批发") || merchant.contains("建材") || merchant.contains("装修")) {
                score += 15;
                evidences.add("疑似套现商户类别(" + txn.getMerchant() + ")");
            }
        }

        LocalDateTime oneHourAgo = txn.getCreatedAt().minusHours(1);
        Long count = transactionRepository.countByUserIdAndTimeRange(userId, oneHourAgo, txn.getCreatedAt());
        if (count != null && count >= 4) {
            score += 10;
            evidences.add("短时间内多笔消费(" + count + "笔/小时)");
        }

        if (txnType.contains("消费") && user != null) {
            BigDecimal limit = user.getDailyTransactionLimit();
            if (limit != null) {
                double usage = dailyAmount / limit.doubleValue() * 100;
                if (usage > 80) {
                    score += 10;
                    evidences.add(String.format("额度使用率高(%.1f%%)", usage));
                }
            }
        }

        if (user != null && "MEDIUM".equals(user.getRiskLevel())) {
            score += 5;
        } else if (user != null && "HIGH".equals(user.getRiskLevel())) {
            score += 10;
        }

        score = Math.min(score, 100);
        if (score >= CASH_OUT_THRESHOLD) {
            evidence.append("【套现特征】").append(String.join("; ", evidences));
        }
        return score;
    }

    @Override
    public double detectFakeTransaction(Transaction txn, UserAccount user, StringBuilder evidence) {
        double score = 0.0;
        List<String> evidences = new ArrayList<>();

        double amount = txn.getAmount().doubleValue();
        if (amount > 0 && amount < 1) {
            score += 20;
            evidences.add("极低金额交易(" + amount + "元)");
        }

        if (Math.abs(amount - 0.01) < 0.001 || Math.abs(amount - 1.0) < 0.001
            || Math.abs(amount - 0.99) < 0.001 || Math.abs(amount - 6.66) < 0.001
            || Math.abs(amount - 8.88) < 0.001 || Math.abs(amount - 9.99) < 0.001) {
            score += 20;
            evidences.add("验证性小额金额(" + amount + "元)");
        }

        String fromAccount = txn.getFromAccount();
        String toAccount = txn.getToAccount();
        if (fromAccount != null && toAccount != null && fromAccount.equals(toAccount)) {
            score += 30;
            evidences.add("收付账户相同");
        }

        if (user != null && toAccount != null && toAccount.equals(user.getAccountNumber())) {
            score += 15;
            evidences.add("转入本人账户");
        }

        if (txn.getDescription() != null) {
            String desc = txn.getDescription().toLowerCase();
            if (desc.contains("测试") || desc.contains("test") || desc.contains("验证")
                || desc.contains("verify") || desc.isEmpty() || desc.trim().length() < 2) {
                score += 15;
                evidences.add("异常交易描述(" + txn.getDescription() + ")");
            }
        }

        if (txn.getMerchant() != null) {
            String merchant = txn.getMerchant().trim();
            if (merchant.length() < 2 || merchant.contains("test") || merchant.contains("测试")
                || merchant.matches(".*[a-zA-Z]{8,}.*") && merchant.length() <= 10) {
                score += 10;
                evidences.add("可疑商户名称(" + merchant + ")");
            }
        }

        LocalDateTime oneMinuteAgo = txn.getCreatedAt().minusMinutes(1);
        Long sameAmountCount = transactionRepository.countByUserIdAndTimeRange(
            txn.getUserId(), oneMinuteAgo, txn.getCreatedAt());
        if (sameAmountCount != null && sameAmountCount >= 3) {
            Optional<Transaction> prevTxnOpt = transactionRepository.findByUserId(txn.getUserId())
                .stream()
                .filter(t -> !t.getTransactionId().equals(txn.getTransactionId()))
                .filter(t -> t.getAmount().compareTo(txn.getAmount()) == 0)
                .findFirst();
            if (prevTxnOpt.isPresent()) {
                score += 15;
                evidences.add("短时间内重复相同金额交易");
            }
        }

        if (txn.getDeviceId() == null || txn.getDeviceId().isEmpty()) {
            score += 10;
            evidences.add("缺少设备信息");
        }

        if (txn.getIpAddress() == null || txn.getIpAddress().isEmpty()) {
            score += 10;
            evidences.add("缺少IP信息");
        }

        if (txn.getLocation() == null || txn.getLocation().isEmpty()) {
            score += 5;
            evidences.add("缺少位置信息");
        }

        score = Math.min(score, 100);
        if (score >= FAKE_TXN_THRESHOLD) {
            evidence.append("【虚假交易特征】").append(String.join("; ", evidences));
        }
        return score;
    }

    @Override
    public double detectAccountTakeover(Transaction txn, UserAccount user, StringBuilder evidence) {
        double score = 0.0;
        List<String> evidences = new ArrayList<>();

        String txnType = txn.getTransactionType() != null ? txn.getTransactionType().toLowerCase() : "";
        if (txnType.contains("转账") || txnType.contains("transfer") || txnType.contains("提现")) {
            score += 15;
            evidences.add("资金转移类交易(" + txn.getTransactionType() + ")");
            double amount = txn.getAmount().doubleValue();
            if (user != null && user.getAccountBalance() != null) {
                double pct = amount / user.getAccountBalance().doubleValue() * 100;
                if (pct > 80) {
                    score += 25;
                    evidences.add(String.format("一次性转出余额%.1f%%", pct));
                } else if (pct > 50) {
                    score += 15;
                    evidences.add(String.format("转出余额%.1f%%", pct));
                }
            }
        }

        if (user != null && user.getLastLoginIp() != null && txn.getIpAddress() != null) {
            if (!user.getLastLoginIp().equals(txn.getIpAddress())) {
                score += 15;
                evidences.add("IP与上次登录不一致");
            }
        }

        if (txn.getDeviceId() != null) {
            LocalDateTime twoMonthsAgo = LocalDateTime.now().minusDays(60);
            Long deviceCount = transactionRepository.countByDeviceIdAndCreatedAtAfter(
                txn.getDeviceId(), twoMonthsAgo);
            if (deviceCount != null && deviceCount == 0) {
                score += 20;
                evidences.add("全新设备首次操作");
            }
        }

        if (user != null && user.getRegisteredCity() != null && txn.getLocation() != null) {
            String[] cities = {"北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安"};
            boolean userInCity = Arrays.stream(cities).anyMatch(c ->
                user.getRegisteredCity() != null && user.getRegisteredCity().contains(c));
            boolean txnInCity = Arrays.stream(cities).anyMatch(c ->
                txn.getLocation().contains(c));
            if (userInCity && !txnInCity) {
                score += 15;
                evidences.add("首次跨省/跨境操作");
            } else if (!txn.getLocation().contains(user.getRegisteredCity())
                && !user.getRegisteredCity().contains(txn.getLocation())) {
                score += 10;
                evidences.add("位置突变(" + txn.getLocation() + ")");
            }
        }

        if (txn.getToAccount() != null && user != null) {
            LocalDateTime oneMonthAgo = LocalDateTime.now().minusDays(30);
            boolean isNewPayee = transactionRepository.findByUserId(txn.getUserId()).stream()
                .filter(t -> t.getCreatedAt().isAfter(oneMonthAgo))
                .noneMatch(t -> txn.getToAccount().equals(t.getToAccount()));
            if (isNewPayee) {
                score += 10;
                evidences.add("转账至新收款人(" + txn.getToAccount().substring(0, 6) + "...)");
            }
        }

        LocalDateTime fiveMinutesAgo = txn.getCreatedAt().minusMinutes(5);
        Long rapidCount = transactionRepository.countByUserIdAndTimeRange(
            txn.getUserId(), fiveMinutesAgo, txn.getCreatedAt());
        if (rapidCount != null && rapidCount >= 2) {
            score += 10;
            evidences.add("登录后快速发起多笔转账");
        }

        if (txn.getAmount().doubleValue() >= 50000 && (txnType.contains("转账") || txnType.contains("提现"))) {
            score += 10;
            evidences.add("大额转账/提现(" + txn.getAmount() + "元)");
        }

        score = Math.min(score, 100);
        if (score >= ACCOUNT_TAKEOVER_THRESHOLD) {
            evidence.append("【账户盗用特征】").append(String.join("; ", evidences));
        }
        return score;
    }

    @Override
    public double detectMoneyLaundering(Transaction txn, UserAccount user, StringBuilder evidence) {
        double score = 0.0;
        List<String> evidences = new ArrayList<>();

        double amount = txn.getAmount().doubleValue();
        if (amount >= 50000 && amount <= 50100) {
            score += 20;
            evidences.add("接近5万监管门槛金额(" + amount + "元)");
        } else if (amount >= 200000 && amount <= 200100) {
            score += 25;
            evidences.add("接近20万大额报告门槛(" + amount + "元)");
        }

        String txnType = txn.getTransactionType() != null ? txn.getTransactionType().toLowerCase() : "";
        if (txnType.contains("转账")) {
            LocalDateTime todayStart = LocalDate.now().atStartOfDay();
            Long transferCount = transactionRepository.findByUserId(txn.getUserId()).stream()
                .filter(t -> t.getCreatedAt().isAfter(todayStart))
                .filter(t -> t.getTransactionType() != null
                    && t.getTransactionType().contains("转账"))
                .count();
            if (transferCount >= 10) {
                score += 15;
                evidences.add("当日频繁转账(" + transferCount + "笔)");
            }

            BigDecimal transferTotal = transactionRepository.sumApprovedAmountByUserIdAndCreatedAtAfter(
                txn.getUserId(), todayStart);
            double total = transferTotal != null ? transferTotal.doubleValue() : 0;
            if (total >= 200000) {
                score += 20;
                evidences.add("当日转账累计超20万(" + total + "元)");
            }
        }

        if (txn.getToAccount() != null) {
            LocalDateTime oneMonthAgo = LocalDateTime.now().minusDays(30);
            List<Transaction> userTxns = transactionRepository.findByUserId(txn.getUserId()).stream()
                .filter(t -> t.getCreatedAt().isAfter(oneMonthAgo))
                .toList();
            long uniquePayees = userTxns.stream()
                .map(Transaction::getToAccount)
                .filter(Objects::nonNull)
                .distinct()
                .count();
            if (uniquePayees >= 10) {
                score += 15;
                evidences.add("分散转账至多账户(" + uniquePayees + "个收款人)");
            }
        }

        if (txn.getMerchant() != null) {
            String merchant = txn.getMerchant().toLowerCase();
            if (merchant.contains("贸易") || merchant.contains("进出口") || merchant.contains("外贸")
                || merchant.contains("跨境") || merchant.contains("海外")) {
                score += 10;
                evidences.add("疑似贸易类商户(" + txn.getMerchant() + ")");
            }
        }

        LocalDateTime oneDayAgo = txn.getCreatedAt().minusDays(1);
        List<Transaction> recentTxns = transactionRepository.findByUserId(txn.getUserId()).stream()
            .filter(t -> t.getCreatedAt().isAfter(oneDayAgo))
            .toList();
        long incoming = recentTxns.stream()
            .filter(t -> t.getStatus() != null && t.getStatus().equals("APPROVED"))
            .count();
        long outgoing = recentTxns.stream()
            .filter(t -> "APPROVED".equals(t.getStatus()))
            .filter(t -> t.getTransactionType() != null
                && (t.getTransactionType().contains("转账") || t.getTransactionType().contains("提现")))
            .count();
        if (incoming >= 5 && outgoing >= 5) {
            score += 15;
            evidences.add("快进快出模式(进" + incoming + "笔/出" + outgoing + "笔)");
        }

        if (txnType.contains("转账") && amount >= 5000 && amount <= 50000) {
            if (Math.abs(amount - 49999) < 100 || Math.abs(amount - 9999) < 100) {
                score += 10;
                evidences.add("结构化交易特征(刻意低于监管门槛)");
            }
        }

        if (txn.getIpAddress() != null && user != null && user.getRegisteredCountry() != null) {
            if (txn.getLocation() != null && !txn.getLocation().contains(user.getRegisteredCountry())
                && !txn.getLocation().contains("中国")) {
                score += 15;
                evidences.add("跨境交易(" + txn.getLocation() + ")");
            }
        }

        score = Math.min(score, 100);
        if (score >= MONEY_LAUNDERING_THRESHOLD) {
            evidence.append("【洗钱特征】").append(String.join("; ", evidences));
        }
        return score;
    }

    private String determinePrimaryFraudType(FraudPatternDetection detection) {
        double[] scores = {
            detection.getStolenCardScore().doubleValue(),
            detection.getCashOutScore().doubleValue(),
            detection.getFakeTransactionScore().doubleValue(),
            detection.getAccountTakeoverScore().doubleValue(),
            detection.getMoneyLaunderingScore().doubleValue()
        };
        String[] types = {"STOLEN_CARD", "CASH_OUT", "FAKE_TRANSACTION",
            "ACCOUNT_TAKEOVER", "MONEY_LAUNDERING"};

        double maxScore = 0;
        int maxIndex = -1;
        for (int i = 0; i < scores.length; i++) {
            if (scores[i] > maxScore) {
                maxScore = scores[i];
                maxIndex = i;
            }
        }

        double[] thresholds = {STOLEN_CARD_THRESHOLD, CASH_OUT_THRESHOLD, FAKE_TXN_THRESHOLD,
            ACCOUNT_TAKEOVER_THRESHOLD, MONEY_LAUNDERING_THRESHOLD};

        if (maxIndex >= 0 && maxScore >= thresholds[maxIndex]) {
            return types[maxIndex];
        }
        return "NORMAL";
    }

    private String extractPatternFeatures(Transaction txn, UserAccount user, FraudPatternDetection d) {
        return String.format(
            "stolenCard=%.1f|cashOut=%.1f|fake=%.1f|takeover=%.1f|laundering=%.1f|amount=%.2f|type=%s|location=%s|time=%d",
            d.getStolenCardScore(), d.getCashOutScore(), d.getFakeTransactionScore(),
            d.getAccountTakeoverScore(), d.getMoneyLaunderingScore(),
            txn.getAmount(), txn.getTransactionType(), txn.getLocation(),
            txn.getCreatedAt().getHour()
        );
    }

    private BigDecimal round(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP);
    }

    @Override
    public Map<String, Object> getPatternDetectionStats() {
        Map<String, Object> stats = new HashMap<>();
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        stats.put("totalDetections", detectionRepository.count());
        stats.put("stolenCardCount", detectionRepository.countByIsStolenCardTrueAndDetectedAtAfter(startOfDay));
        stats.put("cashOutCount", detectionRepository.countByIsCashOutTrueAndDetectedAtAfter(startOfDay));
        stats.put("fakeTransactionCount", detectionRepository.countByIsFakeTransactionTrueAndDetectedAtAfter(startOfDay));

        List<Object[]> fraudTypeCounts = detectionRepository.countByFraudTypeAndDetectedAtAfter(startOfDay);
        Map<String, Long> fraudTypeMap = new HashMap<>();
        for (Object[] row : fraudTypeCounts) {
            fraudTypeMap.put((String) row[0], (Long) row[1]);
        }
        stats.put("fraudTypeDistribution", fraudTypeMap);

        return stats;
    }

    @Override
    public FraudPatternDetection getDetectionByTransaction(String transactionId) {
        return detectionRepository.findByTransactionId(transactionId).orElse(null);
    }
}
