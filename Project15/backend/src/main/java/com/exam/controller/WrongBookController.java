package com.exam.controller;

import com.exam.common.PageResult;
import com.exam.common.Result;
import com.exam.common.UserContext;
import com.exam.service.WrongBookService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/wrong-book")
@RequiredArgsConstructor
public class WrongBookController {

    private final WrongBookService wrongBookService;

    @GetMapping
    public Result<PageResult<Map<String, Object>>> list(@RequestParam(required = false) String subject,
                                                        @RequestParam(required = false) Integer masterStatus,
                                                        @RequestParam(required = false) Integer pageNum,
                                                        @RequestParam(required = false) Integer pageSize) {
        Long userId = UserContext.getUserId();
        PageResult<Map<String, Object>> result = wrongBookService.getWrongBookList(userId, subject, masterStatus, pageNum, pageSize);
        return Result.success(result);
    }

    @PutMapping("/{id}/master")
    public Result<Void> markMastered(@PathVariable Long id) {
        Long userId = UserContext.getUserId();
        wrongBookService.markAsMastered(id, userId);
        return Result.success();
    }

    @GetMapping("/count")
    public Result<Map<String, Object>> count() {
        Long userId = UserContext.getUserId();
        Map<String, Object> result = wrongBookService.getCount(userId);
        return Result.success(result);
    }
}
