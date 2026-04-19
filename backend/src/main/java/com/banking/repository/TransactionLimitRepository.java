package com.banking.repository;

import com.banking.model.TransactionLimit;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TransactionLimitRepository extends MongoRepository<TransactionLimit, String> {
    Optional<TransactionLimit> findByAccountType(String accountType);
}
