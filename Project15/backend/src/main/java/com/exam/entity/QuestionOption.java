package com.exam.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

@Data
@TableName("question_option")
public class QuestionOption {

    @TableId(type = IdType.AUTO)
    private Long id;

    private Long questionId;

    private String optionLabel;

    private String optionContent;

    private Integer isCorrect;
}
