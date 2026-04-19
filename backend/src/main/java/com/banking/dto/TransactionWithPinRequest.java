package com.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionWithPinRequest {
    private String accountNumber;
    private Double amount;
    private String transactionPin;
    private String type; // WITHDRAW, DEPOSIT, TRANSFER
}
