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

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Account>> create(
            @RequestParam String userId,
            @RequestParam String accountType) {
        try {
            Account account = accountService.createAccount(userId, accountType);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Account created successfully", account));
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