package com.banking.repository;

import com.banking.model.SuspiciousActivity;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SuspiciousActivityRepository extends MongoRepository<SuspiciousActivity, String> {
    List<SuspiciousActivity> findByUserIdOrderByCreatedAtDesc(String userId);
    List<SuspiciousActivity> findBySeverityOrderByCreatedAtDesc(String severity);
    List<SuspiciousActivity> findByResolvedFalseOrderByCreatedAtDesc();
}
