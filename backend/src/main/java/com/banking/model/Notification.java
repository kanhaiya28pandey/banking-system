package com.banking.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    private String id;

    private String userId;

    private String type;

    private String title;

    private String message;

    private String referenceId;

    private String referenceType;

    @Builder.Default
    private Boolean isRead = false;

    private LocalDateTime readAt;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum NotificationType {
        TRANSACTION_INITIATED, TRANSACTION_COMPLETED, TRANSACTION_FAILED,
        APPROVAL_REQUESTED, APPROVAL_APPROVED, APPROVAL_REJECTED,
        ACCOUNT_BLOCKED, ACCOUNT_UNBLOCKED, SUSPICIOUS_ACTIVITY,
        OTP_GENERATED, LOGIN_ALERT, ACCOUNT_FROZEN
    }
}
