package com.banking.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Document(collection = "transaction_limits")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionLimit {
    @Id
    private String id;

    private String accountType;

    private BigDecimal dailyLimit;

    private BigDecimal perTransactionLimit;

    private BigDecimal otpThreshold;

    private BigDecimal approvalThreshold;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
