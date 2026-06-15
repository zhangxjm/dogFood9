package com.exam.controller;

import com.exam.common.Result;
import com.exam.entity.KnowledgePoint;
import com.exam.service.KnowledgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/knowledge")
@RequiredArgsConstructor
public class KnowledgeController {

    private final KnowledgeService knowledgeService;

    @GetMapping("/tree")
    public Result<List<Map<String, Object>>> tree(@RequestParam(required = false) String subject) {
        List<Map<String, Object>> result = knowledgeService.getTree(subject);
        return Result.success(result);
    }

    @GetMapping("/list")
    public Result<List<KnowledgePoint>> list(@RequestParam(required = false) String subject) {
        List<KnowledgePoint> result = knowledgeService.getFlatList(subject);
        return Result.success(result);
    }

    @PostMapping
    public Result<KnowledgePoint> create(@RequestBody KnowledgePoint entity) {
        KnowledgePoint result = knowledgeService.create(entity);
        return Result.success(result);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody KnowledgePoint entity) {
        knowledgeService.update(id, entity);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        knowledgeService.delete(id);
        return Result.success();
    }
}
