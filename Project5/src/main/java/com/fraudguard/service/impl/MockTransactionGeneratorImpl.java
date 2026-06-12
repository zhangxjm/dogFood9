package com.fraudguard.service.impl;

import com.fraudguard.entity.Transaction;
import com.fraudguard.entity.UserAccount;
import com.fraudguard.repository.UserAccountRepository;
import com.fraudguard.service.MockTransactionGenerator;
import com.fraudguard.service.TransactionService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Random;
import java.util.concurrent.ScheduledFuture;

@Slf4j
@Service
@RequiredArgsConstructor
public class MockTransactionGeneratorImpl implements MockTransactionGenerator {

    private final TransactionService transactionService;
    private final UserAccountRepository userAccountRepository;
    private final ThreadPoolTaskScheduler taskScheduler;

    private ScheduledFuture<?> scheduledTask;
    private volatile boolean generating = false;
    private final Random random = new Random();

    private static final String[] MERCHANTS = {
        "淘宝", "京东", "天猫", "拼多多", "美团", "饿了么", "携程", "12306",
        "支付宝", "微信支付", "苏宁易购", "当当网", "唯品会", "小米商城",
        "星巴克", "麦当劳", "肯德基", "海底捞", "沃尔玛", "家乐福",
        "Apple Store", "华为商城", "网易严选", "得物", "小红书"
    };

    private static final String[] TRANSACTION_TYPES = {
        "消费", "转账", "还款", "充值", "缴费", "理财", "提现"
    };

    private static final String[] LOCATIONS = {
        "北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "西安",
        "南京", "重庆", "天津", "苏州", "长沙", "郑州", "青岛", "厦门"
    };

    private static final String[] HIGH_RISK_MERCHANTS = {
        "CryptoExchange", "BitcoinWallet", "虚拟货币交易所", "境外赌博平台",
        "加密货币投资", "外汇保证金", "贵金属交易", "私募基金"
    };

    @Override
    public void startGenerating(int transactionsPerMinute) {
        if (generating) {
            log.info("Mock transaction generator already running");
            return;
        }

        generating = true;
        long intervalMs = 60000L / transactionsPerMinute;

        scheduledTask = taskScheduler.scheduleAtFixedRate(() -> {
            try {
                generateOneTransaction();
            } catch (Exception e) {
                log.error("Error generating mock transaction", e);
            }
        }, intervalMs);

        log.info("Mock transaction generator started: {} TPM", transactionsPerMinute);
    }

    @Override
    public void stopGenerating() {
        generating = false;
        if (scheduledTask != null && !scheduledTask.isCancelled()) {
            scheduledTask.cancel(false);
        }
        log.info("Mock transaction generator stopped");
    }

    @Override
    public boolean isGenerating() {
        return generating;
    }

    @Override
    public void generateOneTransaction() {
        List<UserAccount> users = userAccountRepository.findAll();
        if (users.isEmpty()) {
            return;
        }

        UserAccount fromUser = users.get(random.nextInt(users.size()));
        UserAccount toUser = users.get(random.nextInt(users.size()));

        Transaction transaction = new Transaction();
        transaction.setUserId(fromUser.getUserId());
        transaction.setFromAccount(fromUser.getAccountNumber());
        transaction.setToAccount(toUser.getAccountNumber());

        boolean isHighRisk = random.nextInt(100) < 15;

        if (isHighRisk) {
            generateHighRiskTransaction(transaction, fromUser);
        } else {
            generateNormalTransaction(transaction, fromUser);
        }

        transaction.setCurrency("CNY");
        transaction.setDeviceId("DEV" + String.format("%08d", random.nextInt(100000000)));
        transaction.setIpAddress(generateIpAddress());
        transaction.setCardNumberLast4(String.format("%04d", random.nextInt(10000)));
        transaction.setDescription("交易描述");

        transactionService.createTransaction(transaction);
    }

    @Override
    public void generateBatchTransactions(int count) {
        for (int i = 0; i < count; i++) {
            try {
                generateOneTransaction();
            } catch (Exception e) {
                log.error("Error generating batch transaction", e);
            }
        }
        log.info("Batch generated {} transactions", count);
    }

    private void generateNormalTransaction(Transaction transaction, UserAccount fromUser) {
        double amount = 50 + random.nextDouble() * 5000;
        transaction.setAmount(BigDecimal.valueOf(amount).setScale(2, RoundingMode.HALF_UP));
        transaction.setMerchant(MERCHANTS[random.nextInt(MERCHANTS.length)]);
        transaction.setTransactionType(TRANSACTION_TYPES[random.nextInt(TRANSACTION_TYPES.length - 1)]);

        if (fromUser.getRegisteredCity() != null && random.nextBoolean()) {
            transaction.setLocation(fromUser.getRegisteredCity());
        } else {
            transaction.setLocation(LOCATIONS[random.nextInt(LOCATIONS.length)]);
        }
    }

    private void generateHighRiskTransaction(Transaction transaction, UserAccount fromUser) {
        int riskType = random.nextInt(5);

        switch (riskType) {
            case 0:
                double largeAmount = 10000 + random.nextDouble() * 100000;
                transaction.setAmount(BigDecimal.valueOf(largeAmount).setScale(2, RoundingMode.HALF_UP));
                transaction.setMerchant(MERCHANTS[random.nextInt(MERCHANTS.length)]);
                transaction.setTransactionType("转账");
                break;
            case 1:
                transaction.setAmount(BigDecimal.valueOf(500 + random.nextDouble() * 2000).setScale(2, RoundingMode.HALF_UP));
                transaction.setMerchant(HIGH_RISK_MERCHANTS[random.nextInt(HIGH_RISK_MERCHANTS.length)]);
                transaction.setTransactionType("消费");
                break;
            case 2:
                transaction.setAmount(BigDecimal.valueOf(200 + random.nextDouble() * 1000).setScale(2, RoundingMode.HALF_UP));
                transaction.setMerchant(MERCHANTS[random.nextInt(MERCHANTS.length)]);
                transaction.setTransactionType("消费");
                String otherCity = LOCATIONS[random.nextInt(LOCATIONS.length)];
                while (otherCity.equals(fromUser.getRegisteredCity())) {
                    otherCity = LOCATIONS[random.nextInt(LOCATIONS.length)];
                }
                transaction.setLocation(otherCity);
                break;
            case 3:
                double midnightAmount = 100 + random.nextDouble() * 3000;
                transaction.setAmount(BigDecimal.valueOf(midnightAmount).setScale(2, RoundingMode.HALF_UP));
                transaction.setMerchant(MERCHANTS[random.nextInt(MERCHANTS.length)]);
                transaction.setTransactionType("消费");
                break;
            case 4:
                transaction.setAmount(BigDecimal.valueOf(3000 + random.nextDouble() * 20000).setScale(2, RoundingMode.HALF_UP));
                transaction.setMerchant(MERCHANTS[random.nextInt(MERCHANTS.length)]);
                transaction.setTransactionType("转账");
                break;
        }

        if (transaction.getLocation() == null) {
            transaction.setLocation(LOCATIONS[random.nextInt(LOCATIONS.length)]);
        }
    }

    private String generateIpAddress() {
        return random.nextInt(223) + 1 + "."
            + random.nextInt(256) + "."
            + random.nextInt(256) + "."
            + random.nextInt(256);
    }
}
