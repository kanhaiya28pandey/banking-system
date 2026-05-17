package com.banking.service;

import com.banking.model.AccountRequest;
import com.banking.model.User;
import com.banking.model.Account;
import com.banking.model.UserRole;
import com.banking.repository.AccountRequestRepository;
import com.banking.repository.UserRepository;
import com.banking.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class AccountRequestService {

    @Autowired
    private AccountRequestRepository accountRequestRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    private static final Double MINIMUM_DEPOSIT = 1000.0;

    // Get account requests based on user role
    public List<AccountRequest> getAccountRequests(String userId, String userRole) {
        List<AccountRequest> requests;

        if (UserRole.EMPLOYEE.name().equals(userRole)) {
            requests = accountRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        } else if (UserRole.MANAGER.name().equals(userRole)) {
            requests = accountRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        } else if (UserRole.ADMIN.name().equals(userRole)) {
            requests = accountRequestRepository.findAll();
        } else {
            requests = accountRequestRepository.findByUserId(userId);
        }

        // Enrich requests with user data if missing
        enrichRequestsWithUserData(requests);
        return requests;
    }

    private void enrichRequestsWithUserData(List<AccountRequest> requests) {
        for (AccountRequest req : requests) {
            // If userName or userPhone is missing, fetch from User
            if ((req.getUserName() == null || req.getUserName().isEmpty() || "N/A".equals(req.getUserName())) &&
                (req.getUserPhone() == null || req.getUserPhone().isEmpty() || "N/A".equals(req.getUserPhone()))) {
                try {
                    User user = userRepository.findById(req.getUserId()).orElse(null);
                    if (user != null) {
                        req.setUserName(user.getFirstName() + " " + user.getLastName());
                        req.setUserPhone(user.getPhone());
                    }
                } catch (Exception e) {
                    System.err.println("[ENRICH] Failed to fetch user data for request: " + req.getId());
                }
            }
        }
    }

    // User applies for account
    @Transactional
    public AccountRequest applyForAccount(String userId, String accountType, Double initialDeposit) {
        // Verify user exists
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Check for any existing account of this type (active or inactive)
        List<Account> userAccounts = accountRepository.findByUserId(userId);
        for (Account account : userAccounts) {
            if (account.getAccountType().equalsIgnoreCase(accountType)) {
                throw new RuntimeException(
                    "You already have a " + accountType + " account. " +
                    "Cannot create multiple accounts of the same type.");
            }
        }

        // Check for pending requests of this type
        List<AccountRequest> pendingRequests = accountRequestRepository.findByStatusOrderByCreatedAtDesc("PENDING");
        for (AccountRequest req : pendingRequests) {
            if (req.getUserId().equals(userId) && req.getAccountType().equalsIgnoreCase(accountType)) {
                throw new RuntimeException(
                    "You already have a pending request for a " + accountType + " account. " +
                    "Please wait for approval or rejection.");
            }
        }

        // Validate minimum deposit
        if (initialDeposit == null || initialDeposit < MINIMUM_DEPOSIT) {
            throw new RuntimeException("Minimum deposit required: ₹" + MINIMUM_DEPOSIT);
        }

        AccountRequest request = AccountRequest.builder()
                .userId(userId)
                .userName(user.getFirstName() + " " + user.getLastName())
                .userPhone(user.getPhone())
                .accountType(accountType)
                .initialDeposit(initialDeposit)
                .status("PENDING")
                .build();

        System.out.println("[ACCOUNT_REQUEST] User " + userId + " applied for " + accountType + " account with ₹" + initialDeposit);
        return accountRequestRepository.save(request);
    }

    // Employee or Manager approves account and creates it
    @Transactional
    public AccountRequest approveAccount(String requestId, String approverUserId, String approverRole) {
        AccountRequest request = accountRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Account request not found"));

        if (!UserRole.EMPLOYEE.name().equals(approverRole) && !UserRole.MANAGER.name().equals(approverRole)) {
            throw new RuntimeException("Only Employee or Manager can approve accounts");
        }

        // Check if user already has this account type
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Account> existingAccounts = accountRepository.findByUserId(request.getUserId());
        for (Account acc : existingAccounts) {
            if (acc.getAccountType().equalsIgnoreCase(request.getAccountType())) {
                throw new RuntimeException(
                    "User already has a " + request.getAccountType() + " account. " +
                    "Cannot create duplicate account type.");
            }
        }

        // Update request status
        request.setStatus("APPROVED");
        request.setApprovedBy(approverUserId);
        request.setApprovedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        // Create actual bank account
        Account account = new Account();
        account.setUserId(request.getUserId());
        account.setAccountNumber(generateAccountNumber());
        account.setBalance(request.getInitialDeposit());
        account.setAccountType(request.getAccountType());
        account.setStatus("ACTIVE");
        account.setMinimumDepositRequired(MINIMUM_DEPOSIT);
        account.setMinimumDepositPaid(true);
        account.setCreatedAt(LocalDateTime.now());
        account.setActivatedAt(LocalDateTime.now());

        // Set transaction PIN from user's registration Phase 4
        if (user.getTransactionPin() != null && !user.getTransactionPin().isEmpty()) {
            account.setTransactionPin(user.getTransactionPin());
        }

        accountRepository.save(account);

        return accountRequestRepository.save(request);
    }

    // Employee or Manager can reject accounts
    @Transactional
    public AccountRequest rejectAccount(String requestId, String rejectorUserId, String rejectorRole, String reason) {
        AccountRequest request = accountRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Account request not found"));

        if (!UserRole.EMPLOYEE.name().equals(rejectorRole) && !UserRole.MANAGER.name().equals(rejectorRole)) {
            throw new RuntimeException("Only Employee or Manager can reject account requests");
        }

        request.setStatus("REJECTED");
        request.setRejectedBy(rejectorUserId);
        request.setRejectionReason(reason);
        request.setRejectedAt(LocalDateTime.now());
        request.setUpdatedAt(LocalDateTime.now());

        return accountRequestRepository.save(request);
    }

    private String generateAccountNumber() {
        String accNum;
        do {
            long num = 1000000000L +
                Math.abs(new Random().nextLong() % 9000000000L);
            accNum = "ACC" + num;
        } while (accountRepository.findByAccountNumber(accNum).isPresent());
        return accNum;
    }
}
