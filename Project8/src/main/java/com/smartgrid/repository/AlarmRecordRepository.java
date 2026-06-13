package com.smartgrid.repository;

import com.smartgrid.entity.AlarmRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlarmRecordRepository extends JpaRepository<AlarmRecord, Long> {

    List<AlarmRecord> findByAcknowledgedFalseOrderByCreatedAtDesc();

    List<AlarmRecord> findByDeviceIdOrderByCreatedAtDesc(String deviceId);

    long countByLevelAndAcknowledgedFalse(String level);
}
