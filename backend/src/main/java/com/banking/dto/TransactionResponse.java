package com.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.banking.model.Transaction;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TransactionResponse {
    private String transactionId;
    private String type;
    private Double amount;
    private String status;
    private String date;
    private String description;
    private String receiptDownloadLink;

    public static TransactionResponse fromTransaction(Transaction tx) {
        return TransactionResponse.builder()
                .transactionId(tx.getId())
                .type(tx.getType())
                .amount(tx.getAmount())
                .status(tx.getStatus())
                .date(tx.getDate().toString())
                .description(tx.getDescription())
                .receiptDownloadLink("/api/transaction/" + tx.getId() + "/receipt")
                .build();
    }
}
