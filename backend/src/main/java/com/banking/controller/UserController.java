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
                    return ResponseEntity.ok(
                        new ApiResponse<>(true, "User found", u));
                })
                .orElse(ResponseEntity.ok(
                    new ApiResponse<>(false, "User not found", null)));
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
            @PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.setStatus("BLOCKED");
            userRepository.save(user);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "User blocked", (String) null));
        }).orElse(ResponseEntity.ok(
            new ApiResponse<>(false, "User not found", null)));
    }

    @PutMapping("/unblock/{id}")
    public ResponseEntity<ApiResponse<String>> unblockUser(
            @PathVariable String id) {
        return userRepository.findById(id).map(user -> {
            user.setStatus("ACTIVE");
            userRepository.save(user);
            return ResponseEntity.ok(
                new ApiResponse<>(true, "User unblocked", (String) null));
        }).orElse(ResponseEntity.ok(
            new ApiResponse<>(false, "User not found", null)));
    }
}