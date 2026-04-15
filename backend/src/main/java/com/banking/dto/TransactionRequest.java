package com.banking.dto;

import lombok.Data;

@Data
public class TransactionRequest {
    private String fromAccount;
    private String toAccount;
    private Double amount;
    private String description;
}