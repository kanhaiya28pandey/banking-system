package com.banking.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Data
@Document(collection = "notificationPreferences")
public class NotificationPreference {
    @Id
    private String id;
    @Indexed
    private String userId;
    private Boolean emailNotificationsEnabled;
    private Boolean smsNotificationsEnabled;
    private String notificationFrequency; // INSTANT, DAILY_DIGEST, DISABLED
    private Double transactionAlertThreshold; // Default: 0 = all transactions
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public NotificationPreference() {
        this.emailNotificationsEnabled = true;
        this.smsNotificationsEnabled = false;
        this.notificationFrequency = "INSTANT";
        this.transactionAlertThreshold = 0.0;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }
}
