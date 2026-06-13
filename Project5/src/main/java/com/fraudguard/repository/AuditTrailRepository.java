package com.fraudguard.repository;

import com.fraudguard.entity.AuditTrail;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditTrailRepository extends JpaRepository<AuditTrail, Long> {

    List<AuditTrail> findByTransactionIdOrderByActionTimeDesc(String transactionId);

    List<AuditTrail> findByUserIdOrderByActionTimeDesc(String userId);

    List<AuditTrail> findByAlertIdOrderByActionTimeDesc(String alertId);

    Page<AuditTrail> findByOperatorIdOrderByActionTimeDesc(String operatorId, Pageable pageable);

    Page<AuditTrail> findByActionTypeOrderByActionTimeDesc(String actionType, Pageable pageable);

    @Query("SELECT a.actionType, COUNT(a) FROM AuditTrail a WHERE a.actionTime >= :startTime GROUP BY a.actionType")
    List<Object[]> countByActionTypeAndActionTimeAfter(@Param("startTime") LocalDateTime startTime);

    @Query("SELECT COUNT(a) FROM AuditTrail a WHERE a.transactionId = :transactionId AND a.actionType = :actionType")
    long countByTransactionIdAndActionType(@Param("transactionId") String transactionId,
                                             @Param("actionType") String actionType);
}
