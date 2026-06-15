package com.exam.controller;

import com.exam.common.Result;
import com.exam.common.UserContext;
import com.exam.entity.Question;
import com.exam.service.RecommendService;
import com.exam.service.StudyProgressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/study")
@RequiredArgsConstructor
public class StudyController {

    private final StudyProgressService studyProgressService;
    private final RecommendService recommendService;

    @GetMapping("/dashboard")
    public Result<Map<String, Object>> dashboard() {
        Long userId = UserContext.getUserId();
        Map<String, Object> result = studyProgressService.getStudyDashboard(userId);
        return Result.success(result);
    }

    @GetMapping("/knowledge-analysis")
    public Result<List<Map<String, Object>>> knowledgeAnalysis() {
        Long userId = UserContext.getUserId();
        List<Map<String, Object>> result = studyProgressService.getKnowledgeAnalysis(userId);
        return Result.success(result);
    }

    @GetMapping("/recommend")
    public Result<List<Question>> recommend(@RequestParam(defaultValue = "20") Integer limit) {
        Long userId = UserContext.getUserId();
        List<Question> result = recommendService.getRecommendList(userId, limit);
        return Result.success(result);
    }
}
