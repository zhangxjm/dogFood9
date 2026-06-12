package com.fraudguard.service.impl;

import com.fraudguard.dto.RuleResult;
import com.fraudguard.entity.Blacklist;
import com.fraudguard.entity.RiskRule;
import com.fraudguard.entity.Transaction;
import com.fraudguard.entity.UserAccount;
import com.fraudguard.repository.BlacklistRepository;
import com.fraudguard.repository.RiskRuleRepository;
import com.fraudguard.repository.TransactionRepository;
import com.fraudguard.service.RuleEngineService;
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
public class RuleEngineServiceImpl implements RuleEngineService {

    private final RiskRuleRepository riskRuleRepository;
    private final TransactionRepository transactionRepository;
    private final BlacklistRepository blacklistRepository;

    @Override
    public List<RuleResult> evaluateRules(Transaction transaction, UserAccount userAccount) {
        List<RuleResult> results = new ArrayList<>();

        results.add(checkAmountLimit(transaction));
        results.add(checkVelocity(transaction));
        results.add(checkDailyLimit(transaction, userAccount));
        results.add(checkBlacklist(transaction));
        results.add(checkUnusualTime(transaction));
        results.add(checkUnusualLocation(transaction, userAccount));
        results.add(checkDeviceChange(transaction, userAccount));
        results.add(checkIpRisk(transaction));
        results.add(checkRepeatedRejection(transaction));
        results.add(checkHighRiskMerchant(transaction));

        return results;
    }

    private RuleResult checkAmountLimit(Transaction transaction) {
        BigDecimal maxAmount = new BigDecimal("500000");
        RiskRule rule = getRuleByCode("AMOUNT_LIMIT");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("25");

        boolean triggered = transaction.getAmount().compareTo(maxAmount) > 0;
        String reason = triggered ?
            String.format("交易金额%.2f元超过单笔限额%.2f元", transaction.getAmount(), maxAmount) :
            "交易金额在正常范围内";

        return new RuleResult("AMOUNT_LIMIT", "单笔金额超限规则",
            triggered ? score : BigDecimal.ZERO, triggered, reason, "HIGH");
    }

    private RuleResult checkVelocity(Transaction transaction) {
        RiskRule rule = getRuleByCode("VELOCITY_CHECK");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("20");
        int maxVelocity = 10;
        int windowSeconds = 60;

        LocalDateTime startTime = transaction.getCreatedAt().minusSeconds(windowSeconds);
        LocalDateTime endTime = transaction.getCreatedAt();
        Long count = transactionRepository.countByUserIdAndTimeRange(
            transaction.getUserId(), startTime, endTime);

        boolean triggered = count != null && count >= maxVelocity;
        String reason = triggered ?
            String.format("%d秒内交易%d笔，超过速率限制%d笔", windowSeconds, count, maxVelocity) :
            "交易速率正常";

        return new RuleResult("VELOCITY_CHECK", "交易速率检测规则",
            triggered ? score : BigDecimal.ZERO, triggered, reason, "HIGH");
    }

    private RuleResult checkDailyLimit(Transaction transaction, UserAccount userAccount) {
        RiskRule rule = getRuleByCode("DAILY_LIMIT");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("15");

        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        BigDecimal dailyAmount = transactionRepository.sumApprovedAmountByUserIdAndCreatedAtAfter(
            transaction.getUserId(), startOfDay);
        if (dailyAmount == null) {
            dailyAmount = BigDecimal.ZERO;
        }

        BigDecimal limit = userAccount != null ?
            userAccount.getDailyTransactionLimit() : new BigDecimal("100000");
        BigDecimal totalAfter = dailyAmount.add(transaction.getAmount());

        boolean triggered = totalAfter.compareTo(limit) > 0;
        String reason = triggered ?
            String.format("今日累计交易%.2f元，加上本笔%.2f元后超过日限额%.2f元", dailyAmount, transaction.getAmount(), limit) :
            "日交易限额正常";

        return new RuleResult("DAILY_LIMIT", "日交易限额规则",
            triggered ? score : BigDecimal.ZERO, triggered, reason, "MEDIUM");
    }

    private RuleResult checkBlacklist(Transaction transaction) {
        RiskRule rule = getRuleByCode("BLACKLIST_CHECK");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("30");

        List<String> reasons = new ArrayList<>();
        boolean triggered = false;

        if (blacklistRepository.existsByBlacklistTypeAndBlacklistValueAndEnabledTrue(
            "CARD", transaction.getCardNumberLast4())) {
            triggered = true;
            reasons.add("卡号在黑名单中");
        }

        if (blacklistRepository.existsByBlacklistTypeAndBlacklistValueAndEnabledTrue(
            "IP", transaction.getIpAddress())) {
            triggered = true;
            reasons.add("IP地址在黑名单中");
        }

        if (blacklistRepository.existsByBlacklistTypeAndBlacklistValueAndEnabledTrue(
            "ACCOUNT", transaction.getToAccount())) {
            triggered = true;
            reasons.add("收款账户在黑名单中");
        }

        if (blacklistRepository.existsByBlacklistTypeAndBlacklistValueAndEnabledTrue(
            "USER", transaction.getUserId())) {
            triggered = true;
            reasons.add("用户在黑名单中");
        }

        String reason = triggered ?
            String.join("; ", reasons) :
            "未命中黑名单";

        return new RuleResult("BLACKLIST_CHECK", "黑名单检测规则",
            triggered ? score : BigDecimal.ZERO, triggered, reason, "CRITICAL");
    }

