package com.banking.repository;

import com.banking.model.NotificationLog;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationLogRepository extends MongoRepository<NotificationLog, String> {
    List<NotificationLog> findByUserIdOrderBySentAtDesc(String userId);
    List<NotificationLog> findByStatusAndRetryCountLessThan(String status, int retryCount);
}
