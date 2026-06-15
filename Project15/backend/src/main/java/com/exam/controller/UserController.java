package com.exam.controller;

import com.exam.common.Result;
import com.exam.entity.User;
import com.exam.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/students")
    public Result<List<User>> students(@RequestParam(required = false) String keyword) {
        List<User> result = userService.getStudentList(keyword);
        return Result.success(result);
    }

    @GetMapping("/subjects")
    public Result<List<String>> getSubjects() {
        List<String> subjects = Arrays.asList("语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治");
        return Result.success(subjects);
    }

    @GetMapping("/{id}")
    public Result<User> detail(@PathVariable Long id) {
        User result = userService.getUserById(id);
        return Result.success(result);
    }
}
