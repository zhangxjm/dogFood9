package com.exam.dto;

import lombok.Data;

@Data
public class QuestionQueryDTO {

    private Integer type;

    private String subject;

    private Integer difficulty;

    private Long knowledgeId;

    private String keyword;

    private Integer pageNum;

    private Integer pageSize;
}
