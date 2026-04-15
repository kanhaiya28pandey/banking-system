package com.banking.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "scheduled_transaction_executions")
public class ScheduledTransactionExecution {
    @Id
    private String id;
    private String scheduledTransactionId;
    private String userId;
    private String transactionId; // Link to actual transaction created
    private Double amount;
    private String status; // SUCCESS, FAILED, PENDING
    private LocalDateTime executedAt;
    private String errorMessage;
    private LocalDateTime createdAt;

    public ScheduledTransactionExecution() {
        this.createdAt = LocalDateTime.now();
        this.status = "PENDING";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getScheduledTransactionId() { return scheduledTransactionId; }
    public void setScheduledTransactionId(String scheduledTransactionId) { this.scheduledTransactionId = scheduledTransactionId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getTransactionId() { return transactionId; }
    public void setTransactionId(String transactionId) { this.transactionId = transactionId; }

    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getExecutedAt() { return executedAt; }
    public void setExecutedAt(LocalDateTime executedAt) { this.executedAt = executedAt; }

    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
