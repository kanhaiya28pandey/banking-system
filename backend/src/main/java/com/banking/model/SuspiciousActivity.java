package com.banking.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "suspicious_activities")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SuspiciousActivity {
    @Id
    private String id;

    private String userId;

    private String activityType;

    private String description;

    private String severity;

    private String ipAddress;

    private String deviceInfo;

    @Builder.Default
    private String actionTaken = "FLAGGED";

    @Builder.Default
    private Boolean resolved = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum ActivityType {
        RAPID_TRANSACTIONS, UNUSUAL_AMOUNT, FAILED_LOGINS, NEW_DEVICE, MULTIPLE_IPS
    }

    public enum Severity {
        LOW, MEDIUM, HIGH, CRITICAL
    }

    public enum ActionTaken {
        FLAGGED, BLOCKED, FROZEN
    }
}
