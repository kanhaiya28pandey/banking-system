package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.dto.TransactionRequest;
import com.banking.model.Transaction;
import com.banking.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/transaction")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired private TransactionService transactionService;

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<Transaction>> deposit(
            @RequestParam String accountNumber,
            @RequestParam Double amount) {
        try {
            Transaction tx = transactionService.deposit(accountNumber, amount);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Deposit successful", tx));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<Transaction>> withdraw(
            @RequestParam String accountNumber,
            @RequestParam Double amount) {
        try {
            Transaction tx = transactionService.withdraw(accountNumber, amount);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Withdrawal successful", tx));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<Transaction>> transfer(
            @RequestBody TransactionRequest req) {
        try {
            Transaction tx = transactionService.transfer(req);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Transfer successful", tx));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    @GetMapping("/history/{accountNumber}")
    public ResponseEntity<ApiResponse<List<Transaction>>> history(
            @PathVariable String accountNumber) {
        List<Transaction> txs = transactionService.getHistory(accountNumber);
        return ResponseEntity.ok(new ApiResponse<>(
            true, "History fetched", txs));
    }
}