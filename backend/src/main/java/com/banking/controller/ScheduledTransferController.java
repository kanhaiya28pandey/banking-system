package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.dto.ScheduledTransferRequest;
import com.banking.dto.ScheduledTransferResponse;
import com.banking.model.ScheduledTransaction;
import com.banking.model.User;
import com.banking.service.ScheduledTransactionService;
import com.banking.security.JwtTokenProvider;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/scheduled-transfer")
@CrossOrigin(origins = "*")
public class ScheduledTransferController {

    @Autowired private ScheduledTransactionService scheduledTxnService;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private UserRepository userRepository;

    private String extractUserIdFromToken(HttpServletRequest request) {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated()) {
                Object principal = auth.getPrincipal();
                if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                    String email = ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
                    Optional<User> user = userRepository.findByEmail(email);
                    if (user.isPresent()) {
                        return user.get().getId();
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("SecurityContext extraction failed: " + e.getMessage());
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String email = jwtTokenProvider.getEmailFromToken(token);
                Optional<User> user = userRepository.findByEmail(email);
                if (user.isPresent()) {
                    return user.get().getId();
                } else {
                    throw new RuntimeException("User not found for email: " + email);
                }
            } catch (Exception e) {
                System.err.println("JWT extraction failed: " + e.getMessage());
                throw new RuntimeException("JWT extraction failed: " + e.getMessage());
            }
        }
        throw new RuntimeException("No Authorization header found");
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<ScheduledTransferResponse>> createScheduledTransfer(
            HttpServletRequest request,
            @RequestBody ScheduledTransferRequest req) {
        try {
            String userId = extractUserIdFromToken(request);
            ScheduledTransaction st = scheduledTxnService.createScheduledTransfer(userId, req);
            return ResponseEntity.ok(new ApiResponse<>(true, "Scheduled transfer created", ScheduledTransferResponse.fromScheduledTransaction(st)));
        } catch (RuntimeException e) {
            System.err.println("Error in createScheduledTransfer: " + e.getMessage());
            return ResponseEntity.status(401).body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            System.err.println("Unexpected error in createScheduledTransfer: " + e.getMessage());
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Server error: " + e.getMessage(), null));
        }
    }

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<ScheduledTransferResponse>>> getScheduledTransfers(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            List<ScheduledTransaction> transfers = scheduledTxnService.getUserScheduledTransfers(userId);
            List<ScheduledTransferResponse> responses = transfers.stream()
                .map(ScheduledTransferResponse::fromScheduledTransaction)
                .collect(Collectors.toList());
            return ResponseEntity.ok(new ApiResponse<>(true, "Scheduled transfers retrieved", responses));
        } catch (RuntimeException e) {
            System.err.println("Error in getScheduledTransfers: " + e.getMessage());
            return ResponseEntity.status(401).body(new ApiResponse<>(false, e.getMessage(), null));
        } catch (Exception e) {
            System.err.println("Unexpected error in getScheduledTransfers: " + e.getMessage());
            return ResponseEntity.status(500).body(new ApiResponse<>(false, "Server error: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/pause")
    public ResponseEntity<ApiResponse<ScheduledTransferResponse>> pauseScheduledTransfer(
            HttpServletRequest request,
            @PathVariable String id) {
        try {
            extractUserIdFromToken(request);
            ScheduledTransaction st = scheduledTxnService.pauseScheduledTransfer(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Scheduled transfer paused", ScheduledTransferResponse.fromScheduledTransaction(st)));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Unauthorized: " + e.getMessage(), null));
        }
    }

    @PutMapping("/{id}/resume")
    public ResponseEntity<ApiResponse<ScheduledTransferResponse>> resumeScheduledTransfer(
            HttpServletRequest request,
            @PathVariable String id) {
        try {
            extractUserIdFromToken(request);
            ScheduledTransaction st = scheduledTxnService.resumeScheduledTransfer(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Scheduled transfer resumed", ScheduledTransferResponse.fromScheduledTransaction(st)));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Unauthorized: " + e.getMessage(), null));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> cancelScheduledTransfer(
            HttpServletRequest request,
            @PathVariable String id) {
        try {
            extractUserIdFromToken(request);
            scheduledTxnService.cancelScheduledTransfer(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Scheduled transfer cancelled", null));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Unauthorized: " + e.getMessage(), null));
        }
    }
}
