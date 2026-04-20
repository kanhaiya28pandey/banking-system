package com.banking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;

import java.time.LocalDateTime;
import java.time.LocalDate;

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
    private String transactionPin;  // 4-digit PIN for transactions

    // Roles and Status
    private String role; // ADMIN, MANAGER, EMPLOYEE, USER
    private String status; // ACTIVE, BLOCKED, FROZEN, LOCKED, DISABLED

    // Account Verification Status
    private String accountStatus; // PENDING_VERIFICATION, VERIFIED, SUSPENDED, DISABLED
    private String verifiedBy;    // Employee/Manager ID who verified
    private LocalDateTime verifiedAt;

    // ============ PHASE 1: PERSONAL DETAILS ============
    private String firstName;
    private String middleName;
    private String lastName;
    private String fullName;           // Combined name
    private String fathersName;
    private String gender;             // Male, Female, Other
    private LocalDate dateOfBirth;

    // Address
    private String address;
    private String city;
    private String state;
    private String pinCode;

    // ============ PHASE 2: KYC INFORMATION ============
    private String religion;           // Hindu, Muslim, Sikh, Christian, Other
    private String category;           // General, OBC, SC, ST, Other
    private String incomeRange;        // <1L, 1L-5L, 5L-10L, >10L
    private String educationalQualification;  // Non-Graduate, Graduate, Postgraduate, Other
    private String educationOtherDetails;     // If "Other" selected
    private String occupation;         // Student, Private Job, Government Job, Business, Other
    private String occupationOtherDetails;    // If "Other" selected

    private String panNumber;
    private String aadhaarNumber;

    private Boolean seniorCitizen;     // Yes/No
    private Boolean existingAccountHolder;  // Yes/No

    @Builder.Default
    private Boolean kycVerified = false;

    // ============ PHASE 3: ACCOUNT DETAILS ============
    private String accountType;        // SAVING, CURRENT, FIXED_DEPOSIT, RECURRING_DEPOSIT

    // Services Selected
    private Boolean atmCard;
    private Boolean internetBanking;
    private Boolean mobileBanking;
    private Boolean emailAlerts;
    private Boolean chequeBook;
    private Boolean eStatement;

    private Double initialDeposit;     // >= 1000

    // ============ PHASE 4: SECURITY SETUP ============
    // Password and PIN already defined above

    // ============ ACCOUNT MANAGEMENT ============
    private String phone;
    private String name;
    private String userType;           // NORMAL, PREMIUM
    private String branch;

    // Security Fields
    private LocalDateTime accountLockedUntil;
    @Builder.Default
    private Integer failedLoginAttempts = 0;
    private LocalDateTime lastLogin;

    // Account Blocking
    private String blockedReason;
    private String blockedBy;
    private LocalDateTime blockedAt;

    // Notifications
    @Builder.Default
    private Boolean notificationsEnabled = true;
    private String preferredNotificationMethod; // EMAIL, SMS, PUSH

    // Balance (simple balance for transactions)
    @Builder.Default
    private java.math.BigDecimal balance = java.math.BigDecimal.ZERO;

    // Registration Status
    private String registrationPhase;  // PHASE_1, PHASE_2, PHASE_3, PHASE_4, PHASE_5, COMPLETED
    private LocalDateTime registrationStartedAt;
    private LocalDateTime registrationCompletedAt;

    // Metadata
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
