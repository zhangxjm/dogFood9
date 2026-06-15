package com.exam.controller;

import com.exam.common.PageResult;
import com.exam.common.Result;
import com.exam.common.UserContext;
import com.exam.dto.PaperCreateDTO;
import com.exam.entity.Paper;
import com.exam.exception.BusinessException;
import com.exam.service.PaperService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/papers")
@RequiredArgsConstructor
public class PaperController {

    private final PaperService paperService;

    @PostMapping
    public Result<Paper> create(@RequestBody PaperCreateDTO dto) {
        if (!UserContext.isTeacher()) {
            throw new BusinessException(403, "只有教师可以创建试卷");
        }
        Long createBy = UserContext.getUserId();
        Paper paper = paperService.createPaper(dto, createBy);
        return Result.success(paper);
    }

    @GetMapping
    public Result<PageResult<Paper>> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String subject,
            @RequestParam(required = false) Integer status,
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        if (!UserContext.isTeacher()) {
            throw new BusinessException(403, "只有教师可以查询试卷列表");
        }
        Long createBy = UserContext.getUserId();
        PageResult<Paper> result = paperService.getPaperList(keyword, subject, status, createBy, pageNum, pageSize);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        Map<String, Object> result = paperService.getPaperDetail(id);
        return Result.success(result);
    }

    @PutMapping("/{id}/publish")
    public Result<Void> publish(@PathVariable Long id) {
        if (!UserContext.isTeacher()) {
            throw new BusinessException(403, "只有教师可以发布试卷");
        }
        paperService.publishPaper(id);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        if (!UserContext.isTeacher()) {
            throw new BusinessException(403, "只有教师可以删除试卷");
        }
        paperService.deletePaper(id);
        return Result.success();
    }

    @GetMapping("/{id}/questions")
    public Result<List<Map<String, Object>>> getQuestions(@PathVariable Long id) {
        List<Map<String, Object>> questions = paperService.getPaperQuestions(id);
        return Result.success(questions);
    }
}
