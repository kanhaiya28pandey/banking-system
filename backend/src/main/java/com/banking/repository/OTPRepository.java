package com.banking.repository;

import com.banking.model.OTP;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface OTPRepository extends MongoRepository<OTP, String> {
    Optional<OTP> findByUserIdAndOtpCodeAndIsUsedFalse(String userId, String otpCode);
    Optional<OTP> findByUserIdAndOtpTypeAndIsUsedFalseOrderByCreatedAtDesc(String userId, String otpType);
}
