package com.banking.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Data
@Document(collection = "transactions")
public class Transaction {
    @Id
    private String id;
    private String fromAccount;
    private String toAccount;
    private Double amount;
    private String type;
    private LocalDateTime date;
    private String status;
    private String description;
}