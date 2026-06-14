package com.smartparking.repository;

import com.smartparking.entity.EntryExitRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface EntryExitRecordRepository extends JpaRepository<EntryExitRecord, Long> {
    Optional<EntryExitRecord> findByPlateNumberAndStatus(String plateNumber, EntryExitRecord.RecordStatus status);
    List<EntryExitRecord> findByStatus(EntryExitRecord.RecordStatus status);
    List<EntryExitRecord> findByEntryTimeBetween(LocalDateTime start, LocalDateTime end);
    List<EntryExitRecord> findByPlateNumberOrderByEntryTimeDesc(String plateNumber);
    long countByStatus(EntryExitRecord.RecordStatus status);
    List<EntryExitRecord> findAllByOrderByEntryTimeDesc();
}
