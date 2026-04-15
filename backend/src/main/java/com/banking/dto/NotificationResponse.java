package com.banking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private String id;
    private String userId;
    private String transactionId;
    private String notificationType;
    private LocalDateTime sentAt;
    private String status;
}
