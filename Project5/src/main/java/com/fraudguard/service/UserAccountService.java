package com.fraudguard.service;

import com.fraudguard.entity.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface UserAccountService {

    Optional<UserAccount> getUserByUserId(String userId);

    Optional<UserAccount> getUserByAccountNumber(String accountNumber);

    Page<UserAccount> getAllUsers(Pageable pageable);

    Page<UserAccount> searchUsers(String keyword, Pageable pageable);

    List<UserAccount> getUsersByRiskLevel(String riskLevel);

    UserAccount createUser(UserAccount user);

    UserAccount updateUserRiskLevel(String userId, String riskLevel);

    boolean freezeAccount(String userId, String reason);

    boolean unfreezeAccount(String userId);

    Map<String, Object> getUserStatistics();

    void initializeSampleUsers();
}
