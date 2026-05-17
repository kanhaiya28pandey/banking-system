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
@RequestMapping("/api/account-request")
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

    // Get pending account requests (for Employee/Manager dashboard)
    @GetMapping("/pending")
    public ResponseEntity<Map<String, Object>> getPendingAccountRequests() {
        try {
            List<AccountRequest> requests = accountRequestService.getAccountRequests("", "EMPLOYEE");
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
    @PostMapping("/approve/{requestId}")
    public ResponseEntity<Map<String, Object>> approveAccount(
            @PathVariable String requestId,
            @RequestParam(name = "approverId", required = false) String approverId,
            @RequestParam(name = "approverUserId", required = false) String approverUserId,
            @RequestParam String approverRole) {
        try {
            String userId = approverId != null ? approverId : approverUserId;
            System.out.println("[APPROVE] Request ID: " + requestId + ", Approver: " + userId + ", Role: " + approverRole);

            AccountRequest request = accountRequestService.approveAccount(requestId, userId, approverRole);

            System.out.println("[APPROVE] ✅ SUCCESS - Account approved for user: " + request.getUserId());

            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Account approved successfully");
            response.put("data", convertToDTO(request));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("[APPROVE] ❌ ERROR: " + e.getMessage());
            e.printStackTrace();

            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    // Only Manager can reject account
    @PostMapping("/reject/{requestId}")
    public ResponseEntity<Map<String, Object>> rejectAccount(
            @PathVariable String requestId,
            @RequestParam(name = "rejectorId", required = false) String rejectorId,
            @RequestParam(name = "rejectorUserId", required = false) String rejectorUserId,
            @RequestParam String rejectorRole,
            @RequestParam String reason) {
        try {
            String userId = rejectorId != null ? rejectorId : rejectorUserId;
            AccountRequest request = accountRequestService.rejectAccount(requestId, userId, rejectorRole, reason);
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
                .userName(request.getUserName())
                .userPhone(request.getUserPhone())
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
