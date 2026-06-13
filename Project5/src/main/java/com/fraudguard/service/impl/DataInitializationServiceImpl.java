package com.fraudguard.service.impl;

import com.fraudguard.entity.Blacklist;
import com.fraudguard.entity.SystemStatistics;
import com.fraudguard.repository.BlacklistRepository;
import com.fraudguard.repository.SystemStatisticsRepository;
import com.fraudguard.repository.TransactionRepository;
import com.fraudguard.repository.UserAccountRepository;
import com.fraudguard.service.DataInitializationService;
import com.fraudguard.service.MockTransactionGenerator;
import com.fraudguard.service.RiskRuleService;
import com.fraudguard.service.UserAccountService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataInitializationServiceImpl implements DataInitializationService {

    private final RiskRuleService riskRuleService;
    private final UserAccountService userAccountService;
    private final BlacklistRepository blacklistRepository;
    private final SystemStatisticsRepository systemStatisticsRepository;
    private final MockTransactionGenerator mockTransactionGenerator;
    private final TransactionRepository transactionRepository;
    private final UserAccountRepository userAccountRepository;

    @Value("${fraudguard.stream.enabled:true}")
    private boolean streamEnabled;

    private final AtomicBoolean initialized = new AtomicBoolean(false);

    @PostConstruct
    public void init() {
        try {
            initializeAllData();
        } catch (Exception e) {
            log.error("Data initialization failed", e);
        }
    }

    @Override
    public void initializeAllData() {
        if (initialized.get()) {
            return;
        }

        log.info("Starting data initialization...");

        riskRuleService.initializeDefaultRules();
        log.info("Risk rules initialized");

        userAccountService.initializeSampleUsers();
        log.info("Sample users initialized");

        initializeBlacklist();
        log.info("Blacklist initialized");

        initializeSystemStatistics();
        log.info("System statistics initialized");

        if (transactionRepository.count() == 0) {
            mockTransactionGenerator.generateBatchTransactions(10);
            log.info("Initial transactions generated");
        }

        initialized.set(true);
        log.info("All data initialization completed!");
    }

    @Override
    public boolean isDataInitialized() {
        return initialized.get();
    }

    private void initializeBlacklist() {
        if (blacklistRepository.count() > 0) {
            return;
        }

        String[][] blacklistData = {
            {"IP", "192.168.1.100", "可疑IP地址", "HIGH", "MANUAL"},
            {"IP", "10.0.0.55", "高风险IP", "HIGH", "THREAT_INTEL"},
            {"CARD", "1234", "被盗卡号", "CRITICAL", "BANK_REPORT"},
            {"CARD", "5678", "挂失卡号", "HIGH", "CUSTOMER_REPORT"},
            {"ACCOUNT", "6222029999999999999", "可疑账户", "HIGH", "MANUAL"},
            {"USER", "U001009", "高风险用户", "HIGH", "RISK_ANALYSIS"},
            {"USER", "U001004", "高风险用户", "HIGH", "FRAUD_DETECTION"},
            {"MERCHANT", "CryptoExchange", "加密货币交易所", "MEDIUM", "CATEGORY"}
        };

        for (String[] data : blacklistData) {
            Blacklist blacklist = new Blacklist();
            blacklist.setBlacklistType(data[0]);
            blacklist.setBlacklistValue(data[1]);
            blacklist.setDescription(data[2]);
            blacklist.setRiskLevel(data[3]);
            blacklist.setSource(data[4]);
            blacklist.setEnabled(true);
            blacklist.setCreatedBy("SYSTEM");
            blacklistRepository.save(blacklist);
        }

        log.info("Blacklist initialized: {} entries", blacklistData.length);
    }

    private void initializeSystemStatistics() {
        LocalDate today = LocalDate.now();
        if (systemStatisticsRepository.findByStatDate(today).isPresent()) {
            return;
        }

        SystemStatistics stats = new SystemStatistics();
        stats.setStatDate(today);
        stats.setTotalTransactions(0L);
        stats.setApprovedTransactions(0L);
        stats.setRejectedTransactions(0L);
        stats.setPendingTransactions(0L);
        stats.setTotalAmount(BigDecimal.ZERO);
        stats.setApprovedAmount(BigDecimal.ZERO);
        stats.setRejectedAmount(BigDecimal.ZERO);
        stats.setHighRiskCount(0L);
        stats.setMediumRiskCount(0L);
        stats.setLowRiskCount(0L);
        stats.setFraudAlertsCount(0L);
        stats.setHandledAlertsCount(0L);
        stats.setAvgProcessingTimeMs(0.0);
        stats.setMaxProcessingTimeMs(0L);
        stats.setFraudLossAmount(BigDecimal.ZERO);
        systemStatisticsRepository.save(stats);

        log.info("System statistics initialized for {}", today);
    }
}
