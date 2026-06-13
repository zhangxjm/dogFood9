package com.fraudguard.service;

import com.fraudguard.entity.TraceabilityRecord;
import com.fraudguard.entity.Transaction;

public interface TraceabilityService {

    TraceabilityRecord createTraceRecord(Transaction transaction);

    TraceabilityRecord updateTraceRecord(Transaction transaction, String action, String detail);

    TraceabilityRecord appendDecisionStep(String transactionId, String step, String result, String reason);

    TraceabilityRecord appendRuleTrigger(String transactionId, String ruleCode, String ruleName,
                                          String result, String detail);

    TraceabilityRecord appendModelInference(String transactionId, String modelName,
                                            String inferenceResult, String score);

    TraceabilityRecord addRelatedTransaction(String transactionId, String relatedTxnId, String relation);

    TraceabilityRecord addRelatedAlert(String transactionId, String alertId, String relation);

    TraceabilityRecord recordManualIntervention(String transactionId, String operator,
                                                 String action, String reason);

    TraceabilityRecord finalizeTrace(String transactionId, String finalDecision,
                                      String decisionMaker, String reason);

    TraceabilityRecord getTraceRecord(String transactionId);

    String getFullTraceReport(String transactionId);
}
