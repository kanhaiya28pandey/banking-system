package com.banking.controller;

import com.banking.dto.*;
import com.banking.model.User;
import com.banking.service.RegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/register")
@CrossOrigin(origins = "*")
public class RegistrationController {

    @Autowired
    private RegistrationService registrationService;

    /**
     * Phase 1: Personal Details
     */
    @PostMapping("/phase1")
    public ResponseEntity<ApiResponse<User>> phase1(
            @RequestParam String email,
            @RequestBody RegistrationPhase1Request phase1) {
        try {
            User user = registrationService.submitPhase1(email, phase1);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "✅ Phase 1 completed! Please proceed to Phase 2.",
                user));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "❌ " + e.getMessage(), null));
        }
    }

    /**
     * Phase 2: KYC Information
     */
    @PostMapping("/phase2")
    public ResponseEntity<ApiResponse<User>> phase2(
            @RequestParam String email,
            @RequestBody RegistrationPhase2Request phase2) {
        try {
            User user = registrationService.submitPhase2(email, phase2);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "✅ Phase 2 completed! Please proceed to Phase 3.",
                user));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "❌ " + e.getMessage(), null));
        }
    }

    /**
     * Phase 3: Account Details
     */
    @PostMapping("/phase3")
    public ResponseEntity<ApiResponse<User>> phase3(
            @RequestParam String email,
            @RequestBody RegistrationPhase3Request phase3) {
        try {
            User user = registrationService.submitPhase3(email, phase3);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "✅ Phase 3 completed! Please proceed to Phase 4.",
                user));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "❌ " + e.getMessage(), null));
        }
    }

    /**
     * Phase 4: Security Setup
     */
    @PostMapping("/phase4")
    public ResponseEntity<ApiResponse<User>> phase4(
            @RequestParam String email,
            @RequestBody RegistrationPhase4Request phase4) {
        try {
            User user = registrationService.submitPhase4(email, phase4);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "✅ Phase 4 completed! OTP will be sent to your email.",
                user));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "❌ " + e.getMessage(), null));
        }
    }

    /**
     * Send OTP before Phase 5
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOTP(@RequestParam String email) {
        try {
            registrationService.sendOTPForRegistration(email);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "✅ OTP sent to your email. Please check and verify.",
                "OTP sent"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "❌ " + e.getMessage(), null));
        }
    }

    /**
     * Phase 5: OTP Verification & Account Creation
     */
    @PostMapping("/phase5")
    public ResponseEntity<ApiResponse<User>> phase5(
            @RequestParam String email,
            @RequestBody RegistrationPhase5Request phase5) {
        try {
            User user = registrationService.submitPhase5(email, phase5);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "🎉 Account created successfully! Your account is now active.",
                user));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "❌ " + e.getMessage(), null));
        }
    }

    /**
     * Get Current Registration Status
     */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<User>> getStatus(@RequestParam String email) {
        try {
            User user = registrationService.getRegistrationStatus(email);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Registration status: " + user.getRegistrationPhase(),
                user));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "❌ " + e.getMessage(), null));
        }
    }

    /**
     * Cancel incomplete registration
     * Marks registration as ABANDONED but keeps user record
     * This prevents accounts from being created and keeps audit trail
     */
    @DeleteMapping("/cancel")
    public ResponseEntity<ApiResponse<User>> cancelRegistration(@RequestParam String email) {
        try {
            User cancelledUser = registrationService.cancelRegistration(email);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "✅ Registration cancelled successfully. You can start over anytime.",
                cancelledUser));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, "❌ " + e.getMessage(), null));
        }
    }

    /**
     * Mark registration as abandoned when user navigates away
     * Called when user clicks back arrow or closes browser during registration
     */
    @PutMapping("/mark-abandoned")
    public ResponseEntity<ApiResponse<String>> markAbandoned(@RequestParam String email) {
        try {
            registrationService.cancelRegistration(email);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Registration marked as abandoned",
                "Abandoned"));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
