package com.banking.dto;

import lombok.Data;

@Data
public class NotificationPreferenceRequest {
    private Boolean emailNotificationsEnabled;
    private Boolean smsNotificationsEnabled;
    private String notificationFrequency;
    private Double transactionAlertThreshold;
}
