package com.banking.repository;

import com.banking.model.Session;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface SessionRepository extends MongoRepository<Session, String> {
    List<Session> findByUserIdOrderByLoginAtDesc(String userId);
    List<Session> findByUserIdAndIsActiveTrueOrderByLoginAtDesc(String userId);
}
