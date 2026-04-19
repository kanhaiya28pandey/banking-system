package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.model.Account;
import com.banking.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/account")
@CrossOrigin(origins = "*")
public class AccountController {

    @Autowired private AccountService accountService;

    /**
     * Create a new account with mandatory minimum deposit of ₹1000
     * @param userId User ID
     * @param accountType Account type (SAVING, CURRENT, etc.)
     * @param initialDeposit Initial deposit (must be >= ₹1000)
     * @return Created and activated account
     */
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Account>> create(
            @RequestParam String userId,
            @RequestParam String accountType,
            @RequestParam Double initialDeposit) {
        try {
            Account account = accountService.createAccount(userId, accountType, initialDeposit);
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "✅ Account created successfully with initial deposit of ₹" + initialDeposit,
                account));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    /**
     * Deposit minimum amount and activate account
     * @param accountNumber Account number
     * @param depositAmount Deposit amount (must be >= ₹1000)
     * @return Activated account
     */
    @PostMapping("/{accountNumber}/deposit-minimum")
    public ResponseEntity<ApiResponse<Account>> depositMinimum(
            @PathVariable String accountNumber,
            @RequestParam Double depositAmount) {
        try {
            // This endpoint is for accounts that were previously created without deposit
            // In new flow, all accounts require deposit at creation time
            throw new RuntimeException(
                "This endpoint is deprecated. " +
                "All new accounts require minimum deposit (₹1000) at creation time. " +
                "Use POST /api/account/create with initialDeposit parameter.");
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<ApiResponse<List<Account>>> getUserAccounts(
            @PathVariable String userId) {
        List<Account> accounts = accountService.getAccountsByUser(userId);
        return ResponseEntity.ok(new ApiResponse<>(
            true, "Accounts fetched", accounts));
    }

    @GetMapping("/{accountNumber}")
    public ResponseEntity<ApiResponse<Account>> getAccount(
            @PathVariable String accountNumber) {
        try {
            Account account = accountService.getByAccountNumber(accountNumber);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Account found", account));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    @PutMapping("/block/{accountNumber}")
    public ResponseEntity<ApiResponse<String>> blockAccount(
            @PathVariable String accountNumber) {
        accountService.blockAccount(accountNumber);
        return ResponseEntity.ok(new ApiResponse<>(
            true, "Account blocked", null));
    }

    @PutMapping("/unblock/{accountNumber}")
    public ResponseEntity<ApiResponse<String>> unblockAccount(
            @PathVariable String accountNumber) {
        accountService.unblockAccount(accountNumber);
        return ResponseEntity.ok(new ApiResponse<>(
            true, "Account unblocked", null));
    }
}