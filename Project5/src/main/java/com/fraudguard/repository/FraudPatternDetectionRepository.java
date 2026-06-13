package com.fraudguard.repository;

import com.fraudguard.entity.FraudPatternDetection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FraudPatternDetectionRepository extends JpaRepository<FraudPatternDetection, Long> {

    Optional<FraudPatternDetection> findByTransactionId(String transactionId);

    List<FraudPatternDetection> findByUserId(String userId);

    List<FraudPatternDetection> findByFraudType(String fraudType);

    List<FraudPatternDetection> findByIsStolenCardTrue();

    List<FraudPatternDetection> findByIsCashOutTrue();

    List<FraudPatternDetection> findByIsFakeTransactionTrue();

    List<FraudPatternDetection> findByIsAccountTakeoverTrue();

    List<FraudPatternDetection> findByIsMoneyLaunderingTrue();

    @Query("SELECT f.fraudType, COUNT(f) FROM FraudPatternDetection f WHERE f.detectedAt >= :startTime GROUP BY f.fraudType")
    List<Object[]> countByFraudTypeAndDetectedAtAfter(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(f) FROM FraudPatternDetection f WHERE f.confidenceScore >= :threshold AND f.detectedAt >= :startTime")
    long countHighConfidenceDetections(@Param("threshold") java.math.BigDecimal threshold,
                                        @Param("startTime") LocalDateTime startTime);

    long countByIsStolenCardTrueAndDetectedAtAfter(LocalDateTime startTime);

    long countByIsCashOutTrueAndDetectedAtAfter(LocalDateTime startTime);

    long countByIsFakeTransactionTrueAndDetectedAtAfter(LocalDateTime startTime);
}
