package com.banking.service;

import com.banking.model.Account;
import com.banking.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Random;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    public Account createAccount(String userId, String accountType) {
        List<Account> existing = accountRepository.findByUserId(userId);
        for (Account acc : existing) {
            if (acc.getAccountType().equals(accountType)
                    && "ACTIVE".equals(acc.getStatus())) {
                throw new RuntimeException(
                    "You already have an active " + accountType + " account");
            }
        }
        Account account = new Account();
        account.setUserId(userId);
        account.setAccountNumber(generateAccountNumber());
        account.setBalance(0.0);
        account.setAccountType(accountType);
        account.setStatus("ACTIVE");
        return accountRepository.save(account);
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

    public List<Account> getAccountsByUser(String userId) {
        return accountRepository.findByUserId(userId);
    }

    public Account getByAccountNumber(String accountNumber) {
        return accountRepository.findByAccountNumber(accountNumber)
                .orElseThrow(() -> new RuntimeException(
                    "Account not found: " + accountNumber));
    }

    public void blockAccount(String accountNumber) {
        Account account = getByAccountNumber(accountNumber);
        account.setStatus("BLOCKED");
        accountRepository.save(account);
    }

    public void unblockAccount(String accountNumber) {
        Account account = getByAccountNumber(accountNumber);
        account.setStatus("ACTIVE");
        accountRepository.save(account);
    }
}