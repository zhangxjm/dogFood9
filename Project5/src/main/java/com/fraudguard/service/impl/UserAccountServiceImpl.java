package com.fraudguard.service.impl;

import com.fraudguard.entity.UserAccount;
import com.fraudguard.repository.UserAccountRepository;
import com.fraudguard.service.UserAccountService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserAccountServiceImpl implements UserAccountService {

    private final UserAccountRepository userAccountRepository;

    @Override
    public Optional<UserAccount> getUserByUserId(String userId) {
        return userAccountRepository.findByUserId(userId);
    }

    @Override
    public Optional<UserAccount> getUserByAccountNumber(String accountNumber) {
        return userAccountRepository.findByAccountNumber(accountNumber);
    }

    @Override
    public Page<UserAccount> getAllUsers(Pageable pageable) {
        return userAccountRepository.findAll(pageable);
    }

    @Override
    public Page<UserAccount> searchUsers(String keyword, Pageable pageable) {
        return userAccountRepository.findByUserNameContaining(keyword, pageable);
    }

    @Override
    public List<UserAccount> getUsersByRiskLevel(String riskLevel) {
        return userAccountRepository.findByRiskLevel(riskLevel);
    }

    @Override
    @Transactional
    public UserAccount createUser(UserAccount user) {
        if (user.getUserId() == null || user.getUserId().isEmpty()) {
            user.setUserId(generateUserId());
        }
        if (user.getAccountNumber() == null || user.getAccountNumber().isEmpty()) {
            user.setAccountNumber(generateAccountNumber());
        }
        user = userAccountRepository.save(user);
        log.info("User account created: {}", user.getUserId());
        return user;
    }

    @Override
    @Transactional
    public UserAccount updateUserRiskLevel(String userId, String riskLevel) {
        return userAccountRepository.findByUserId(userId)
            .map(user -> {
                user.setRiskLevel(riskLevel);
                return userAccountRepository.save(user);
            }).orElse(null);
    }

    @Override
    @Transactional
    public boolean freezeAccount(String userId, String reason) {
        return userAccountRepository.findByUserId(userId)
            .map(user -> {
                user.setAccountStatus("FROZEN");
                userAccountRepository.save(user);
                log.info("Account {} frozen: {}", userId, reason);
                return true;
            }).orElse(false);
    }

    @Override
    @Transactional
    public boolean unfreezeAccount(String userId) {
        return userAccountRepository.findByUserId(userId)
            .map(user -> {
                user.setAccountStatus("ACTIVE");
                userAccountRepository.save(user);
                log.info("Account {} unfrozen", userId);
                return true;
            }).orElse(false);
    }

    @Override
    public Map<String, Object> getUserStatistics() {
        Map<String, Object> stats = new HashMap<>();

        stats.put("totalUsers", userAccountRepository.count());
        stats.put("activeUsers", userAccountRepository.countByAccountStatus("ACTIVE"));
        stats.put("frozenUsers", userAccountRepository.countByAccountStatus("FROZEN"));

        List<Object[]> riskLevels = userAccountRepository.countByRiskLevelGroup();
        Map<String, Long> riskCount = new HashMap<>();
        for (Object[] row : riskLevels) {
            riskCount.put((String) row[0], (Long) row[1]);
        }
        stats.put("riskDistribution", riskCount);

        return stats;
    }

    @Override
    @Transactional
    public void initializeSampleUsers() {
        if (userAccountRepository.count() > 0) {
            return;
        }

        String[][] sampleUsers = {
            {"张三", "LOW", "128600.50", "北京市朝阳区建国路88号", "北京"},
            {"李四", "LOW", "89500.00", "上海市浦东新区陆家嘴", "上海"},
            {"王五", "MEDIUM", "256000.00", "广州市天河区珠江新城", "广州"},
            {"赵六", "LOW", "45200.30", "深圳市南山区科技园", "深圳"},
            {"钱七", "HIGH", "678000.00", "杭州市西湖区文三路", "杭州"},
            {"孙八", "LOW", "15600.00", "成都市高新区天府大道", "成都"},
            {"周九", "MEDIUM", "345000.00", "武汉市江汉区建设大道", "武汉"},
            {"吴十", "LOW", "78900.00", "西安市雁塔区高新路", "西安"},
            {"郑十一", "LOW", "23400.50", "南京市鼓楼区中山路", "南京"},
            {"王十二", "HIGH", "1250000.00", "重庆市渝中区解放碑", "重庆"},
            {"冯十三", "MEDIUM", "189000.00", "天津市和平区南京路", "天津"},
            {"陈十四", "LOW", "56700.00", "苏州市工业园区金鸡湖", "苏州"},
            {"褚十五", "LOW", "34500.00", "长沙市天心区芙蓉中路", "长沙"},
            {"卫十六", "MEDIUM", "456000.00", "郑州市金水区花园路", "郑州"},
            {"蒋十七", "LOW", "12300.00", "青岛市市南区香港中路", "青岛"}
        };

        for (int i = 0; i < sampleUsers.length; i++) {
            UserAccount user = new UserAccount();
            user.setUserId("U" + String.format("%06d", i + 1001));
            user.setAccountNumber("622202" + String.format("%012d", 100000000000L + i));
            user.setUserName(sampleUsers[i][0]);
            user.setRiskLevel(sampleUsers[i][1]);
            user.setAccountBalance(new BigDecimal(sampleUsers[i][2]));
            user.setRegisteredAddress(sampleUsers[i][3]);
            user.setRegisteredCity(sampleUsers[i][4]);
            user.setRegisteredCountry("中国");
            user.setAccountType("PERSONAL");
            user.setAccountStatus("ACTIVE");
            user.setDailyTransactionLimit(new BigDecimal("100000"));
            user.setCreditScore(new BigDecimal("750"));
            user.setIdCardNumber("110101199" + (i % 10) + "010" + String.format("%03d", i + 10));
            user.setPhoneNumber("138" + String.format("%08d", 10000000 + i));
            user.setEmail("user" + (i + 1) + "@example.com");
            userAccountRepository.save(user);
        }

        log.info("Sample users initialized: {} users", sampleUsers.length);
    }

    private String generateUserId() {
        return "U" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
    }

    private String generateAccountNumber() {
        return "622202" + String.format("%012d", new Random().nextLong(1000000000000L));
    }
}
