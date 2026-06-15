package com.exam.dto;

import lombok.Data;

import java.util.List;

@Data
public class QuestionCreateDTO {

    private Integer type;

    private String content;

    private String image;

    private String analysis;

    private Integer difficulty;

    private Double score;

    private String subject;

    private List<QuestionOptionDTO> options;

    private List<Long> knowledgeIds;
}
