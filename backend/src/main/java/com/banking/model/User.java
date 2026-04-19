package com.banking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "users")
public class User {
    @Id
    private String id;

    @Indexed(unique = true)
    private String username;

    @Indexed(unique = true)
    private String email;

    private String password;
    private String name;
    private String phone;
    private String address;
    private String fullName;

    // Roles and Status
    private String role; // ADMIN, MANAGER, EMPLOYEE, USER
    private String status; // ACTIVE, BLOCKED, FROZEN, LOCKED

    // Account Management
    private String userType; // NORMAL, PREMIUM
    private String branch;
    @Builder.Default
    private Boolean kycVerified = false;

    // Security Fields
    private LocalDateTime accountLockedUntil;
    @Builder.Default
    private Integer failedLoginAttempts = 0;
    private LocalDateTime lastLogin;

    // Account Blocking
    private String blockedReason;
    private Integer blockedBy;
    private LocalDateTime blockedAt;

    // Notifications
    @Builder.Default
    private Boolean notificationsEnabled = true;
    private String preferredNotificationMethod; // EMAIL, SMS, PUSH

    // Balance (simple balance for transactions)
    @Builder.Default
    private java.math.BigDecimal balance = java.math.BigDecimal.ZERO;

    // Metadata
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
