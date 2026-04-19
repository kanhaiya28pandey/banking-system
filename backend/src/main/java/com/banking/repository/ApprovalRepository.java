package com.banking.repository;

import com.banking.model.Approval;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface ApprovalRepository extends MongoRepository<Approval, String> {
    List<Approval> findByStatusAndAssignedTo(String status, Integer managerId);
    List<Approval> findByTransactionId(String transactionId);

    @Query("{ 'status': 'PENDING', 'expiresAt': { $lt: ?0 } }")
    List<Approval> findExpiredApprovals(LocalDateTime now);
}

