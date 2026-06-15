package com.exam.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.exam.entity.KnowledgePoint;
import com.exam.mapper.KnowledgePointMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class KnowledgeService {

    @Autowired
    private KnowledgePointMapper knowledgePointMapper;

    public List<Map<String, Object>> getTree(String subject) {
        LambdaQueryWrapper<KnowledgePoint> wrapper = new LambdaQueryWrapper<>();
        if (subject != null && !subject.trim().isEmpty()) {
            wrapper.eq(KnowledgePoint::getSubject, subject);
        }
        wrapper.orderByAsc(KnowledgePoint::getId);
        List<KnowledgePoint> list = knowledgePointMapper.selectList(wrapper);

        if (list == null || list.isEmpty()) {
            return new ArrayList<>();
        }

        Map<Long, Map<String, Object>> nodeMap = new LinkedHashMap<>();
        for (KnowledgePoint kp : list) {
            Map<String, Object> node = new LinkedHashMap<>();
            node.put("id", kp.getId());
            node.put("name", kp.getName());
            node.put("subject", kp.getSubject());
            node.put("parentId", kp.getParentId());
            node.put("createTime", kp.getCreateTime());
            node.put("updateTime", kp.getUpdateTime());
            node.put("children", new ArrayList<Map<String, Object>>());
            nodeMap.put(kp.getId(), node);
        }

        List<Map<String, Object>> roots = new ArrayList<>();
        for (KnowledgePoint kp : list) {
            Map<String, Object> node = nodeMap.get(kp.getId());
            Long parentId = kp.getParentId();
            if (parentId == null || parentId == 0L) {
                roots.add(node);
            } else {
                Map<String, Object> parent = nodeMap.get(parentId);
                if (parent != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> children = (List<Map<String, Object>>) parent.get("children");
                    children.add(node);
                } else {
                    roots.add(node);
                }
            }
        }

        return roots;
    }

    @Transactional
    public KnowledgePoint create(KnowledgePoint entity) {
        if (entity == null) {
            return null;
        }
        entity.setId(null);
        LocalDateTime now = LocalDateTime.now();
        entity.setCreateTime(now);
        entity.setUpdateTime(now);
        if (entity.getParentId() == null) {
            entity.setParentId(0L);
        }
        knowledgePointMapper.insert(entity);
        return entity;
    }

    @Transactional
    public void update(Long id, KnowledgePoint entity) {
        if (id == null || entity == null) {
            return;
        }
        KnowledgePoint exist = knowledgePointMapper.selectById(id);
        if (exist == null) {
            return;
        }
        if (entity.getName() != null) {
            exist.setName(entity.getName());
        }
        if (entity.getSubject() != null) {
            exist.setSubject(entity.getSubject());
        }
        if (entity.getParentId() != null) {
            exist.setParentId(entity.getParentId());
        }
        exist.setUpdateTime(LocalDateTime.now());
        knowledgePointMapper.updateById(exist);
    }

    @Transactional
    public void delete(Long id) {
        if (id == null) {
            return;
        }
        knowledgePointMapper.deleteById(id);
    }

    public List<KnowledgePoint> getFlatList(String subject) {
        LambdaQueryWrapper<KnowledgePoint> wrapper = new LambdaQueryWrapper<>();
        if (subject != null && !subject.trim().isEmpty()) {
            wrapper.eq(KnowledgePoint::getSubject, subject);
        }
        wrapper.orderByAsc(KnowledgePoint::getId);
        return knowledgePointMapper.selectList(wrapper);
    }
}
