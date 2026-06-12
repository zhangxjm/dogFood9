package com.bonded.warehouse.service;

import com.bonded.warehouse.entity.SortTask;
import com.bonded.warehouse.mapper.SortTaskMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SortTaskService {

    private final SortTaskMapper sortTaskMapper;

    public SortTaskService(SortTaskMapper sortTaskMapper) {
        this.sortTaskMapper = sortTaskMapper;
    }

    public List<SortTask> list() {
        return sortTaskMapper.findAll();
    }

    public List<SortTask> getByOrderId(Long orderId) {
        return sortTaskMapper.findByOrderId(orderId);
    }

    public int complete(Long taskId) {
        return sortTaskMapper.updateStatus(taskId, "已完成");
    }
}
