package com.fraudguard.repository;

import com.fraudguard.entity.FraudAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FraudAlertRepository extends JpaRepository<FraudAlert, Long> {

    Optional<FraudAlert> findByAlertId(String alertId);

    Optional<FraudAlert> findByTransactionId(String transactionId);

    List<FraudAlert> findByUserId(String userId);

    Page<FraudAlert> findByAlertStatusOrderByCreatedAtDesc(String alertStatus, Pageable pageable);

    Page<FraudAlert> findByAlertLevelOrderByCreatedAtDesc(String alertLevel, Pageable pageable);

    long countByAlertStatus(String alertStatus);

    long countByAlertLevel(String alertLevel);

    @Query("SELECT f.alertLevel, COUNT(f) FROM FraudAlert f WHERE f.createdAt >= :startTime GROUP BY f.alertLevel")
    List<Object[]> countByAlertLevelAndCreatedAtAfter(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(f) FROM FraudAlert f WHERE f.createdAt >= :startTime")
    long countByCreatedAtAfter(@Param("startTime") LocalDateTime startTime);

    List<FraudAlert> findTop20ByOrderByCreatedAtDesc();
}