    private RuleResult checkUnusualTime(Transaction transaction) {
        RiskRule rule = getRuleByCode("UNUSUAL_TIME");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("10");

        LocalTime transactionTime = transaction.getCreatedAt().toLocalTime();
        LocalTime nightStart = LocalTime.of(23, 0);
        LocalTime nightEnd = LocalTime.of(5, 0);

        boolean isNight = transactionTime.isAfter(nightStart) || transactionTime.isBefore(nightEnd);

        String reason = isNight ?
            String.format("交易时间%s为深夜时段", transactionTime) :
            "交易时间正常";

        return new RuleResult("UNUSUAL_TIME", "异常交易时间规则",
            isNight ? score : BigDecimal.ZERO, isNight, reason, "LOW");
    }

    private RuleResult checkUnusualLocation(Transaction transaction, UserAccount userAccount) {
        RiskRule rule = getRuleByCode("UNUSUAL_LOCATION");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("15");

        boolean triggered = false;
        String reason = "交易地点正常";

        if (userAccount != null && userAccount.getRegisteredCity() != null
            && transaction.getLocation() != null) {
            triggered = !transaction.getLocation().contains(userAccount.getRegisteredCity())
                && !userAccount.getRegisteredCity().contains(transaction.getLocation());
            if (triggered) {
                reason = String.format("交易地点%s与注册城市%s不一致",
                    transaction.getLocation(), userAccount.getRegisteredCity());
            }
        }

        return new RuleResult("UNUSUAL_LOCATION", "异常地点规则",
            triggered ? score : BigDecimal.ZERO, triggered, reason, "MEDIUM");
    }

    private RuleResult checkDeviceChange(Transaction transaction, UserAccount userAccount) {
        RiskRule rule = getRuleByCode("DEVICE_CHANGE");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("12");

        boolean triggered = false;
        String reason = "设备信息正常";

        if (transaction.getDeviceId() != null && userAccount != null) {
            LocalDateTime oneMonthAgo = LocalDateTime.now().minusDays(30);
            Long count = transactionRepository.countByDeviceIdAndCreatedAtAfter(
                transaction.getDeviceId(), oneMonthAgo);
            if (count != null && count == 0) {
                triggered = true;
                reason = "使用新设备进行交易";
            }
        }

        return new RuleResult("DEVICE_CHANGE", "设备变更检测规则",
            triggered ? score : BigDecimal.ZERO, triggered, reason, "MEDIUM");
    }

    private RuleResult checkIpRisk(Transaction transaction) {
        RiskRule rule = getRuleByCode("IP_RISK");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("15");

        boolean triggered = false;
        String reason = "IP地址正常";

        if (transaction.getIpAddress() != null) {
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            Long count = transactionRepository.countByIpAddressAndCreatedAtAfter(
                transaction.getIpAddress(), oneHourAgo);
            if (count != null && count > 20) {
                triggered = true;
                reason = String.format("该IP地址1小时内交易%d笔，存在风险", count);
            }
        }

        return new RuleResult("IP_RISK", "IP风险检测规则",
            triggered ? score : BigDecimal.ZERO, triggered, reason, "MEDIUM");
    }

    private RuleResult checkRepeatedRejection(Transaction transaction) {
        RiskRule rule = getRuleByCode("REPEATED_REJECTION");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("18");

        boolean triggered = false;
        String reason = "历史交易正常";

        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        Long rejectedCount = transactionRepository.countRejectedByFromAccountAndCreatedAtAfter(
            transaction.getFromAccount(), oneDayAgo);

        if (rejectedCount != null && rejectedCount >= 3) {
            triggered = true;
            reason = String.format("该账户24小时内有%d笔被拒绝交易", rejectedCount);
        }

        return new RuleResult("REPEATED_REJECTION", "重复拒付检测规则",
            triggered ? score : BigDecimal.ZERO, triggered, reason, "HIGH");
    }

    private RuleResult checkHighRiskMerchant(Transaction transaction) {
        RiskRule rule = getRuleByCode("HIGH_RISK_MERCHANT");
        BigDecimal score = rule != null ? rule.getScoreWeight() : new BigDecimal("20");

        boolean triggered = false;
        String reason = "商户正常";

        if (transaction.getMerchant() != null) {
            String merchantLower = transaction.getMerchant().toLowerCase();
            if (merchantLower.contains("crypto") || merchantLower.contains("bitcoin")
                || merchantLower.contains("虚拟货币") || merchantLower.contains("加密货币")
                || merchantLower.contains("赌博") || merchantLower.contains("gamble")) {
                triggered = true;
                reason = String.format("高风险商户: %s", transaction.getMerchant());
            }
        }

        return new RuleResult("HIGH_RISK_MERCHANT", "高风险商户规则",
            triggered ? score : BigDecimal.ZERO, triggered, reason, "HIGH");
    }

    @Override
    public String generateRiskReasons(List<RuleResult> results) {
        StringBuilder sb = new StringBuilder();
        for (RuleResult result : results) {
            if (result.isTriggered()) {
                if (sb.length() > 0) {
                    sb.append("; ");
                }
                sb.append("[").append(result.getSeverity()).append("]")
                    .append(result.getRuleName()).append(": ")
                    .append(result.getReason());
            }
        }
        return sb.length() > 0 ? sb.toString() : "无风险";
    }

    private RiskRule getRuleByCode(String ruleCode) {
        try {
            return riskRuleRepository.findByRuleCode(ruleCode).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
