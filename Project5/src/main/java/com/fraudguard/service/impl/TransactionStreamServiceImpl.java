package com.fraudguard.service.impl;

import com.fraudguard.entity.Transaction;
import com.fraudguard.service.RiskAssessmentService;
import com.fraudguard.service.TransactionStreamService;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicLong;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransactionStreamServiceImpl implements TransactionStreamService {

    private final RiskAssessmentService riskAssessmentService;

    @Value("${fraudguard.stream.thread-pool-size:8}")
    private int threadPoolSize;

    @Value("${fraudguard.stream.queue-capacity:10000}")
    private int queueCapacity;

    @Value("${fraudguard.stream.enabled:true}")
    private boolean streamEnabled;

    private BlockingQueue<Transaction> transactionQueue;
    private ExecutorService executorService;
    private final AtomicLong processedCount = new AtomicLong(0);
    private final AtomicLong startTime = new AtomicLong(0);
    private volatile boolean running = false;

    @Getter
    private ScheduledExecutorService scheduler;

    @PostConstruct
    public void init() {
        transactionQueue = new LinkedBlockingQueue<>(queueCapacity);
        executorService = Executors.newFixedThreadPool(threadPoolSize,
            r -> {
                Thread t = new Thread(r, "transaction-processor");
                t.setDaemon(true);
                return t;
            });
        scheduler = Executors.newScheduledThreadPool(1,
            r -> {
                Thread t = new Thread(r, "stream-scheduler");
                t.setDaemon(true);
                return t;
            });

        if (streamEnabled) {
            startStreamProcessing();
        }

        log.info("Transaction stream service initialized: poolSize={}, queueCapacity={}",
            threadPoolSize, queueCapacity);
    }

    @PreDestroy
    public void destroy() {
        stopStreamProcessing();
        executorService.shutdown();
        scheduler.shutdown();
        try {
            if (!executorService.awaitTermination(5, TimeUnit.SECONDS)) {
                executorService.shutdownNow();
            }
        } catch (InterruptedException e) {
            executorService.shutdownNow();
        }
        log.info("Transaction stream service shutdown");
    }

    @Override
    public void submitTransaction(Transaction transaction) {
        if (running) {
            boolean offered = transactionQueue.offer(transaction);
            if (!offered) {
                log.warn("Transaction queue is full, processing synchronously: {}",
                    transaction.getTransactionId());
                processTransaction(transaction);
            }
        } else {
            processTransaction(transaction);
        }
    }

    @Override
    public long getQueueSize() {
        return transactionQueue.size();
    }

    @Override
    public long getProcessedCount() {
        return processedCount.get();
    }

    @Override
    public double getThroughput() {
        long start = startTime.get();
        if (start == 0) {
            return 0.0;
        }
        long elapsed = System.currentTimeMillis() - start;
        if (elapsed == 0) {
            return 0.0;
        }
        return (processedCount.get() * 1000.0) / elapsed;
    }

    @Override
    public void startStreamProcessing() {
        if (running) {
            log.info("Stream processing already running");
            return;
        }
        running = true;
        startTime.set(System.currentTimeMillis());

        for (int i = 0; i < threadPoolSize; i++) {
            executorService.submit(this::processLoop);
        }

        log.info("Stream processing started with {} threads", threadPoolSize);
    }

    @Override
    public void stopStreamProcessing() {
        running = false;
        log.info("Stream processing stopped");
    }

    @Override
    public boolean isStreamRunning() {
        return running;
    }

    private void processLoop() {
        while (running || !transactionQueue.isEmpty()) {
            try {
                Transaction transaction = transactionQueue.poll(1, TimeUnit.SECONDS);
                if (transaction != null) {
                    processTransaction(transaction);
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            } catch (Exception e) {
                log.error("Error processing transaction in stream", e);
            }
        }
    }

    private void processTransaction(Transaction transaction) {
        try {
            riskAssessmentService.assessRisk(transaction);
            processedCount.incrementAndGet();

            if (processedCount.get() % 1000 == 0) {
                log.info("Processed {} transactions, throughput: {:.2f} TPS",
                    processedCount.get(), getThroughput());
            }
        } catch (Exception e) {
            log.error("Failed to process transaction: {}", transaction.getTransactionId(), e);
        }
    }
}
