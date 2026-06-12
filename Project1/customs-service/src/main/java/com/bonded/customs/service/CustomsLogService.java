package com.bonded.customs.service;

import com.bonded.customs.entity.CustomsLog;
import com.bonded.customs.mapper.CustomsLogMapper;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Service
public class CustomsLogService {

    private final CustomsLogMapper logMapper;

    public CustomsLogService(CustomsLogMapper logMapper) {
        this.logMapper = logMapper;
    }

    public void logAction(Long declarationId, String action, String detail, String operator) {
        CustomsLog log = new CustomsLog();
        log.setDeclarationId(declarationId);
        log.setAction(action);
        log.setDetail(detail);
        log.setOperator(operator);
        log.setCreateTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        logMapper.insert(log);
    }

    public List<CustomsLog> getByDeclarationId(Long declarationId) {
        return logMapper.findByDeclarationId(declarationId);
    }
}
