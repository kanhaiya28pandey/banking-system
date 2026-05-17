package com.banking.service;

import com.banking.model.User;
import com.banking.model.Account;
import com.banking.repository.UserRepository;
import com.banking.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class InitializationService implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Clean up duplicate accounts first
        cleanupDuplicateAccounts();

        // Migrate phone and name fields for existing users
        migratePhoneAndNameFields();

        // Check if admin already exists
        long adminCount = userRepository.findByRole("ADMIN").size();

        if (adminCount == 0) {
            // Create default admin account with HASHED password
            User admin = User.builder()
                    .username("admin")
                    .email("admin@nexbank.com")
                    .password(passwordEncoder.encode("Admin@123456")) // Hash the password!
                    .firstName("System")
                    .lastName("Administrator")
                    .fullName("System Administrator")
                    .phone("9876543210")
                    .role("ADMIN")
                    .status("ACTIVE")
                    .notificationsEnabled(true)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            userRepository.save(admin);

            System.out.println("\n");
            System.out.println("╔═════════════════════════════════════════════════════════════╗");
            System.out.println("║          ⚠️  INITIAL ADMIN ACCOUNT CREATED  ⚠️              ║");
            System.out.println("╠═════════════════════════════════════════════════════════════╣");
            System.out.println("║                                                             ║");
            System.out.println("║  📧 Email:    admin@nexbank.com                             ║");
            System.out.println("║  🔐 Password: Admin@123456                                  ║");
            System.out.println("║  👤 Role:     ADMIN                                         ║");
            System.out.println("║                                                             ║");
            System.out.println("║  ⚠️  IMPORTANT:                                              ║");
            System.out.println("║  1. Change this password immediately after first login      ║");
            System.out.println("║  2. Use this account only for administrative tasks          ║");
            System.out.println("║  3. Create additional admin accounts through the panel      ║");
            System.out.println("║                                                             ║");
            System.out.println("╚═════════════════════════════════════════════════════════════╝");
            System.out.println("\n");
        }

        // Log system startup info
        System.out.println("═══════════════════════════════════════════════════════════");
        System.out.println("✓ NEXBANK System Initialized Successfully");
        System.out.println("✓ Users by Role:");
        System.out.println("  - ADMIN: " + userRepository.findByRole("ADMIN").size());
        System.out.println("  - MANAGER: " + userRepository.findByRole("MANAGER").size());
        System.out.println("  - EMPLOYEE: " + userRepository.findByRole("EMPLOYEE").size());
        System.out.println("  - USER: " + userRepository.findByRole("USER").size());
        System.out.println("═══════════════════════════════════════════════════════════\n");
    }

    private void migratePhoneAndNameFields() {
        System.out.println("[MIGRATION] Starting phone and name field migration...");
        List<User> allUsers = userRepository.findAll();
        int updated = 0;

        for (User user : allUsers) {
            boolean needsUpdate = false;

            // Populate name from firstName/lastName if empty
            if ((user.getName() == null || user.getName().isEmpty()) &&
                user.getFirstName() != null && !user.getFirstName().isEmpty()) {
                String fullName = user.getFirstName();
                if (user.getLastName() != null && !user.getLastName().isEmpty()) {
                    fullName += " " + user.getLastName();
                }
                user.setName(fullName);
                needsUpdate = true;
            }

            // Note: Phone migration would require additional data source
            // Phone is now captured during Phase 1 registration going forward
            // Existing users can add phone through Profile settings

            if (needsUpdate) {
                user.setUpdatedAt(LocalDateTime.now());
                userRepository.save(user);
                updated++;
            }
        }

        if (updated > 0) {
            System.out.println("[MIGRATION] ✓ Updated " + updated + " user(s) with name field\n");
        }
    }

    private void cleanupDuplicateAccounts() {
        List<Account> allAccounts = accountRepository.findAll();
        Map<String, List<Account>> accountsByUserAndType = new TreeMap<>();

        // Group accounts by userId + accountType
        for (Account account : allAccounts) {
            String key = account.getUserId() + "|" + account.getAccountType().toUpperCase();
            accountsByUserAndType.computeIfAbsent(key, k -> new ArrayList<>()).add(account);
        }

        // Find and remove duplicates (keep first, delete rest)
        int duplicatesRemoved = 0;
        for (Map.Entry<String, List<Account>> entry : accountsByUserAndType.entrySet()) {
            List<Account> accounts = entry.getValue();
            if (accounts.size() > 1) {
                System.out.println("[CLEANUP] Found " + accounts.size() + " duplicate accounts for: " + entry.getKey());
                // Sort by creation date and keep the oldest, delete the rest
                accounts.sort(Comparator.comparing(Account::getCreatedAt));
                for (int i = 1; i < accounts.size(); i++) {
                    Account duplicate = accounts.get(i);
                    System.out.println("  → Removing duplicate: " + duplicate.getAccountNumber());
                    accountRepository.delete(duplicate);
                    duplicatesRemoved++;
                }
            }
        }

        if (duplicatesRemoved > 0) {
            System.out.println("✓ [CLEANUP] Removed " + duplicatesRemoved + " duplicate account(s)\n");
        }
    }
}

