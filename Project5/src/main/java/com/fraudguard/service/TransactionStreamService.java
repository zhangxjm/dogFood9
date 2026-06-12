package com.fraudguard.service;

import com.fraudguard.entity.Transaction;

public interface TransactionStreamService {

    void submitTransaction(Transaction transaction);

    long getQueueSize();

    long getProcessedCount();

    double getThroughput();

    void startStreamProcessing();

    void stopStreamProcessing();

    boolean isStreamRunning();
}
