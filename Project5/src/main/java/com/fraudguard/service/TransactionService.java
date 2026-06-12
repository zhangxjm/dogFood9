package com.fraudguard.service;

import com.fraudguard.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public interface TransactionService {

    Transaction createTransaction(Transaction transaction);

    Transaction getTransactionById(String transactionId);

    Page<Transaction> getTransactions(Pageable pageable);

    Page<Transaction> getTransactionsByUserId(String userId, Pageable pageable);

    Page<Transaction> getTransactionsByStatus(String status, Pageable pageable);

    Page<Transaction> getTransactionsByRiskLevel(String riskLevel, Pageable pageable);

    List<Transaction> getRecentTransactions(int limit);

    Map<String, Object> getTransactionStatistics();

    boolean interceptTransaction(String transactionId, String reason);

    boolean approveTransaction(String transactionId);

    boolean rejectTransaction(String transactionId, String reason);
}
