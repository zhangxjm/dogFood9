package com.exam.dto;

import lombok.Data;

import java.util.List;

@Data
public class ExamSubmitDTO {

    private Long examStudentId;

    private List<SubmitAnswerDTO> answers;
}
