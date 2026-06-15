package com.exam.controller;

import com.exam.common.PageResult;
import com.exam.common.Result;
import com.exam.common.UserContext;
import com.exam.dto.QuestionCreateDTO;
import com.exam.dto.QuestionQueryDTO;
import com.exam.entity.Question;
import com.exam.exception.BusinessException;
import com.exam.service.QuestionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @PostMapping
    public Result<Question> create(@RequestBody QuestionCreateDTO dto) {
        if (!UserContext.isTeacher()) {
            throw new BusinessException("只有教师可以创建题目");
        }
        Long userId = UserContext.getUserId();
        Question question = questionService.createQuestion(dto, userId);
        return Result.success(question);
    }

    @PutMapping("/{id}")
    public Result<Void> update(@PathVariable Long id, @RequestBody QuestionCreateDTO dto) {
        if (!UserContext.isTeacher()) {
            throw new BusinessException("只有教师可以更新题目");
        }
        questionService.updateQuestion(id, dto);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        if (!UserContext.isTeacher()) {
            throw new BusinessException("只有教师可以删除题目");
        }
        questionService.deleteQuestion(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        Map<String, Object> result = questionService.getQuestionDetail(id);
        return Result.success(result);
    }

    @PostMapping("/list")
    public Result<PageResult<Question>> list(@RequestBody QuestionQueryDTO dto) {
        PageResult<Question> result = questionService.getQuestionList(dto);
        return Result.success(result);
    }

    @GetMapping("/types")
    public Result<List<Map<String, Object>>> getTypes() {
        List<Map<String, Object>> types = new ArrayList<>();
        types.add(createDict(1, "单选题"));
        types.add(createDict(2, "多选题"));
        types.add(createDict(3, "判断题"));
        types.add(createDict(4, "填空题"));
        types.add(createDict(5, "主观题"));
        return Result.success(types);
    }

    @GetMapping("/difficulties")
    public Result<List<Map<String, Object>>> getDifficulties() {
        List<Map<String, Object>> difficulties = new ArrayList<>();
        difficulties.add(createDict(1, "简单"));
        difficulties.add(createDict(2, "较易"));
        difficulties.add(createDict(3, "中等"));
        difficulties.add(createDict(4, "较难"));
        difficulties.add(createDict(5, "困难"));
        return Result.success(difficulties);
    }

    private Map<String, Object> createDict(Integer value, String label) {
        Map<String, Object> dict = new HashMap<>();
        dict.put("value", value);
        dict.put("label", label);
        return dict;
    }
}
