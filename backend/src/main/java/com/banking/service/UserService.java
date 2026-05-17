package com.banking.service;

import com.banking.model.User;
import com.banking.model.Account;
import com.banking.repository.UserRepository;
import com.banking.repository.AccountRepository;
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

    @Autowired
    private AccountRepository accountRepository;

    @Autowired(required = false)
    private BCryptPasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> {
            // Ensure name field is populated from firstName/lastName if empty
            if ((u.getName() == null || u.getName().isEmpty()) &&
                u.getFirstName() != null && !u.getFirstName().isEmpty()) {
                String fullName = u.getFirstName();
                if (u.getLastName() != null && !u.getLastName().isEmpty()) {
                    fullName += " " + u.getLastName();
                }
                u.setName(fullName);
            }
            u.setPassword(null);
        });
        return users;
    }

    public User getUserById(String id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Ensure name field is populated from firstName/lastName if empty
        if ((user.getName() == null || user.getName().isEmpty()) &&
            user.getFirstName() != null && !user.getFirstName().isEmpty()) {
            String fullName = user.getFirstName();
            if (user.getLastName() != null && !user.getLastName().isEmpty()) {
                fullName += " " + user.getLastName();
            }
            user.setName(fullName);
        }

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

        // Never return passwords and ensure name field is populated
        users.forEach(u -> {
            if ((u.getName() == null || u.getName().isEmpty()) &&
                u.getFirstName() != null && !u.getFirstName().isEmpty()) {
                String fullName = u.getFirstName();
                if (u.getLastName() != null && !u.getLastName().isEmpty()) {
                    fullName += " " + u.getLastName();
                }
                u.setName(fullName);
            }
            u.setPassword(null);
        });
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

        if (updatedUser.getName() != null && !updatedUser.getName().isEmpty()) {
            user.setName(updatedUser.getName());
            // Split name into firstName and lastName
            String[] nameParts = updatedUser.getName().trim().split("\\s+", 2);
            user.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                user.setLastName(nameParts[1]);
            } else {
                user.setLastName("");
            }
            user.setFullName(updatedUser.getName());
        }

        if (updatedUser.getPhone() != null && !updatedUser.getPhone().isEmpty()) {
            user.setPhone(updatedUser.getPhone());
        }

        user.setUpdatedAt(LocalDateTime.now());
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

    // Get all users for employee (all customers with at least one account)
    public List<User> getAllCustomersForEmployee() {
        List<User> customers = userRepository.findByRole("USER");
        // Filter to show only customers who have created accounts
        List<User> customersWithAccounts = customers.stream()
                .filter(u -> {
                    List<?> userAccounts = accountRepository.findByUserId(u.getId());
                    return userAccounts != null && !userAccounts.isEmpty();
                })
                .collect(Collectors.toList());
        customersWithAccounts.forEach(u -> u.setPassword(null));
        return customersWithAccounts;
    }

    // Update user information by employee
    @Transactional
    public User updateUserByEmployee(String userId, User updateData, String employeeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only employees can update customer information
        if (updateData.getFirstName() != null) user.setFirstName(updateData.getFirstName());
        if (updateData.getLastName() != null) user.setLastName(updateData.getLastName());
        if (updateData.getPhone() != null) user.setPhone(updateData.getPhone());
        if (updateData.getAddress() != null) user.setAddress(updateData.getAddress());
        if (updateData.getCity() != null) user.setCity(updateData.getCity());
        if (updateData.getState() != null) user.setState(updateData.getState());
        if (updateData.getPinCode() != null) user.setPinCode(updateData.getPinCode());

        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        saved.setPassword(null);
        return saved;
    }

    // Disable user account (not delete)
    @Transactional
    public User disableUserAccount(String userId, String employeeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountStatus("DISABLED");
        user.setStatus("BLOCKED");
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        saved.setPassword(null);
        return saved;
    }

    // Enable user account
    @Transactional
    public User enableUserAccount(String userId, String employeeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountStatus("VERIFIED");
        user.setStatus("ACTIVE");
        user.setUpdatedAt(LocalDateTime.now());
        User saved = userRepository.save(user);
        saved.setPassword(null);
        return saved;
    }

    // Get pending verification accounts
    public List<User> getPendingVerificationAccounts() {
        List<User> pending = userRepository.findAll().stream()
                .filter(u -> {
                    // Users who completed registration but haven't created any accounts
                    if (!"COMPLETED".equals(u.getRegistrationPhase())) {
                        return false;
                    }
                    // Must have no accounts
                    List<?> userAccounts = accountRepository.findByUserId(u.getId());
                    return userAccounts == null || userAccounts.isEmpty();
                })
                .collect(Collectors.toList());
        pending.forEach(u -> u.setPassword(null));
        return pending;
    }

    // Verify user account by employee
    @Transactional
    public User verifyUserAccount(String userId, String employeeId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setAccountStatus("VERIFIED");
        user.setVerifiedBy(employeeId);
        user.setVerifiedAt(LocalDateTime.now());
        user.setStatus("ACTIVE");
        user.setUpdatedAt(LocalDateTime.now());

        User saved = userRepository.save(user);
        saved.setPassword(null);
        return saved;
    }

    // Get abandoned profiles (incomplete registration - PHASE_1 through PHASE_4)
    public List<User> getAbandonedProfiles() {
        List<User> allUsers = userRepository.findAll();
        List<User> abandoned = allUsers.stream()
                .filter(u -> {
                    // User must have incomplete registration phase (PHASE_1, PHASE_2, PHASE_3, PHASE_4)
                    String phase = u.getRegistrationPhase();
                    if (phase == null || "COMPLETED".equals(phase)) {
                        return false; // Skip null or completed users
                    }
                    if (!phase.startsWith("PHASE_")) {
                        return false; // Only incomplete phases
                    }
                    // User must not have any accounts
                    List<?> userAccounts = accountRepository.findByUserId(u.getId());
                    return userAccounts == null || userAccounts.isEmpty();
                })
                .collect(Collectors.toList());
        abandoned.forEach(u -> u.setPassword(null));
        return abandoned;
    }

    // Delete abandoned profile (only employee/manager)
    @Transactional
    public void deleteAbandonedProfile(String userId, String deletedBy) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user is actually abandoned (incomplete phase and no accounts)
        String phase = user.getRegistrationPhase();
        if (phase == null || "COMPLETED".equals(phase) || !phase.startsWith("PHASE_")) {
            throw new RuntimeException("Only abandoned profiles (with incomplete PHASE) can be deleted");
        }

        List<?> userAccounts = accountRepository.findByUserId(userId);
        if (userAccounts != null && !userAccounts.isEmpty()) {
            throw new RuntimeException("Cannot delete profile with existing accounts");
        }

        // Soft delete by marking as DELETED
        user.setStatus("DELETED");
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    // Update transaction PIN for a specific account
    @Transactional
    public void updateAccountTransactionPin(String accountId, String transactionPin) {
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        account.setTransactionPin(transactionPin);
        accountRepository.save(account);
        System.out.println("✓ Transaction PIN updated for account: " + account.getAccountNumber());
    }
}