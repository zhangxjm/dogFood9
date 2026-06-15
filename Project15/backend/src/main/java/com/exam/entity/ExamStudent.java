package com.exam.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("exam_student")
public class ExamStudent {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long examId;

    private Long userId;

    private Integer status;

    private LocalDateTime startTime;

    private LocalDateTime submitTime;

    private Double totalScore;

    private Double autoScore;

    private Double manualScore;
}
