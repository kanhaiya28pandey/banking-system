package com.banking.service;

import com.banking.model.AccountRequest;
import com.banking.model.User;
import com.banking.model.UserRole;
import com.banking.repository.AccountRequestRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AccountRequestService {

    @Autowired
    private AccountRequestRepository accountRequestRepository;

    @Autowired
    private UserRepository userRepository;

    // Get account requests based on user role
    public List<AccountRequest> getAccountRequests(String userId, String userRole) {
        if (UserRole.EMPLOYEE.name().equals(userRole)) {
            // Employees see pending requests
            return accountRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        } else if (UserRole.MANAGER.name().equals(userRole)) {
            // Managers see all pending requests
            return accountRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        } else if (UserRole.ADMIN.name().equals(userRole)) {
            // Admins see all requests
            return accountRequestRepository.findAll();
        } else {
            // Users see only their own requests
            return accountRequestRepository.findByUserId(userId);
        }
    }

    // User applies for account
    @Transactional
    public AccountRequest applyForAccount(String userId, String accountType, Double initialDeposit) {
        AccountRequest request = AccountRequest.builder()
                .userId(userId)
                .accountType(accountType)
                .initialDeposit(initialDeposit)
                .status("PENDING")
                .build();

        return accountRequestRepository.save(request);
    }

    // Employee or Manager approves account
    @Transactional
    public AccountRequest approveAccount(String requestId, String approverUserId, String approverRole) {
        AccountRequest request = accountRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Account request not found"));

        if (!UserRole.EMPLOYEE.name().equals(approverRole) && !UserRole.MANAGER.name().equals(approverRole)) {
            throw new RuntimeException("Only Employee or Manager can approve accounts");
        }

        request.setStatus("APPROVED");
        request.setApprovedBy(approverUserId);
        request.setApprovedAt(LocalDateTime.now());

        // Create actual account for the user
        Optional<User> user = userRepository.findById(request.getUserId());
        if (user.isPresent()) {
            User userData = user.get();
            // Mark registration as complete
            userData.setRegistrationPhase("COMPLETED");
            userData.setRegistrationCompletedAt(LocalDateTime.now());
            userData.setStatus("ACTIVE");
            userRepository.save(userData);
        }

        return accountRequestRepository.save(request);
    }

    // Only Manager can reject accounts
    @Transactional
    public AccountRequest rejectAccount(String requestId, String rejectorUserId, String rejectorRole, String reason) {
        AccountRequest request = accountRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Account request not found"));

        if (!UserRole.MANAGER.name().equals(rejectorRole)) {
            throw new RuntimeException("Only Manager can reject account requests");
        }

        request.setStatus("REJECTED");
        request.setRejectedBy(rejectorUserId);
        request.setRejectionReason(reason);
        request.setRejectedAt(LocalDateTime.now());

        return accountRequestRepository.save(request);
    }
}
