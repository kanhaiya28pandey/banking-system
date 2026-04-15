package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.dto.TransactionRequest;
import com.banking.dto.TransactionResponse;
import com.banking.model.Transaction;
import com.banking.model.Account;
import com.banking.model.User;
import com.banking.service.TransactionService;
import com.banking.service.ReceiptService;
import com.banking.repository.TransactionRepository;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/transaction")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired private TransactionService transactionService;
    @Autowired private ReceiptService receiptService;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private UserRepository userRepository;

    @PostMapping("/deposit")
    public ResponseEntity<ApiResponse<TransactionResponse>> deposit(
            @RequestParam String accountNumber,
            @RequestParam Double amount) {
        try {
            Transaction tx = transactionService.deposit(accountNumber, amount);
            TransactionResponse response = TransactionResponse.fromTransaction(tx);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Deposit successful. Receipt link included.", response));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<ApiResponse<TransactionResponse>> withdraw(
            @RequestParam String accountNumber,
            @RequestParam Double amount) {
        try {
            Transaction tx = transactionService.withdraw(accountNumber, amount);
            TransactionResponse response = TransactionResponse.fromTransaction(tx);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Withdrawal successful. Receipt link included.", response));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    @PostMapping("/transfer")
    public ResponseEntity<ApiResponse<TransactionResponse>> transfer(
            @RequestBody TransactionRequest req) {
        try {
            Transaction tx = transactionService.transfer(req);
            TransactionResponse response = TransactionResponse.fromTransaction(tx);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Transfer successful. Receipt link included.", response));
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

    @GetMapping("/{transactionId}/receipt")
    public ResponseEntity<byte[]> downloadReceipt(@PathVariable String transactionId) {
        try {
            Optional<Transaction> txOpt = transactionRepository.findById(transactionId);
            if (txOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            Transaction tx = txOpt.get();
            Account account = null;
            User user = null;

            // Fetch account and user info if available
            if (tx.getFromAccount() != null && !tx.getFromAccount().isEmpty()) {
                Optional<Account> acc = accountRepository.findByAccountNumber(tx.getFromAccount());
                if (acc.isPresent()) {
                    account = acc.get();
                    Optional<User> u = userRepository.findById(account.getUserId());
                    if (u.isPresent()) user = u.get();
                }
            }

            byte[] pdfBytes = receiptService.generateReceiptPdf(tx, account, user);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "nexbank-receipt-" + transactionId + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }
}