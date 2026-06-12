package com.bonded.customs.service;

import com.bonded.customs.entity.CustomsDeclaration;
import com.bonded.customs.mapper.CustomsDeclarationMapper;
import com.bonded.customs.mapper.CustomsLogMapper;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.List;

@Service
public class CustomsDeclarationService {

    private final CustomsDeclarationMapper declarationMapper;
    private final CustomsLogMapper logMapper;
    private final ThreeDocumentService threeDocumentService;

    public CustomsDeclarationService(CustomsDeclarationMapper declarationMapper, CustomsLogMapper logMapper, ThreeDocumentService threeDocumentService) {
        this.declarationMapper = declarationMapper;
        this.logMapper = logMapper;
        this.threeDocumentService = threeDocumentService;
    }

    public List<CustomsDeclaration> list() {
        return declarationMapper.findAll();
    }

    public CustomsDeclaration getById(Long id) {
        return declarationMapper.findById(id);
    }

    public CustomsDeclaration getByOrderNo(String orderNo) {
        return declarationMapper.findByOrderNo(orderNo);
    }

    public CustomsDeclaration create(CustomsDeclaration declaration) {
        String declarationNo = "BGD" + System.currentTimeMillis();
        declaration.setDeclarationNo(declarationNo);
        declaration.setStatus("待提交");
        declaration.setCreateTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        declarationMapper.insert(declaration);
        logMapper.insert(createLog(declaration.getId(), "创建申报", "创建清关申报单" + declarationNo, "系统"));
        return declarationMapper.findByDeclarationNo(declarationNo);
    }

    public CustomsDeclaration submitForReview(Long id) {
        CustomsDeclaration declaration = declarationMapper.findById(id);
        if (declaration == null) {
            return null;
        }
        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        declarationMapper.updateStatus(id, "审核中", null, null);
        logMapper.insert(createLog(id, "提交审核", "提交清关申报单待审核", "系统"));
        autoApprove(id);
        return declarationMapper.findById(id);
    }

    public void autoApprove(Long id) {
        CustomsDeclaration declaration = declarationMapper.findById(id);
        if (declaration == null) {
            return;
        }
        String orderNo = declaration.getOrderNo();
        var matchResult = threeDocumentService.compareDocumentsByOrderNo(orderNo);
        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        if ("一致".equals(matchResult.getMatchStatus())) {
            declarationMapper.updateStatus(id, "已通过", now, null);
            logMapper.insert(createLog(id, "审核通过", "清关申报自动审核通过", "系统"));
        } else {
            declarationMapper.updateStatus(id, "已驳回", now, matchResult.getMatchResult());
            logMapper.insert(createLog(id, "审核驳回", "清关申报审核驳回：" + matchResult.getMatchResult(), "系统"));
        }
    }

    public CustomsDeclaration approve(Long id) {
        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        declarationMapper.updateStatus(id, "已通过", now, null);
        logMapper.insert(createLog(id, "审核通过", "清关申报人工审核通过", "管理员"));
        return declarationMapper.findById(id);
    }

    public CustomsDeclaration reject(Long id, String reason) {
        String now = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
        declarationMapper.updateStatus(id, "已驳回", now, reason);
        logMapper.insert(createLog(id, "审核驳回", "清关申报人工审核驳回：" + reason, "管理员"));
        return declarationMapper.findById(id);
    }

    public List<CustomsDeclaration> listByStatus(String status) {
        return declarationMapper.findByStatus(status);
    }

    private com.bonded.customs.entity.CustomsLog createLog(Long declarationId, String action, String detail, String operator) {
        com.bonded.customs.entity.CustomsLog log = new com.bonded.customs.entity.CustomsLog();
        log.setDeclarationId(declarationId);
        log.setAction(action);
        log.setDetail(detail);
        log.setOperator(operator);
        log.setCreateTime(new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date()));
        return log;
    }
}
