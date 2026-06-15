package com.exam.dto;

import lombok.Data;

@Data
public class PaperCreateDTO {

    private String title;

    private String description;

    private String subject;

    private Integer duration;

    private PaperStrategyDTO strategy;
}
