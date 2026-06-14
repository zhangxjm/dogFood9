package com.smartparking.repository;

import com.smartparking.entity.BillingRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BillingRecordRepository extends JpaRepository<BillingRecord, Long> {
    List<BillingRecord> findByPlateNumberOrderByCreatedAtDesc(String plateNumber);
    List<BillingRecord> findByStatus(BillingRecord.BillingStatus status);
    List<BillingRecord> findByRecordId(Long recordId);
}
