package com.bonded.warehouse.service;

import com.bonded.warehouse.entity.PackTask;
import com.bonded.warehouse.mapper.PackTaskMapper;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PackTaskService {

    private final PackTaskMapper packTaskMapper;

    public PackTaskService(PackTaskMapper packTaskMapper) {
        this.packTaskMapper = packTaskMapper;
    }

    public List<PackTask> list() {
        return packTaskMapper.findAll();
    }

    public List<PackTask> getByOrderId(Long orderId) {
        return packTaskMapper.findByOrderId(orderId);
    }

    public int complete(Long taskId) {
        return packTaskMapper.updateStatus(taskId, "已完成");
    }
}
