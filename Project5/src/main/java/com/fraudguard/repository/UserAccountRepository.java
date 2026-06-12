package com.fraudguard.repository;

import com.fraudguard.entity.UserAccount;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAccountRepository extends JpaRepository<UserAccount, Long> {

    Optional<UserAccount> findByUserId(String userId);

    Optional<UserAccount> findByAccountNumber(String accountNumber);

    Optional<UserAccount> findByPhoneNumber(String phoneNumber);

    List<UserAccount> findByAccountStatus(String accountStatus);

    List<UserAccount> findByRiskLevel(String riskLevel);

    Page<UserAccount> findByUserNameContaining(String keyword, Pageable pageable);

    @Query("SELECT u.riskLevel, COUNT(u) FROM UserAccount u GROUP BY u.riskLevel")
    List<Object[]> countByRiskLevelGroup();

    long countByAccountStatus(String accountStatus);
}
