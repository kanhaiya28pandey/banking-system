package com.banking.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.index.Indexed;
import java.time.LocalDateTime;

@Data
@Document(collection = "notificationLogs")
public class NotificationLog {
    @Id
    private String id;
    @Indexed
    private String userId;
    @Indexed
    private String transactionId;
    private String notificationType; // EMAIL, SMS
    private String recipientAddress; // email or phone
    private String subject;
    private LocalDateTime sentAt;
    private String status; // SENT, FAILED, PENDING
    private String errorMessage; // nullable
    private Integer retryCount;

    public NotificationLog() {
        this.retryCount = 0;
        this.status = "PENDING";
        this.sentAt = LocalDateTime.now();
    }
}
