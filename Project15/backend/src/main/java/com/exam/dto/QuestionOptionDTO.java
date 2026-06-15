package com.exam.dto;

import lombok.Data;

@Data
public class QuestionOptionDTO {

    private String optionLabel;

    private String optionContent;

    private Integer isCorrect;
}
