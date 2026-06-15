package com.exam.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("study_progress")
public class StudyProgress {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long userId;

    private Long knowledgeId;

    private Integer totalQuestions;

    private Integer correctCount;

    private Double accuracy;

    private LocalDateTime lastPracticeTime;
}
