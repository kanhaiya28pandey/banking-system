package com.banking.dto;

import com.banking.model.ScheduledTransaction;
import java.time.LocalDateTime;

public class ScheduledTransferResponse {
    private String id;
    private String fromAccount;
    private String toAccount;
    private Double amount;
    private String recurrencePattern;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private LocalDateTime nextExecutionDate;
    private String status;
    private String description;
    private Integer executionCount;
    private LocalDateTime createdAt;
    private String notificationStatus;

    public static ScheduledTransferResponse fromScheduledTransaction(ScheduledTransaction tx) {
        ScheduledTransferResponse resp = new ScheduledTransferResponse();
        resp.setId(tx.getId());
        resp.setFromAccount(tx.getFromAccount());
        resp.setToAccount(tx.getToAccount());
        resp.setAmount(tx.getAmount());
        resp.setRecurrencePattern(tx.getRecurrencePattern());
        resp.setStartDate(tx.getStartDate());
        resp.setEndDate(tx.getEndDate());
        resp.setNextExecutionDate(tx.getNextExecutionDate());
        resp.setStatus(tx.getStatus());
        resp.setDescription(tx.getDescription());
        resp.setExecutionCount(tx.getExecutionCount());
        resp.setCreatedAt(tx.getCreatedAt());
        resp.setNotificationStatus(tx.getNotificationStatus());
        return resp;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFromAccount() { return fromAccount; }
    public void setFromAccount(String fromAccount) { this.fromAccount = fromAccount; }

    public String getToAccount() { return toAccount; }
    public void setToAccount(String toAccount) { this.toAccount = toAccount; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getRecurrencePattern() { return recurrencePattern; }
    public void setRecurrencePattern(String recurrencePattern) { this.recurrencePattern = recurrencePattern; }

    public LocalDateTime getStartDate() { return startDate; }
    public void setStartDate(LocalDateTime startDate) { this.startDate = startDate; }

    public LocalDateTime getEndDate() { return endDate; }
    public void setEndDate(LocalDateTime endDate) { this.endDate = endDate; }

    public LocalDateTime getNextExecutionDate() { return nextExecutionDate; }
    public void setNextExecutionDate(LocalDateTime nextExecutionDate) { this.nextExecutionDate = nextExecutionDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getExecutionCount() { return executionCount; }
    public void setExecutionCount(Integer executionCount) { this.executionCount = executionCount; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getNotificationStatus() { return notificationStatus; }
    public void setNotificationStatus(String notificationStatus) { this.notificationStatus = notificationStatus; }
}
