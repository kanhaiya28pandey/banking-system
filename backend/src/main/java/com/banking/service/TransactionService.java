package com.banking.service;

import com.banking.dto.TransactionRequest;
import com.banking.model.Account;
import com.banking.model.Transaction;
import com.banking.repository.AccountRepository;
import com.banking.repository.TransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class TransactionService {

    @Autowired private AccountRepository accountRepository;
    @Autowired private TransactionRepository transactionRepository;

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
        return transactionRepository.save(tx);
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
        return transactionRepository.save(tx);
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
        return transactionRepository.save(tx);
    }

    public List<Transaction> getHistory(String accountNumber) {
        return transactionRepository
            .findByFromAccountOrToAccountOrderByDateDesc(
                accountNumber, accountNumber);
    }
}