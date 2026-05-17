package com.banking.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "accounts")
public class Account {
    @Id
    private String id;
    private String accountNumber;
    private String userId;
    private Double balance;
    private String accountType;  // SAVING, CURRENT, etc.
    private String status;  // PENDING, ACTIVE, BLOCKED, FROZEN
    private Double minimumDepositRequired;  // Required minimum deposit
    private Boolean minimumDepositPaid;  // Has minimum deposit been paid?
    private String transactionPin;  // 4-digit PIN for this account
    private LocalDateTime createdAt;
    private LocalDateTime activatedAt;
}