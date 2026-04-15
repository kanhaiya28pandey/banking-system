package com.banking.repository;

import com.banking.model.ScheduledTransactionExecution;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ScheduledTransactionExecutionRepository extends MongoRepository<ScheduledTransactionExecution, String> {
    List<ScheduledTransactionExecution> findByScheduledTransactionId(String scheduledTransactionId);
    List<ScheduledTransactionExecution> findByUserIdOrderByCreatedAtDesc(String userId);
    List<ScheduledTransactionExecution> findByScheduledTransactionIdOrderByCreatedAtDesc(String scheduledTransactionId);
}
