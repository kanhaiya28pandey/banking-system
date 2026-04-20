package com.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountRequestDTO {
    private String id;
    private String userId;
    private String accountType;
    private String status;
    private String createdBy;
    private String approvedBy;
    private String rejectedBy;
    private String rejectionReason;
    private Double initialDeposit;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime rejectedAt;
}

class ApproveAccountRequest {
    private String requestId;
    private String approverRole;
}

class RejectAccountRequest {
    private String requestId;
    private String rejectorRole;
    private String reason;
}
