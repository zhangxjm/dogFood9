package com.smartgrid.controller;

import com.smartgrid.entity.AlarmRecord;
import com.smartgrid.repository.AlarmRecordRepository;
import com.smartgrid.service.GridControlService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alarms")
@Slf4j
public class AlarmController {

    private final AlarmRecordRepository alarmRecordRepository;
    private final GridControlService gridControlService;

    public AlarmController(AlarmRecordRepository alarmRecordRepository, GridControlService gridControlService) {
        this.alarmRecordRepository = alarmRecordRepository;
        this.gridControlService = gridControlService;
    }

    @GetMapping
    public List<AlarmRecord> listUnacknowledged() {
        return alarmRecordRepository.findByAcknowledgedFalseOrderByCreatedAtDesc();
    }

    @GetMapping("/all")
    public List<AlarmRecord> listAll() {
        return alarmRecordRepository.findAll();
    }

    @GetMapping("/device/{deviceId}")
    public List<AlarmRecord> getByDevice(@PathVariable String deviceId) {
        return alarmRecordRepository.findByDeviceIdOrderByCreatedAtDesc(deviceId);
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        Map<String, Long> stats = new HashMap<>();
        for (String level : new String[]{"CRITICAL", "WARNING", "INFO", "EMERGENCY"}) {
            stats.put(level, alarmRecordRepository.countByLevelAndAcknowledgedFalse(level));
        }
        return stats;
    }

    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<AlarmRecord> acknowledge(@PathVariable Long id) {
        return alarmRecordRepository.findById(id)
                .map(alarm -> {
                    alarm.setAcknowledged(true);
                    alarm.setAcknowledgedAt(LocalDateTime.now());
                    alarmRecordRepository.save(alarm);
                    return ResponseEntity.ok(alarm);
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
