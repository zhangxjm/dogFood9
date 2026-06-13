package com.smartgrid.controller;

import com.smartgrid.entity.GridStatusRecord;
import com.smartgrid.repository.GridStatusRecordRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@RestController
@RequestMapping("/api/status")
@Slf4j
public class StatusRecordController {

    private final GridStatusRecordRepository gridStatusRecordRepository;

    public StatusRecordController(GridStatusRecordRepository gridStatusRecordRepository) {
        this.gridStatusRecordRepository = gridStatusRecordRepository;
    }

    @GetMapping("/device/{deviceId}")
    public List<GridStatusRecord> getLatest(@PathVariable String deviceId) {
        return gridStatusRecordRepository.findTop100ByDeviceIdOrderByRecordTimeDesc(deviceId);
    }

    @GetMapping("/device/{deviceId}/range")
    public List<GridStatusRecord> getByRange(@PathVariable String deviceId,
                                              @RequestParam String start,
                                              @RequestParam String end) {
        LocalDateTime startTime = LocalDateTime.parse(start, DateTimeFormatter.ISO_DATE_TIME);
        LocalDateTime endTime = LocalDateTime.parse(end, DateTimeFormatter.ISO_DATE_TIME);
        return gridStatusRecordRepository.findByDeviceIdAndRecordTimeBetween(deviceId, startTime, endTime);
    }
}
