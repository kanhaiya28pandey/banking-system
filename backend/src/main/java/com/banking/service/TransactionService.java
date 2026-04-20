package com.banking.service;

import com.banking.dto.TransactionRequest;
import com.banking.dto.TransactionFilterRequest;
import com.banking.model.Account;
import com.banking.model.Transaction;
import com.banking.model.User;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionService {

    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private WebSocketBalanceService websocketBalanceService;

    @Transactional
    public Transaction deposit(String accountNumber, Double amount) {
        Account account = accountRepository
            .findByAccountNumber(accountNumber)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        if ("BLOCKED".equals(account.getStatus()))
            throw new RuntimeException("Account is blocked");
        account.setBalance(account.getBalance() + amount);
        accountRepository.save(account);
        Transaction tx = new Transaction();
        tx.setToAccount(accountNumber);
        tx.setAmount(amount);
        tx.setType("CREDIT");
        tx.setDate(LocalDateTime.now());
        tx.setStatus("SUCCESS");
        tx.setDescription("Deposit");
        Transaction saved = transactionRepository.save(tx);

        // Send notification
        try {
            Optional<User> user = userRepository.findById(account.getUserId());
            if (user.isPresent()) {
                notificationService.sendTransactionNotification(saved, account, user.get());
                // Broadcast balance update via WebSocket
                websocketBalanceService.broadcastBalanceUpdate(account.getUserId(), accountNumber);
            }
        } catch (Exception e) {
            System.err.println("Notification error: " + e.getMessage());
        }

        return saved;
    }

    @Transactional
    public Transaction withdraw(String accountNumber, Double amount) {
        Account account = accountRepository
            .findByAccountNumber(accountNumber)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        if ("BLOCKED".equals(account.getStatus()))
            throw new RuntimeException("Account is blocked");
        if (account.getBalance() < amount)
            throw new RuntimeException("Insufficient balance");
        account.setBalance(account.getBalance() - amount);
        accountRepository.save(account);
        Transaction tx = new Transaction();
        tx.setFromAccount(accountNumber);
        tx.setAmount(amount);
        tx.setType("DEBIT");
        tx.setDate(LocalDateTime.now());
        tx.setStatus("SUCCESS");
        tx.setDescription("Withdrawal");
        Transaction saved = transactionRepository.save(tx);

        // Send notification
        try {
            Optional<User> user = userRepository.findById(account.getUserId());
            if (user.isPresent()) {
                notificationService.sendTransactionNotification(saved, account, user.get());
                // Broadcast balance update via WebSocket
                websocketBalanceService.broadcastBalanceUpdate(account.getUserId(), accountNumber);
            }
        } catch (Exception e) {
            System.err.println("Notification error: " + e.getMessage());
        }

        return saved;
    }

    @Transactional
    public Transaction transfer(TransactionRequest req) {
        Account from = accountRepository
            .findByAccountNumber(req.getFromAccount())
            .orElseThrow(() -> new RuntimeException("Source account not found"));
        Account to = accountRepository
            .findByAccountNumber(req.getToAccount())
            .orElseThrow(() -> new RuntimeException("Destination account not found"));
        if ("BLOCKED".equals(from.getStatus()))
            throw new RuntimeException("Source account is blocked");
        if ("BLOCKED".equals(to.getStatus()))
            throw new RuntimeException("Destination account is blocked");
        if (from.getBalance() < req.getAmount())
            throw new RuntimeException("Insufficient balance");
        from.setBalance(from.getBalance() - req.getAmount());
        to.setBalance(to.getBalance() + req.getAmount());
        accountRepository.save(from);
        accountRepository.save(to);
        Transaction tx = new Transaction();
        tx.setFromAccount(req.getFromAccount());
        tx.setToAccount(req.getToAccount());
        tx.setAmount(req.getAmount());
        tx.setType("TRANSFER");
        tx.setDate(LocalDateTime.now());
        tx.setStatus("SUCCESS");
        tx.setDescription(req.getDescription() != null
            ? req.getDescription() : "Transfer");
        Transaction saved = transactionRepository.save(tx);

        // Send notifications to both sender and receiver
        try {
            Optional<User> senderUser = userRepository.findById(from.getUserId());
            if (senderUser.isPresent()) {
                notificationService.sendTransactionNotification(saved, from, senderUser.get());
                // Broadcast balance update via WebSocket
                websocketBalanceService.broadcastBalanceUpdate(from.getUserId(), req.getFromAccount());
            }

            Optional<User> receiverUser = userRepository.findById(to.getUserId());
            if (receiverUser.isPresent()) {
                notificationService.sendTransactionNotification(saved, to, receiverUser.get());
                // Broadcast balance update via WebSocket
                websocketBalanceService.broadcastBalanceUpdate(to.getUserId(), req.getToAccount());
            }
        } catch (Exception e) {
            System.err.println("Notification error: " + e.getMessage());
        }

        return saved;
    }

    // ============ PIN-VERIFIED TRANSACTION METHODS ============

    private void verifyTransactionPin(String accountNumber, String providedPin) {
        Account account = accountRepository
            .findByAccountNumber(accountNumber)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        Optional<User> user = userRepository.findById(account.getUserId());
        if (user.isEmpty()) {
            throw new RuntimeException("User not found for account");
        }
        String storedPin = user.get().getTransactionPin();
        if (storedPin == null || storedPin.isEmpty()) {
            throw new RuntimeException("No transaction PIN set. Please set a PIN first.");
        }
        // Trim whitespace and compare
        if (!storedPin.trim().equals(providedPin != null ? providedPin.trim() : "")) {
            throw new RuntimeException("Invalid transaction PIN");
        }
    }

    @Transactional
    public Transaction withdrawWithPin(String accountNumber, Double amount, String transactionPin) {
        verifyTransactionPin(accountNumber, transactionPin);
        return withdraw(accountNumber, amount);
    }

    @Transactional
    public Transaction depositWithPin(String accountNumber, Double amount, String transactionPin) {
        verifyTransactionPin(accountNumber, transactionPin);
        return deposit(accountNumber, amount);
    }

    @Transactional
    public Transaction transferWithPin(TransactionRequest req, String transactionPin) {
        verifyTransactionPin(req.getFromAccount(), transactionPin);
        return transfer(req);
    }

    public List<Transaction> getHistory(String accountNumber) {
        return transactionRepository
            .findByFromAccountOrToAccountOrderByDateDesc(
                accountNumber, accountNumber);
    }

    public Page<Transaction> searchTransactions(TransactionFilterRequest filter) {
        if (filter.getPage() == null) filter.setPage(0);
        if (filter.getPageSize() == null) filter.setPageSize(20);

        Pageable pageable = PageRequest.of(filter.getPage(), filter.getPageSize());

        // Use the MongoDB query method
        return transactionRepository.searchTransactions(
            filter.getAccountNumber(),
            filter.getFromDate(),
            filter.getToDate(),
            filter.getMinAmount(),
            filter.getMaxAmount(),
            filter.getTransactionType(),
            filter.getStatus(),
            pageable
        );
    }
}
