package com.banking.repository;

import com.banking.model.Transaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface TransactionRepository extends MongoRepository<Transaction, String> {
    List<Transaction> findByFromAccountOrToAccountOrderByDateDesc(
        String fromAccount, String toAccount);
}