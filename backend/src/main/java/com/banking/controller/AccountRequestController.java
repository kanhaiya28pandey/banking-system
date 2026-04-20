package com.banking.controller;

import com.banking.dto.AccountRequestDTO;
import com.banking.model.AccountRequest;
import com.banking.service.AccountRequestService;
import lombok.AllArgsConstructor;
import lombok.Data;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/account-requests")
public class AccountRequestController {

    @Autowired
    private AccountRequestService accountRequestService;

    // User applies for new account
    @PostMapping("/apply")
    public ResponseEntity<Map<String, Object>> applyForAccount(
            @RequestParam String userId,
            @RequestParam String accountType,
            @RequestParam Double initialDeposit) {
        try {
            AccountRequest request = accountRequestService.applyForAccount(userId, accountType, initialDeposit);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Account application submitted successfully");
            response.put("data", convertToDTO(request));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Get account requests (Employee/Manager/Admin see pending, User sees their own)
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAccountRequests(
            @RequestParam String userId,
            @RequestParam String userRole) {
        try {
            List<AccountRequest> requests = accountRequestService.getAccountRequests(userId, userRole);
            List<AccountRequestDTO> dtos = requests.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("data", dtos);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Employee/Manager approves account
    @PostMapping("/{requestId}/approve")
    public ResponseEntity<Map<String, Object>> approveAccount(
            @PathVariable String requestId,
            @RequestParam String approverUserId,
            @RequestParam String approverRole) {
        try {
            AccountRequest request = accountRequestService.approveAccount(requestId, approverUserId, approverRole);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Account approved successfully");
            response.put("data", convertToDTO(request));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Only Manager can reject account
    @PostMapping("/{requestId}/reject")
    public ResponseEntity<Map<String, Object>> rejectAccount(
            @PathVariable String requestId,
            @RequestParam String rejectorUserId,
            @RequestParam String rejectorRole,
            @RequestParam String reason) {
        try {
            AccountRequest request = accountRequestService.rejectAccount(requestId, rejectorUserId, rejectorRole, reason);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Account request rejected");
            response.put("data", convertToDTO(request));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    private AccountRequestDTO convertToDTO(AccountRequest request) {
        return AccountRequestDTO.builder()
                .id(request.getId())
                .userId(request.getUserId())
                .accountType(request.getAccountType())
                .status(request.getStatus())
                .createdBy(request.getCreatedBy())
                .approvedBy(request.getApprovedBy())
                .rejectedBy(request.getRejectedBy())
                .rejectionReason(request.getRejectionReason())
                .initialDeposit(request.getInitialDeposit())
                .createdAt(request.getCreatedAt())
                .approvedAt(request.getApprovedAt())
                .rejectedAt(request.getRejectedAt())
                .build();
    }
}

@Data
class ApproveAccountRequestBody {
    private String approverRole;
}

@Data
class RejectAccountRequestBody {
    private String rejectorRole;
    private String reason;
}
