package com.banking.repository;

import com.banking.model.ScheduledTransaction;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface ScheduledTransactionRepository extends MongoRepository<ScheduledTransaction, String> {
    List<ScheduledTransaction> findByUserId(String userId);
    List<ScheduledTransaction> findByUserIdAndStatus(String userId, String status);
    List<ScheduledTransaction> findByStatusAndNextExecutionDateBefore(String status, LocalDateTime date);
}
