package com.banking.service;

import com.banking.model.User;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class InitializationService implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
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
}

