package com.fraudguard.repository;

import com.fraudguard.entity.TraceabilityRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TraceabilityRecordRepository extends JpaRepository<TraceabilityRecord, Long> {

    Optional<TraceabilityRecord> findByTransactionId(String transactionId);

    Optional<TraceabilityRecord> findByTransactionIdOrderByUpdatedAtDesc(String transactionId);

    long countByCurrentStatus(String currentStatus);

    long countByHasManualInterventionTrue();
}
