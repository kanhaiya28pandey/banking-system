package com.banking.service;

import com.banking.model.User;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired(required = false)
    private BCryptPasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    public User getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(null);
        return user;
    }

    // Get users based on requester's role
    public List<User> getUsersByRole(String requesterId, String requesterRole) {
        List<User> users;

        if ("ADMIN".equals(requesterRole)) {
            // Admin sees all users
            users = userRepository.findAll();
        } else if ("MANAGER".equals(requesterRole)) {
            // Manager sees all regular users and employees
            users = userRepository.findAll().stream()
                    .filter(u -> "USER".equals(u.getRole()) || "EMPLOYEE".equals(u.getRole()))
                    .collect(Collectors.toList());
        } else if ("EMPLOYEE".equals(requesterRole)) {
            // Employee sees only regular users (customers)
            users = userRepository.findByRole("USER");
        } else {
            // Regular user only sees their own profile
            users = userRepository.findById(requesterId)
                    .map(List::of)
                    .orElse(List.of());
        }

        // Never return passwords
        users.forEach(u -> u.setPassword(null));
        return users;
    }

    // Find users by role
    public List<User> findByRole(String role) {
        return userRepository.findByRole(role);
    }

    @Transactional
    public User updateUser(String id, User updatedUser) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (updatedUser.getName() != null)
            user.setName(updatedUser.getName());
        if (updatedUser.getPhone() != null)
            user.setPhone(updatedUser.getPhone());
        if (updatedUser.getTransactionPin() != null)
            user.setTransactionPin(updatedUser.getTransactionPin());

        User saved = userRepository.save(user);

        // Don't send sensitive data back
        saved.setPassword(null);
        saved.setTransactionPin(null);
        return saved;
    }

    // Check if user can edit another user
    public boolean canEditUser(String editorId, String editorRole, String targetUserId) {
        if ("ADMIN".equals(editorRole)) {
            return true; // Admin can edit anyone
        }

        if ("MANAGER".equals(editorRole)) {
            User targetUser = userRepository.findById(targetUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            // Manager can edit users and employees
            return "USER".equals(targetUser.getRole()) || "EMPLOYEE".equals(targetUser.getRole());
        }

        if ("EMPLOYEE".equals(editorRole)) {
            User targetUser = userRepository.findById(targetUserId)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            // Employee can only edit regular users (limited fields)
            return "USER".equals(targetUser.getRole());
        }

        // User can only edit their own profile
        return editorId.equals(targetUserId);
    }

    // Check if user can delete another user
    public boolean canDeleteUser(String deleterRole) {
        return "ADMIN".equals(deleterRole);
    }

    // Soft delete user (only Admin)
    @Transactional
    public User softDeleteUser(String userId, String deleterRole) {
        if (!canDeleteUser(deleterRole)) {
            throw new RuntimeException("Only Admin can delete users");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setStatus("BLOCKED");
        return userRepository.save(user);
    }

    // Create Manager (only Admin can create)
    @Transactional
    public User createManager(String creatorId, String creatorRole, User managerData) {
        // Verify creator is ADMIN
        if (!"ADMIN".equals(creatorRole)) {
            throw new RuntimeException("Only ADMIN can create managers");
        }

        // Check if user with this email already exists
        if (userRepository.findByEmail(managerData.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Check if username already exists
        if (userRepository.findByUsername(managerData.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Create new manager
        User manager = new User();
        manager.setUsername(managerData.getUsername());
        manager.setEmail(managerData.getEmail());
        manager.setFirstName(managerData.getFirstName());
        manager.setLastName(managerData.getLastName());
        manager.setPhone(managerData.getPhone());
        manager.setBranch(managerData.getBranch());

        // Encrypt password
        if (passwordEncoder != null) {
            manager.setPassword(passwordEncoder.encode(managerData.getPassword()));
        } else {
            // Fallback if BCrypt not available
            manager.setPassword(managerData.getPassword());
        }

        manager.setRole("MANAGER");
        manager.setStatus("ACTIVE");
        manager.setCreatedAt(LocalDateTime.now());
        manager.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(manager);
        saved.setPassword(null);
        return saved;
    }

    // Create Employee (only Manager can create)
    @Transactional
    public User createEmployee(String creatorId, String creatorRole, User employeeData) {
        // Verify creator is MANAGER
        if (!"MANAGER".equals(creatorRole)) {
            throw new RuntimeException("Only MANAGER can create employees");
        }

        // Check if user with this email already exists
        if (userRepository.findByEmail(employeeData.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        // Check if username already exists
        if (userRepository.findByUsername(employeeData.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        // Get manager's branch
        User manager = userRepository.findById(creatorId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        // Create new employee
        User employee = new User();
        employee.setUsername(employeeData.getUsername());
        employee.setEmail(employeeData.getEmail());
        employee.setFirstName(employeeData.getFirstName());
        employee.setLastName(employeeData.getLastName());
        employee.setPhone(employeeData.getPhone());
        employee.setBranch(manager.getBranch()); // Same branch as manager

        // Encrypt password
        if (passwordEncoder != null) {
            employee.setPassword(passwordEncoder.encode(employeeData.getPassword()));
        } else {
            employee.setPassword(employeeData.getPassword());
        }

        employee.setRole("EMPLOYEE");
        employee.setStatus("ACTIVE");
        employee.setCreatedAt(LocalDateTime.now());
        employee.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(employee);
        saved.setPassword(null);
        return saved;
    }
}