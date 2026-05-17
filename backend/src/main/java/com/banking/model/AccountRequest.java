package com.banking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "account_requests")
public class AccountRequest {
    @Id
    private String id;

    private String userId;              // User who applied
    private String accountType;         // SAVING, CURRENT, etc.
    private String status;              // PENDING, APPROVED, REJECTED

    private String createdBy;           // Employee who created request
    private String approvedBy;          // Who approved (Employee/Manager)
    private String rejectedBy;          // Who rejected (Employee/Manager)
    private String rejectionReason;     // If rejected

    private Double initialDeposit;

    // User details for display
    private String userName;            // User's full name for display
    private String userPhone;           // User's phone for display

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
}
