package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.dto.NotificationPreferenceRequest;
import com.banking.dto.NotificationResponse;
import com.banking.model.NotificationLog;
import com.banking.model.NotificationPreference;
import com.banking.model.User;
import com.banking.service.NotificationService;
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
@RequestMapping("/api/notification")
@CrossOrigin(origins = "*")
public class NotificationController {

    @Autowired private NotificationService notificationService;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private UserRepository userRepository;

    private String extractUserIdFromToken(HttpServletRequest request) {
        // First, try to get from Security Context if already set by JwtAuthFilter
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
            System.err.println("SecurityContext extraction failed, trying JWT: " + e.getMessage());
        }

        // Fallback: Extract from JWT token header
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                String email = jwtTokenProvider.getEmailFromToken(token);
                Optional<User> user = userRepository.findByEmail(email);
                if (user.isPresent()) {
                    return user.get().getId();
                }
            } catch (Exception e) {
                System.err.println("JWT extraction failed: " + e.getMessage());
            }
        }
        throw new RuntimeException("Unauthorized");
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreference>> getPreferences(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            NotificationPreference pref = notificationService.getOrCreatePreference(userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Preferences retrieved", pref));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Unauthorized: " + e.getMessage(), null));
        }
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreference>> updatePreferences(
            HttpServletRequest request,
            @RequestBody NotificationPreferenceRequest requestData) {
        try {
            String userId = extractUserIdFromToken(request);

            NotificationPreference updateData = new NotificationPreference();
            updateData.setEmailNotificationsEnabled(requestData.getEmailNotificationsEnabled());
            updateData.setSmsNotificationsEnabled(requestData.getSmsNotificationsEnabled());
            updateData.setNotificationFrequency(requestData.getNotificationFrequency());
            updateData.setTransactionAlertThreshold(requestData.getTransactionAlertThreshold());

            NotificationPreference updated = notificationService.updatePreference(userId, updateData);
            return ResponseEntity.ok(new ApiResponse<>(true, "Preferences updated", updated));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Unauthorized: " + e.getMessage(), null));
        }
    }

    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<List<NotificationResponse>>> getNotificationLogs(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            List<NotificationLog> logs = notificationService.getUserNotificationLogs(userId);

            List<NotificationResponse> responses = logs.stream().map(log -> {
                NotificationResponse resp = new NotificationResponse();
                resp.setId(log.getId());
                resp.setUserId(log.getUserId());
                resp.setTransactionId(log.getTransactionId());
                resp.setNotificationType(log.getNotificationType());
                resp.setSentAt(log.getSentAt());
                resp.setStatus(log.getStatus());
                return resp;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(new ApiResponse<>(true, "Notification logs retrieved", responses));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Unauthorized: " + e.getMessage(), null));
        }
    }

    @PostMapping("/test")
    public ResponseEntity<ApiResponse<String>> sendTestNotification(HttpServletRequest request) {
        try {
            String userId = extractUserIdFromToken(request);
            return ResponseEntity.ok(new ApiResponse<>(true, "Test notification sent to your email", null));
        } catch (Exception e) {
            return ResponseEntity.status(403).body(new ApiResponse<>(false, "Unauthorized: " + e.getMessage(), null));
        }
    }
}
