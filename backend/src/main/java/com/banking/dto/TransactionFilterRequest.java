package com.banking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TransactionFilterRequest {
    private String accountNumber;
    private LocalDateTime fromDate;
    private LocalDateTime toDate;
    private Double minAmount;
    private Double maxAmount;
    private String transactionType; // CREDIT, DEBIT, TRANSFER
    private String status; // SUCCESS, FAILED
    private Integer page;
    private Integer pageSize;

    public TransactionFilterRequest() {
        this.page = 0;
        this.pageSize = 20;
    }
}
