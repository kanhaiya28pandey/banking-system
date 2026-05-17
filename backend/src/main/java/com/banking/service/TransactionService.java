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
        System.out.println("📝 DEPOSIT ATTEMPT: Account=" + accountNumber + ", Amount=" + amount);

        Account account = accountRepository
            .findByAccountNumber(accountNumber)
            .orElseThrow(() -> new RuntimeException("Account not found"));

        System.out.println("✓ Account found. UserId=" + account.getUserId());

        if ("BLOCKED".equals(account.getStatus()))
            throw new RuntimeException("Account is blocked");

        // Check if user account is verified
        User user = userRepository.findById(account.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("✓ User found. AccountStatus=" + user.getAccountStatus() + ", Role=" + user.getRole());

        // If accountStatus is null or not VERIFIED, throw error
        if (user.getAccountStatus() == null || !"VERIFIED".equals(user.getAccountStatus())) {
            System.out.println("❌ VERIFICATION FAILED - AccountStatus is: " + user.getAccountStatus());
            throw new RuntimeException("⛔ Account not verified. Please wait for employee verification before performing transactions.");
        }

        System.out.println("✓ Verification PASSED - Proceeding with deposit");

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

        System.out.println("✓ Deposit successful. TransactionId=" + saved.getId());

        // Send notification
        try {
            notificationService.sendTransactionNotification(saved, account, user);
            websocketBalanceService.broadcastBalanceUpdate(account.getUserId(), accountNumber);
        } catch (Exception e) {
            System.err.println("Notification error: " + e.getMessage());
        }

        return saved;
    }

    @Transactional
    public Transaction withdraw(String accountNumber, Double amount) {
        System.out.println("📝 WITHDRAW ATTEMPT: Account=" + accountNumber + ", Amount=" + amount);

        Account account = accountRepository
            .findByAccountNumber(accountNumber)
            .orElseThrow(() -> new RuntimeException("Account not found"));

        System.out.println("✓ Account found. UserId=" + account.getUserId() + ", Status=" + account.getStatus());

        // Check if account status is ACTIVE
        if (account.getStatus() == null || !"ACTIVE".equals(account.getStatus())) {
            throw new RuntimeException("Account is not active. Current status: " + account.getStatus());
        }

        if ("BLOCKED".equals(account.getStatus()))
            throw new RuntimeException("Account is blocked");

        // Check if user account is verified
        User user = userRepository.findById(account.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        System.out.println("✓ User found. AccountStatus=" + user.getAccountStatus() + ", Role=" + user.getRole());

        // If accountStatus is null or not VERIFIED, throw error
        if (user.getAccountStatus() == null || !"VERIFIED".equals(user.getAccountStatus())) {
            System.out.println("❌ VERIFICATION FAILED - AccountStatus is: " + user.getAccountStatus());
            throw new RuntimeException("⛔ Account not verified. Please wait for employee verification before performing transactions.");
        }

        System.out.println("✓ Verification PASSED - Proceeding with withdrawal");

        if (account.getBalance() < amount)
            throw new RuntimeException("Insufficient balance");

        // Check minimum deposit protection
        Double minimumDeposit = account.getMinimumDepositRequired() != null ? account.getMinimumDepositRequired() : 0.0;
        Double balanceAfterWithdrawal = account.getBalance() - amount;

        if (minimumDeposit > 0 && balanceAfterWithdrawal < minimumDeposit) {
            throw new RuntimeException("Cannot withdraw. Your account must maintain a minimum deposit of ₹" + minimumDeposit.intValue() +
                ". Current balance: ₹" + account.getBalance().intValue() + ", Maximum withdrawable: ₹" +
                (int)(account.getBalance() - minimumDeposit));
        }

        account.setBalance(balanceAfterWithdrawal);
        accountRepository.save(account);
        Transaction tx = new Transaction();
        tx.setFromAccount(accountNumber);
        tx.setAmount(amount);
        tx.setType("DEBIT");
        tx.setDate(LocalDateTime.now());
        tx.setStatus("SUCCESS");
        tx.setDescription("Withdrawal");
        Transaction saved = transactionRepository.save(tx);

        System.out.println("✓ Withdrawal successful. TransactionId=" + saved.getId());

        // Send notification
        try {
            notificationService.sendTransactionNotification(saved, account, user);
            websocketBalanceService.broadcastBalanceUpdate(account.getUserId(), accountNumber);
        } catch (Exception e) {
            System.err.println("Notification error: " + e.getMessage());
        }

        return saved;
    }

    @Transactional
    public Transaction transfer(TransactionRequest req) {
        System.out.println("📝 TRANSFER ATTEMPT: From=" + req.getFromAccount() + ", To=" + req.getToAccount() + ", Amount=" + req.getAmount());

        Account from = accountRepository
            .findByAccountNumber(req.getFromAccount())
            .orElseThrow(() -> new RuntimeException("Source account not found"));
        Account to = accountRepository
            .findByAccountNumber(req.getToAccount())
            .orElseThrow(() -> new RuntimeException("Destination account not found"));

        System.out.println("✓ Both accounts found. FromUserId=" + from.getUserId() + ", ToUserId=" + to.getUserId());

        // Check if both accounts are ACTIVE
        if (from.getStatus() == null || !"ACTIVE".equals(from.getStatus())) {
            throw new RuntimeException("Source account is not active. Status: " + from.getStatus());
        }
        if (to.getStatus() == null || !"ACTIVE".equals(to.getStatus())) {
            throw new RuntimeException("Destination account is not active. Status: " + to.getStatus());
        }

        if ("BLOCKED".equals(from.getStatus()))
            throw new RuntimeException("Source account is blocked");
        if ("BLOCKED".equals(to.getStatus()))
            throw new RuntimeException("Destination account is blocked");

        // Check if sender account is verified
        User senderUser = userRepository.findById(from.getUserId())
                .orElseThrow(() -> new RuntimeException("Sender not found"));

        System.out.println("✓ Sender found. AccountStatus=" + senderUser.getAccountStatus() + ", Role=" + senderUser.getRole());

        // If accountStatus is null or not VERIFIED, throw error
        if (senderUser.getAccountStatus() == null || !"VERIFIED".equals(senderUser.getAccountStatus())) {
            System.out.println("❌ VERIFICATION FAILED - AccountStatus is: " + senderUser.getAccountStatus());
            throw new RuntimeException("⛔ Your account is not verified. Please wait for employee verification before performing transactions.");
        }

        System.out.println("✓ Verification PASSED - Proceeding with transfer");

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

        System.out.println("✓ Transfer successful. TransactionId=" + saved.getId());

        // Send notifications to both sender and receiver
        try {
            notificationService.sendTransactionNotification(saved, from, senderUser);
            // Broadcast balance update via WebSocket
            websocketBalanceService.broadcastBalanceUpdate(from.getUserId(), req.getFromAccount());

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

        // Check account-specific transaction PIN first
        String storedPin = account.getTransactionPin();

        // If account PIN is not set, fallback to user's PIN from registration
        if (storedPin == null || storedPin.isEmpty()) {
            User user = userRepository.findById(account.getUserId())
                .orElseThrow(() -> new RuntimeException("User not found"));
            storedPin = user.getTransactionPin();

            if (storedPin == null || storedPin.isEmpty()) {
                throw new RuntimeException("No transaction PIN set for this account. Please set a PIN first.");
            }
        }

        // Trim whitespace and compare
        if (!storedPin.trim().equals(providedPin != null ? providedPin.trim() : "")) {
            throw new RuntimeException("Invalid transaction PIN for this account");
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
