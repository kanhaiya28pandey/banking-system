package com.banking.service;

import com.banking.dto.ApiResponse;
import com.banking.dto.LoginRequest;
import com.banking.dto.RegisterRequest;
import com.banking.model.User;
import com.banking.repository.UserRepository;
import com.banking.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtTokenProvider tokenProvider;
    @Autowired private AuthenticationManager authManager;

    public ApiResponse<String> register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            return new ApiResponse<>(false, "Email already exists", null);
        }
        User user = new User();
        user.setName(req.getName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        user.setPhone(req.getPhone());
        user.setRole(req.getRole() != null ? req.getRole() : "CUSTOMER");
        user.setStatus("ACTIVE");
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
}