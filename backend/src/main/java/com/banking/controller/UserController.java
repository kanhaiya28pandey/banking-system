package com.banking.controller;

import com.banking.dto.ApiResponse;
import com.banking.model.User;
import com.banking.repository.UserRepository;
import com.banking.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired private UserRepository userRepository;
    @Autowired private UserService userService;

    @GetMapping("/by-email")
    public ResponseEntity<ApiResponse<User>> getByEmail(
            @RequestParam String email) {
        return userRepository.findByEmail(email)
                .map(u -> {
                    u.setPassword(null);
                    u.setTransactionPin(null);
                    return ResponseEntity.ok(
                        new ApiResponse<>(true, "User found", u));
                })
                .orElse(ResponseEntity.ok(
                    new ApiResponse<>(false, "User not found", null)));
    }

    @GetMapping("/has-transaction-pin/{id}")
    public ResponseEntity<ApiResponse<Boolean>> hasTransactionPin(
            @PathVariable String id) {
        return userRepository.findById(id)
                .map(u -> {
                    boolean hasPin = u.getTransactionPin() != null && !u.getTransactionPin().isEmpty();
                    return ResponseEntity.ok(
                        new ApiResponse<>(true, "PIN status", hasPin));
                })
                .orElse(ResponseEntity.ok(
                    new ApiResponse<>(false, "User not found", false)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<User>> getById(
            @PathVariable String id) {
        try {
            User user = userService.getUserById(id);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "User found", user));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<User>>> getAllUsers() {
        return ResponseEntity.ok(
            new ApiResponse<>(true, "Users fetched", userService.getAllUsers()));
    }

    // Get users based on requester's role
    @GetMapping("/by-role")
    public ResponseEntity<ApiResponse<List<User>>> getUsersByRole(
            @RequestParam String requesterId,
            @RequestParam String requesterRole) {
        try {
            List<User> users = userService.getUsersByRole(requesterId, requesterRole);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Users fetched", users));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<ApiResponse<User>> updateUser(
            @PathVariable String id, @RequestBody User updatedUser) {
        try {
            User user = userService.updateUser(id, updatedUser);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Profile updated", user));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/block/{id}")
    public ResponseEntity<ApiResponse<String>> blockUser(
            @PathVariable String id,
            @RequestParam(required = false) String adminRole) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!"ADMIN".equals(adminRole) && !"MANAGER".equals(adminRole)) {
                return ResponseEntity.ok(
                    new ApiResponse<>(false, "Only Admin/Manager can block users", null));
            }

            user.setStatus("BLOCKED");
            userRepository.save(user);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "User blocked", null));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    @PutMapping("/unblock/{id}")
    public ResponseEntity<ApiResponse<String>> unblockUser(
            @PathVariable String id,
            @RequestParam(required = false) String adminRole) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!"ADMIN".equals(adminRole)) {
                return ResponseEntity.ok(
                    new ApiResponse<>(false, "Only Admin can unblock users", null));
            }

            user.setStatus("ACTIVE");
            userRepository.save(user);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "User unblocked", null));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // Delete user (only Admin - soft delete)
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(
            @PathVariable String id,
            @RequestParam String deleterRole) {
        try {
            userService.softDeleteUser(id, deleterRole);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "User deleted", (String) null));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // Create Manager (Admin only)
    @PostMapping("/create-manager")
    public ResponseEntity<ApiResponse<User>> createManager(
            @RequestParam String creatorId,
            @RequestBody User managerData) {
        try {
            User creator = userRepository.findById(creatorId)
                    .orElseThrow(() -> new RuntimeException("Creator not found"));

            User newManager = userService.createManager(creatorId, creator.getRole(), managerData);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Manager created successfully", newManager));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // Create Employee (Manager only)
    @PostMapping("/create-employee")
    public ResponseEntity<ApiResponse<User>> createEmployee(
            @RequestParam String creatorId,
            @RequestBody User employeeData) {
        try {
            User creator = userRepository.findById(creatorId)
                    .orElseThrow(() -> new RuntimeException("Creator not found"));

            User newEmployee = userService.createEmployee(creatorId, creator.getRole(), employeeData);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Employee created successfully", newEmployee));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // ============ EMPLOYEE DASHBOARD ENDPOINTS ============

    // Get all customers for employee
    @GetMapping("/employees/all-customers")
    public ResponseEntity<ApiResponse<List<User>>> getAllCustomers() {
        try {
            List<User> customers = userService.getAllCustomersForEmployee();
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Customers fetched", customers));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // Get pending verification accounts
    @GetMapping("/employees/pending-verifications")
    public ResponseEntity<ApiResponse<List<User>>> getPendingVerifications() {
        try {
            List<User> pending = userService.getPendingVerificationAccounts();
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Pending accounts fetched", pending));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // Update user by employee
    @PutMapping("/employees/update-customer/{userId}")
    public ResponseEntity<ApiResponse<User>> updateCustomer(
            @PathVariable String userId,
            @RequestParam String employeeId,
            @RequestBody User updateData) {
        try {
            User updated = userService.updateUserByEmployee(userId, updateData, employeeId);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Customer updated", updated));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // Verify user account by employee
    @PostMapping("/employees/verify-account/{userId}")
    public ResponseEntity<ApiResponse<User>> verifyAccount(
            @PathVariable String userId,
            @RequestParam String employeeId) {
        try {
            User verified = userService.verifyUserAccount(userId, employeeId);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Account verified successfully", verified));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // Disable user account by employee
    @PostMapping("/employees/disable-account/{userId}")
    public ResponseEntity<ApiResponse<User>> disableAccount(
            @PathVariable String userId,
            @RequestParam String employeeId) {
        try {
            User disabled = userService.disableUserAccount(userId, employeeId);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Account disabled successfully", disabled));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }

    // Enable user account by employee
    @PostMapping("/employees/enable-account/{userId}")
    public ResponseEntity<ApiResponse<User>> enableAccount(
            @PathVariable String userId,
            @RequestParam String employeeId) {
        try {
            User enabled = userService.enableUserAccount(userId, employeeId);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "Account enabled successfully", enabled));
        } catch (Exception e) {
            return ResponseEntity.ok(
                new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}