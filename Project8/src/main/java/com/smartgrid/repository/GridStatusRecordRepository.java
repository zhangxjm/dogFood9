package com.smartgrid.repository;

import com.smartgrid.entity.GridStatusRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface GridStatusRecordRepository extends JpaRepository<GridStatusRecord, Long> {

    List<GridStatusRecord> findTop100ByDeviceIdOrderByRecordTimeDesc(String deviceId);

    List<GridStatusRecord> findByDeviceIdAndRecordTimeBetween(String deviceId, LocalDateTime startTime, LocalDateTime endTime);
}
