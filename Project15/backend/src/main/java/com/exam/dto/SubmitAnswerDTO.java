package com.exam.dto;

import lombok.Data;

@Data
public class SubmitAnswerDTO {

    private Long examStudentId;

    private Long questionId;

    private String userAnswer;
}
