package com.banking.service;

import com.banking.model.OTP;
import com.banking.model.User;
import com.banking.repository.OTPRepository;
import com.banking.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Random;

@Service
@Slf4j
public class OTPService {
    @Autowired
    private OTPRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private AuditLogService auditLogService;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_VALIDITY_MINUTES = 5;
    private static final int MAX_ATTEMPTS = 3;

    /**
     * Generate and send OTP to user
     */
    public boolean generateAndSendOTP(String userId, String otpType) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Generate OTP
            String otpCode = generateOTP();
            LocalDateTime expiryTime = LocalDateTime.now().plusMinutes(OTP_VALIDITY_MINUTES);

            // Create OTP record
            OTP otp = OTP.builder()
                    .userId(userId)
                    .otpCode(otpCode)
                    .otpType(otpType)
                    .isUsed(false)
                    .expiresAt(expiryTime)
                    .attemptCount(0)
                    .build();

            otpRepository.save(otp);

            // Send via email
            emailService.sendOTP(user.getEmail(), otpCode, OTP_VALIDITY_MINUTES);

            auditLogService.log(userId, "OTP_SENT", "OTP", userId,
                    null, null, "SUCCESS");

            log.info("OTP sent to user: {}", userId);
            return true;

        } catch (Exception e) {
            log.error("Error generating OTP for user: {}", userId, e);
            return false;
        }
    }

    /**
     * Verify OTP code
     */
    public boolean verifyOTP(String userId, String otpCode, String otpType) {
        try {
            OTP otp = otpRepository.findByUserIdAndOtpCodeAndIsUsedFalse(userId, otpCode)
                    .orElseThrow(() -> new RuntimeException("Invalid OTP"));

            // Check if OTP is expired
            if (otp.isExpired()) {
                auditLogService.log(userId, "OTP_VERIFICATION_FAILED", "OTP", userId,
                        null, null, "FAILED");
                throw new RuntimeException("OTP has expired");
            }

            // Check if OTP matches type
            if (!otp.getOtpType().equals(otpType)) {
                throw new RuntimeException("OTP type mismatch");
            }

            // Mark OTP as used
            otp.setIsUsed(true);
            otp.setVerifiedAt(LocalDateTime.now());
            otpRepository.save(otp);

            auditLogService.log(userId, "OTP_VERIFIED", "OTP", userId,
                    null, null, "SUCCESS");

            log.info("OTP verified for user: {}", userId);
            return true;

        } catch (Exception e) {
            // Increment attempt count
            OTP otp = otpRepository.findByUserIdAndOtpTypeAndIsUsedFalseOrderByCreatedAtDesc(userId, otpType)
                    .orElse(null);

            if (otp != null) {
                otp.setAttemptCount(otp.getAttemptCount() + 1);
                otpRepository.save(otp);

                // Lock account after MAX_ATTEMPTS
                if (otp.getAttemptCount() >= MAX_ATTEMPTS) {
                    User user = userRepository.findById(userId).orElse(null);
                    if (user != null) {
                        user.setAccountLockedUntil(LocalDateTime.now().plusHours(1));
                        userRepository.save(user);
                        auditLogService.log(userId, "ACCOUNT_LOCKED", "USER", userId,
                                null, null, "SUCCESS");
                        log.warn("Account locked for user: {} due to multiple OTP failures", userId);
                    }
                }
            }

            auditLogService.log(userId, "OTP_VERIFICATION_FAILED", "OTP", userId,
                    null, null, "FAILED");
            log.error("OTP verification failed for user: {}", userId);
            return false;
        }
    }

    /**
     * Generate random 6-digit OTP
     */
    private String generateOTP() {
        Random random = new Random();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    /**
     * Check if user is locked due to OTP failures
     */
    public boolean isUserLockedDueToOTPFailure(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null && user.getAccountLockedUntil() != null) {
            return LocalDateTime.now().isBefore(user.getAccountLockedUntil());
        }
        return false;
    }
}
