package com.banking.service;

import com.banking.model.ScheduledTransaction;
import com.banking.model.ScheduledTransactionExecution;
import com.banking.model.Transaction;
import com.banking.model.Account;
import com.banking.model.User;
import com.banking.repository.ScheduledTransactionRepository;
import com.banking.repository.ScheduledTransactionExecutionRepository;
import com.banking.repository.TransactionRepository;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import com.banking.dto.ScheduledTransferRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class ScheduledTransactionService {

    @Autowired private ScheduledTransactionRepository scheduledTxnRepository;
    @Autowired private ScheduledTransactionExecutionRepository executionRepository;
    @Autowired private TransactionRepository transactionRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private NotificationService notificationService;
    @Autowired private TransactionService transactionService;

    public ScheduledTransaction createScheduledTransfer(String userId, ScheduledTransferRequest req) {
        ScheduledTransaction st = new ScheduledTransaction();
        st.setUserId(userId);
        st.setFromAccount(req.getFromAccount());
        st.setToAccount(req.getToAccount());
        st.setAmount(req.getAmount());
        st.setRecurrencePattern(req.getRecurrencePattern() != null ? req.getRecurrencePattern() : "ONCE");
        st.setStartDate(req.getStartDate());
        st.setEndDate(req.getEndDate());
        st.setDescription(req.getDescription());
        st.setNotificationStatus(req.getNotificationStatus() != null ? req.getNotificationStatus() : "ENABLED");
        st.setNextExecutionDate(calculateNextExecutionDate(st.getStartDate(), st.getRecurrencePattern()));
        st.setStatus("ACTIVE");
        st.setExecutionCount(0);

        return scheduledTxnRepository.save(st);
    }

    public ScheduledTransaction getScheduledTransfer(String id) {
        return scheduledTxnRepository.findById(id).orElseThrow(() -> new RuntimeException("Not found"));
    }

    public List<ScheduledTransaction> getUserScheduledTransfers(String userId) {
        return scheduledTxnRepository.findByUserId(userId);
    }

    public ScheduledTransaction pauseScheduledTransfer(String id) {
        ScheduledTransaction st = getScheduledTransfer(id);
        st.setStatus("PAUSED");
        st.setUpdatedAt(LocalDateTime.now());
        return scheduledTxnRepository.save(st);
    }

    public ScheduledTransaction resumeScheduledTransfer(String id) {
        ScheduledTransaction st = getScheduledTransfer(id);
        st.setStatus("ACTIVE");
        st.setUpdatedAt(LocalDateTime.now());
        return scheduledTxnRepository.save(st);
    }

    public void cancelScheduledTransfer(String id) {
        ScheduledTransaction st = getScheduledTransfer(id);
        st.setStatus("CANCELLED");
        st.setUpdatedAt(LocalDateTime.now());
        scheduledTxnRepository.save(st);
    }

    // Background task that runs every 60 seconds
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void executeScheduledTransfers() {
        try {
            LocalDateTime now = LocalDateTime.now();
            List<ScheduledTransaction> pending = scheduledTxnRepository
                .findByStatusAndNextExecutionDateBefore("ACTIVE", now);

            for (ScheduledTransaction st : pending) {
                executeTransfer(st);
            }
        } catch (Exception e) {
            System.err.println("Scheduled transfer executor error: " + e.getMessage());
        }
    }

    @Transactional
    private void executeTransfer(ScheduledTransaction st) {
        ScheduledTransactionExecution exec = new ScheduledTransactionExecution();
        exec.setScheduledTransactionId(st.getId());
        exec.setUserId(st.getUserId());
        exec.setAmount(st.getAmount());
        exec.setExecutedAt(LocalDateTime.now());

        try {
            // Verify accounts exist and have sufficient balance
            Optional<Account> fromOpt = accountRepository.findByAccountNumber(st.getFromAccount());
            Optional<Account> toOpt = accountRepository.findByAccountNumber(st.getToAccount());

            if (fromOpt.isEmpty() || toOpt.isEmpty()) {
                throw new RuntimeException("Account not found");
            }

            Account fromAcc = fromOpt.get();
            Account toAcc = toOpt.get();

            if ("BLOCKED".equals(fromAcc.getStatus()) || "BLOCKED".equals(toAcc.getStatus())) {
                throw new RuntimeException("Account is blocked");
            }

            if (fromAcc.getBalance() < st.getAmount()) {
                throw new RuntimeException("Insufficient balance");
            }

            // Execute the transfer
            fromAcc.setBalance(fromAcc.getBalance() - st.getAmount());
            toAcc.setBalance(toAcc.getBalance() + st.getAmount());
            accountRepository.save(fromAcc);
            accountRepository.save(toAcc);

            // Create transaction record
            Transaction tx = new Transaction();
            tx.setFromAccount(st.getFromAccount());
            tx.setToAccount(st.getToAccount());
            tx.setAmount(st.getAmount());
            tx.setType("TRANSFER");
            tx.setDate(LocalDateTime.now());
            tx.setStatus("SUCCESS");
            tx.setDescription("Scheduled: " + (st.getDescription() != null ? st.getDescription() : "Recurring transfer"));
            Transaction saved = transactionRepository.save(tx);

            exec.setTransactionId(saved.getId());
            exec.setStatus("SUCCESS");

            // Send notifications if enabled
            if ("ENABLED".equals(st.getNotificationStatus())) {
                try {
                    Optional<User> senderOpt = userRepository.findById(fromAcc.getUserId());
                    Optional<User> receiverOpt = userRepository.findById(toAcc.getUserId());

                    if (senderOpt.isPresent()) {
                        notificationService.sendTransactionNotification(saved, fromAcc, senderOpt.get());
                    }
                    if (receiverOpt.isPresent()) {
                        notificationService.sendTransactionNotification(saved, toAcc, receiverOpt.get());
                    }
                } catch (Exception e) {
                    System.err.println("Notification error: " + e.getMessage());
                }
            }

        } catch (Exception e) {
            exec.setStatus("FAILED");
            exec.setErrorMessage(e.getMessage());
        }

        executionRepository.save(exec);

        // Update next execution date or mark as completed
        st.setExecutionCount(st.getExecutionCount() + 1);

        if ("ONCE".equals(st.getRecurrencePattern())) {
            st.setStatus("COMPLETED");
        } else {
            // Calculate next execution date
            LocalDateTime nextExecution = calculateNextExecutionDate(LocalDateTime.now(), st.getRecurrencePattern());

            // Check if end date has passed
            if (st.getEndDate() != null && nextExecution.isAfter(st.getEndDate())) {
                st.setStatus("COMPLETED");
            } else {
                st.setNextExecutionDate(nextExecution);
            }
        }

        st.setUpdatedAt(LocalDateTime.now());
        scheduledTxnRepository.save(st);
    }

    private LocalDateTime calculateNextExecutionDate(LocalDateTime currentDate, String recurrencePattern) {
        if (currentDate == null) {
            currentDate = LocalDateTime.now();
        }

        switch (recurrencePattern) {
            case "DAILY":
                return currentDate.plusDays(1);
            case "WEEKLY":
                return currentDate.plusWeeks(1);
            case "MONTHLY":
                return currentDate.plusMonths(1);
            case "ONCE":
            default:
                return currentDate;
        }
    }
}
