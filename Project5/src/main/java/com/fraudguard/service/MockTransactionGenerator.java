package com.fraudguard.service;

public interface MockTransactionGenerator {

    void startGenerating(int transactionsPerMinute);

    void stopGenerating();

    boolean isGenerating();

    void generateOneTransaction();

    void generateBatchTransactions(int count);
}
