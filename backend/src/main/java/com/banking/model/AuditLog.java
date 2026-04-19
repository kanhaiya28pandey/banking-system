package com.banking.model;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "audit_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {
    @Id
    private String id;

    private String userId;

    private String action;

    private String entityType;

    private String entityId;

    private JsonNode oldValue;

    private JsonNode newValue;

    private String ipAddress;

    private String userAgent;

    @Builder.Default
    private String status = "SUCCESS";

    private String errorMessage;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum Action {
        LOGIN, LOGOUT, TRANSFER_INITIATED, TRANSFER_COMPLETED, TRANSFER_REJECTED,
        OTP_SENT, OTP_VERIFIED, ACCOUNT_BLOCKED, ACCOUNT_UNBLOCKED, ACCOUNT_FROZEN,
        APPROVAL_REQUESTED, APPROVAL_APPROVED, APPROVAL_REJECTED, ROLE_ASSIGNED,
        SUSPICIOUS_ACTIVITY_FLAGGED, ACCOUNT_LOCKED
    }

    public enum Status {
        SUCCESS, FAILED
    }
}
