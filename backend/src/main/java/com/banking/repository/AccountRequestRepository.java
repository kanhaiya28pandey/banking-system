package com.banking.repository;

import com.banking.model.AccountRequest;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AccountRequestRepository extends MongoRepository<AccountRequest, String> {
    List<AccountRequest> findByStatus(String status);
    List<AccountRequest> findByUserId(String userId);
    List<AccountRequest> findByCreatedBy(String createdBy);
    List<AccountRequest> findByStatusOrderByCreatedAtDesc(String status);
}
