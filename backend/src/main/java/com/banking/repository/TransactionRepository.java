package com.banking.repository;

import com.banking.model.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import java.time.LocalDateTime;
import java.util.List;

public interface TransactionRepository extends MongoRepository<Transaction, String> {
    List<Transaction> findByFromAccountOrToAccountOrderByDateDesc(
        String fromAccount, String toAccount);

    // Filter by date range
    List<Transaction> findByFromAccountAndDateBetween(String account, LocalDateTime startDate, LocalDateTime endDate);
    List<Transaction> findByToAccountAndDateBetween(String account, LocalDateTime startDate, LocalDateTime endDate);

    // Filter by amount
    List<Transaction> findByAmountGreaterThanEqual(Double amount);
    List<Transaction> findByAmountLessThanEqual(Double amount);
    List<Transaction> findByAmountBetween(Double minAmount, Double maxAmount);

    // Filter by type
    List<Transaction> findByType(String type);
    List<Transaction> findByStatus(String status);

    // Complex queries with pagination
    @Query("{ $or: [ { 'fromAccount': ?0 }, { 'toAccount': ?0 } ], " +
           "?#{ [1] != null ? \"'date': { $gte: ?1 }\" : \"\" }, " +
           "?#{ [2] != null ? \"'date': { $lte: ?2 }\" : \"\" }, " +
           "?#{ [3] != null ? \"'amount': { $gte: ?3 }\" : \"\" }, " +
           "?#{ [4] != null ? \"'amount': { $lte: ?4 }\" : \"\" }, " +
           "?#{ [5] != null ? \"'type': ?5\" : \"\" }, " +
           "?#{ [6] != null ? \"'status': ?6\" : \"\" } }")
    Page<Transaction> searchTransactions(
        String accountNumber,
        LocalDateTime fromDate,
        LocalDateTime toDate,
        Double minAmount,
        Double maxAmount,
        String type,
        String status,
        Pageable pageable
    );

    // Get transactions for account within date range
    Page<Transaction> findByFromAccountOrToAccountAndDateBetweenOrderByDateDesc(
        String fromAcc, String toAcc, LocalDateTime startDate, LocalDateTime endDate, Pageable pageable
    );
}
