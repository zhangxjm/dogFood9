package com.fraudguard.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class RuleResult {

    private String ruleCode;
    private String ruleName;
    private BigDecimal score;
    private boolean triggered;
    private String reason;
    private String severity;

    public RuleResult() {
        this.score = BigDecimal.ZERO;
        this.triggered = false;
    }

    public RuleResult(String ruleCode, String ruleName, BigDecimal score, boolean triggered, String reason, String severity) {
        this.ruleCode = ruleCode;
        this.ruleName = ruleName;
        this.score = score;
        this.triggered = triggered;
        this.reason = reason;
        this.severity = severity;
    }

    public static List<RuleResult> createEmptyList() {
        return new ArrayList<>();
    }
}
