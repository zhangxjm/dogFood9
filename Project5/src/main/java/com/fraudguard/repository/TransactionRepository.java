package com.fraudguard.repository;

import com.fraudguard.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    Optional<Transaction> findByTransactionId(String transactionId);

    List<Transaction> findByUserId(String userId);

    Page<Transaction> findByUserIdOrderByCreatedAtDesc(String userId, Pageable pageable);

    Page<Transaction> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);

    List<Transaction> findByUserIdAndCreatedAtAfter(String userId, LocalDateTime startTime);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.userId = :userId AND t.createdAt >= :startTime AND t.createdAt < :endTime")
    Long countByUserIdAndTimeRange(@Param("userId") String userId,
                                   @Param("startTime") LocalDateTime startTime,
                                   @Param("endTime") LocalDateTime endTime);

    @Query("SELECT SUM(t.amount) FROM Transaction t WHERE t.userId = :userId AND t.status = 'APPROVED' AND t.createdAt >= :startTime")
    BigDecimal sumApprovedAmountByUserIdAndCreatedAtAfter(@Param("userId") String userId,
                                                          @Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.userId = :userId AND t.status = 'APPROVED' AND t.createdAt >= :startTime")
    Long countApprovedByUserIdAndCreatedAtAfter(@Param("userId") String userId,
                                                @Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.ipAddress = :ipAddress AND t.createdAt >= :startTime")
    Long countByIpAddressAndCreatedAtAfter(@Param("ipAddress") String ipAddress,
                                           @Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.deviceId = :deviceId AND t.createdAt >= :startTime")
    Long countByDeviceIdAndCreatedAtAfter(@Param("deviceId") String deviceId,
                                          @Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.fromAccount = :fromAccount AND t.status = 'REJECTED' AND t.createdAt >= :startTime")
    Long countRejectedByFromAccountAndCreatedAtAfter(@Param("fromAccount") String fromAccount,
                                                     @Param("startTime") LocalDateTime startTime);

    List<Transaction> findTop100ByOrderByCreatedAtDesc();

    Page<Transaction> findByRiskLevelOrderByCreatedAtDesc(String riskLevel, Pageable pageable);

    long countByStatus(String status);

    long countByRiskLevel(String riskLevel);

    @Query("SELECT COUNT(t) FROM Transaction t WHERE t.createdAt >= :startTime")
    long countByCreatedAtAfter(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT t.riskLevel, COUNT(t) FROM Transaction t WHERE t.createdAt >= :startTime GROUP BY t.riskLevel")
    List<Object[]> countByRiskLevelAndCreatedAtAfter(@Param("startTime") LocalDateTime startTime);
}
