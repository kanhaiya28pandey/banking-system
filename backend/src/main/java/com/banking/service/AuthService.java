package com.banking.service;

import com.banking.dto.ApiResponse;
import com.banking.dto.LoginRequest;
import com.banking.dto.RegisterRequest;
import com.banking.dto.SimpleRegistrationRequest;
import com.banking.model.User;
import com.banking.repository.UserRepository;
import com.banking.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private AuthenticationManager authManager;

    /**
     * Simple registration - just email and password
     * User can login but cannot do transactions until they create an account
     */
    public ApiResponse<User> simpleRegister(SimpleRegistrationRequest req) {
        // Validate input
        if (req.getEmail() == null || req.getEmail().trim().isEmpty()) {
            return new ApiResponse<>(false, "Email is required", null);
        }
        if (req.getPassword() == null || req.getPassword().length() < 8) {
            return new ApiResponse<>(false, "Password must be at least 8 characters", null);
        }
        if (!req.getPassword().equals(req.getConfirmPassword())) {
            return new ApiResponse<>(false, "Passwords do not match", null);
        }
        if (!isStrongPassword(req.getPassword())) {
            return new ApiResponse<>(false,
                "Password must contain at least one uppercase, one lowercase, and one digit", null);
        }

        // Check if email already exists
        if (userRepository.existsByEmail(req.getEmail())) {
            return new ApiResponse<>(false, "Email already registered. Please login.", null);
        }

        // Create new user with just email and password
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setStatus("ACTIVE");
        user.setRole("USER");
        user.setRegistrationPhase("REGISTERED");  // Just registered, no KYC yet
        user.setRegistrationStartedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);
        savedUser.setPassword(null);  // Don't return password

        return new ApiResponse<>(true,
            "✅ Registration successful! Please login and create your account.", savedUser);
    }

    public ApiResponse<String> register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return new ApiResponse<>(false, "Email already exists", null);
        }
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setPhone(req.getPhone());
        user.setRole(req.getRole() != null ? req.getRole() : "USER");
        user.setStatus("ACTIVE");
        user.setUserType("NORMAL");
        userRepository.save(user);
        return new ApiResponse<>(true, "Registered successfully", null);
    }

    public ApiResponse<String> login(LoginRequest req) {
        try {
            authManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                    req.getEmail(), req.getPassword()));
            User user = userRepository.findByEmail(req.getEmail())
                    .orElseThrow();
            if ("BLOCKED".equals(user.getStatus())) {
                return new ApiResponse<>(false, "Account is blocked", null);
            }
            String token = tokenProvider.generateToken(
                user.getEmail(), user.getRole());
            return new ApiResponse<>(true, "Login successful", token);
        } catch (BadCredentialsException e) {
            return new ApiResponse<>(false, "Invalid credentials", null);
        }
    }

    private boolean isStrongPassword(String password) {
        // At least one uppercase, one lowercase, one digit
        return password.matches(".*[A-Z].*") &&
               password.matches(".*[a-z].*") &&
               password.matches(".*\\d.*");
    }
}
