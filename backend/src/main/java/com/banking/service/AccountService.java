package com.banking.service;

import com.banking.model.Account;
import com.banking.model.User;
import com.banking.repository.AccountRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    // Minimum deposit requirement for all accounts
    private static final Double MINIMUM_DEPOSIT = 1000.0;

    /**
     * Create a new account with minimum deposit requirement
     * Account is immediately ACTIVE if minimum deposit is provided
     * User account status is set to PENDING_VERIFICATION
     * @param userId User ID
     * @param accountType Account type (SAVING, CURRENT, etc.)
     * @param initialDeposit Initial deposit amount (must be >= ₹1000)
     * @return Created and activated account
     */
    @Transactional
    public Account createAccount(String userId, String accountType, Double initialDeposit) {
        // Validate minimum deposit amount
        if (initialDeposit == null || initialDeposit < MINIMUM_DEPOSIT) {
            throw new RuntimeException(
                "Minimum deposit of ₹" + MINIMUM_DEPOSIT + " is required. " +
                "You provided: ₹" + (initialDeposit != null ? initialDeposit : 0));
        }

        // Check if user already has an account of this type (PENDING or ACTIVE)
        List<Account> existingAccounts = accountRepository.findByUserId(userId);

        for (Account acc : existingAccounts) {
            if (acc.getAccountType().equalsIgnoreCase(accountType)) {
                throw new RuntimeException(
                    "You already have a " + accountType + " account. " +
                    "You cannot have multiple accounts of the same type.");
            }
        }

        // Get user to access transaction PIN
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Create new account with minimum deposit
        Account account = new Account();
        account.setUserId(userId);
        account.setAccountNumber(generateAccountNumber());
        account.setBalance(initialDeposit);  // Set balance to initial deposit
        account.setAccountType(accountType);
        account.setStatus("ACTIVE");  // Account is ACTIVE immediately
        account.setMinimumDepositRequired(MINIMUM_DEPOSIT);
        account.setMinimumDepositPaid(true);  // Deposit already paid
        account.setCreatedAt(LocalDateTime.now());
        account.setActivatedAt(LocalDateTime.now());

        // Transfer transaction PIN from user's registration
        if (user.getTransactionPin() != null && !user.getTransactionPin().isEmpty()) {
            account.setTransactionPin(user.getTransactionPin());
        }

        Account savedAccount = accountRepository.save(account);

        // Set user's account status to PENDING_VERIFICATION
        if (user.getAccountStatus() == null) {
            user.setAccountStatus("PENDING_VERIFICATION");
            user.setUpdatedAt(LocalDateTime.now());
            userRepository.save(user);
        }

        return savedAccount;
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