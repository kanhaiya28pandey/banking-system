package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.dto.TransactionRequest;
import com.banking.dto.TransactionResponse;
import com.banking.dto.TransactionFilterRequest;
import com.banking.dto.TransactionWithPinRequest;
import com.banking.model.Transaction;
import com.banking.model.Account;
import com.banking.model.User;
import com.banking.service.TransactionService;
import com.banking.service.ReceiptService;
import com.banking.service.ExportService;
import com.banking.repository.TransactionRepository;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/transaction")
@CrossOrigin(origins = "*")
public class TransactionController {

    @Autowired private TransactionService transactionService;
    @Autowired private ReceiptService receiptService;
    @Autowired private ExportService exportService;
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

    @PostMapping("/withdraw-with-pin")
    public ResponseEntity<ApiResponse<TransactionResponse>> withdrawWithPin(
            @RequestBody TransactionWithPinRequest req) {
        try {
            Transaction tx = transactionService.withdrawWithPin(req.getAccountNumber(), req.getAmount(), req.getTransactionPin());
            TransactionResponse response = TransactionResponse.fromTransaction(tx);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Withdrawal successful with PIN verification. Receipt link included.", response));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    @PostMapping("/deposit-with-pin")
    public ResponseEntity<ApiResponse<TransactionResponse>> depositWithPin(
            @RequestBody TransactionWithPinRequest req) {
        try {
            Transaction tx = transactionService.depositWithPin(req.getAccountNumber(), req.getAmount(), req.getTransactionPin());
            TransactionResponse response = TransactionResponse.fromTransaction(tx);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Deposit successful with PIN verification. Receipt link included.", response));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    @PostMapping("/transfer-with-pin")
    public ResponseEntity<ApiResponse<TransactionResponse>> transferWithPin(
            @RequestBody TransactionRequest req) {
        try {
            String pin = req.getTransactionPin();
            if (pin == null || pin.isEmpty()) {
                return ResponseEntity.ok(new ApiResponse<>(false, "Transaction PIN required", null));
            }
            Transaction tx = transactionService.transferWithPin(req, pin);
            TransactionResponse response = TransactionResponse.fromTransaction(tx);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Transfer successful with PIN verification. Receipt link included.", response));
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

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<Page<Transaction>>> search(
            @RequestBody TransactionFilterRequest filter) {
        try {
            Page<Transaction> results = transactionService.searchTransactions(filter);
            return ResponseEntity.ok(new ApiResponse<>(
                true, "Search completed", results));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, "Search failed: " + e.getMessage(), null));
        }
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

    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportStatementPdf(
            @RequestParam String accountNumber,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        try {
            LocalDateTime from = fromDate != null ? LocalDateTime.parse(fromDate) : null;
            LocalDateTime to = toDate != null ? LocalDateTime.parse(toDate) : null;

            byte[] pdfBytes = exportService.generateStatementPdf(accountNumber, from, to);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "nexbank-statement-" + accountNumber + ".pdf");
            headers.setContentLength(pdfBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/export/csv")
    public ResponseEntity<byte[]> exportStatementCsv(
            @RequestParam String accountNumber,
            @RequestParam(required = false) String fromDate,
            @RequestParam(required = false) String toDate) {
        try {
            LocalDateTime from = fromDate != null ? LocalDateTime.parse(fromDate) : null;
            LocalDateTime to = toDate != null ? LocalDateTime.parse(toDate) : null;

            byte[] csvBytes = exportService.generateStatementCsv(accountNumber, from, to);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv"));
            headers.setContentDispositionFormData("attachment", "nexbank-statement-" + accountNumber + ".csv");
            headers.setContentLength(csvBytes.length);

            return ResponseEntity.ok()
                    .headers(headers)
                    .body(csvBytes);

        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    // ============ EMPLOYEE VIEW ENDPOINTS ============

    // Get all transactions for a user (employee view)
    @GetMapping("/employee/user-transactions/{userId}")
    public ResponseEntity<ApiResponse<List<Transaction>>> getUserTransactionsByEmployee(
            @PathVariable String userId) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Transaction> transactions = transactionRepository.findByFromAccountOrToAccountOrderByDateDesc(
                    userId, userId);

            return ResponseEntity.ok(new ApiResponse<>(
                true, "User transactions fetched", transactions));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }

    // Get all transactions (employee/manager view - system-wide)
    @GetMapping("/employee/all-transactions")
    public ResponseEntity<ApiResponse<List<Transaction>>> getAllTransactions() {
        try {
            List<Transaction> transactions = transactionRepository.findAll();
            return ResponseEntity.ok(new ApiResponse<>(
                true, "All transactions fetched", transactions));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(
                false, e.getMessage(), null));
        }
    }
}