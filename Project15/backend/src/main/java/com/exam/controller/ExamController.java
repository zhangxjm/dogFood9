package com.exam.controller;

import com.exam.common.PageResult;
import com.exam.common.Result;
import com.exam.common.UserContext;
import com.exam.dto.ExamCreateDTO;
import com.exam.dto.ExamSubmitDTO;
import com.exam.entity.Exam;
import com.exam.exception.BusinessException;
import com.exam.service.ExamService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/exams")
@RequiredArgsConstructor
public class ExamController {

    private final ExamService examService;

    @PostMapping
    public Result<Exam> create(@RequestBody ExamCreateDTO dto) {
        if (!UserContext.isTeacher()) {
            throw new BusinessException(403, "只有教师可以创建考试");
        }
        Long teacherId = UserContext.getUserId();
        Exam exam = examService.createExam(dto, teacherId);
        return Result.success(exam);
    }

    @GetMapping
    public Result<PageResult<Exam>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        Integer role = UserContext.getRole();
        Long userId = UserContext.getUserId();
        PageResult<Exam> result = examService.getExamList(role, userId, pageNum, pageSize);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<Map<String, Object>> detail(@PathVariable Long id) {
        Map<String, Object> result = examService.getExamDetail(id);
        return Result.success(result);
    }

    @PostMapping("/{id}/start")
    public Result<Map<String, Object>> start(@PathVariable Long id) {
        if (!UserContext.isStudent()) {
            throw new BusinessException(403, "只有学生可以参加考试");
        }
        Long studentId = UserContext.getUserId();
        Map<String, Object> result = examService.startExam(id, studentId);
        return Result.success(result);
    }

    @PostMapping("/submit")
    public Result<Map<String, Object>> submit(@RequestBody ExamSubmitDTO dto) {
        if (!UserContext.isStudent()) {
            throw new BusinessException(403, "只有学生可以提交试卷");
        }
        Long studentId = UserContext.getUserId();
        Map<String, Object> result = examService.submitExam(dto, studentId);
        return Result.success(result);
    }

    @GetMapping("/result/{examStudentId}")
    public Result<Map<String, Object>> result(@PathVariable Long examStudentId) {
        Map<String, Object> result = examService.getExamResult(examStudentId);
        return Result.success(result);
    }

    @GetMapping("/{id}/students")
    public Result<List<Map<String, Object>>> students(@PathVariable Long id) {
        if (!UserContext.isTeacher()) {
            throw new BusinessException(403, "只有教师可以查询学生成绩列表");
        }
        List<Map<String, Object>> result = examService.getExamStudentList(id);
        return Result.success(result);
    }
}
