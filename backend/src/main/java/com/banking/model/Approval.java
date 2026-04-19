package com.banking.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Document(collection = "approvals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Approval {
    @Id
    private String id;

    private String transactionId;
    private Integer requestedBy;
    private Integer assignedTo;
    private String actionType;
    private BigDecimal amount;
    private String description;
    @Builder.Default
    private String status = "PENDING";
    private String rejectionReason;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime expiresAt;
    private LocalDateTime reviewedAt;
    private Integer reviewedBy;

    public enum ApprovalStatus {
        PENDING, APPROVED, REJECTED
    }

    public enum ActionType {
        LARGE_TRANSFER, ACCOUNT_CLOSURE, ACCOUNT_BLOCK, OTHER
    }
}
