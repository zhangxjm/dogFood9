package com.exam.dto;

import lombok.Data;

import java.util.List;

@Data
public class PaperStrategyDTO {

    private Integer singleCount;

    private Integer multipleCount;

    private Integer judgeCount;

    private Integer fillCount;

    private Integer subjectiveCount;

    private Double singleScore;

    private Double multipleScore;

    private Double judgeScore;

    private Double fillScore;

    private Double subjectiveScore;

    private Double difficulty;

    private List<Long> knowledgeIds;
}
