package com.banking.service;

import com.banking.dto.ApiResponse;
import com.banking.model.User;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.util.*;

@Service
public class PasswordResetService {

    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final Map<String, String> otpStore = new HashMap<>();

    public ApiResponse<String> generateOtp(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return new ApiResponse<>(false, "Email not found", null);
        }

        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(email, otp);

        try {
            sendOtpEmail(email, otp, userOpt.get().getName());
            System.out.println("OTP sent to " + email + ": " + otp);
            return new ApiResponse<>(true, "OTP sent to your email", null);
        } catch (Exception e) {
            System.err.println("Email failed: " + e.getMessage());
            // Fallback — return OTP in response for dev
            return new ApiResponse<>(true, "OTP generated (email failed)", otp);
        }
    }

    private void sendOtpEmail(String toEmail, String otp, String name) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject("NexBank — Your OTP for Password Reset");

        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060A12; color: #F0EFEA; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #F5C842, #D4A017); padding: 32px; text-align: center;">
                    <h1 style="margin: 0; color: #060A12; font-size: 28px; letter-spacing: 3px;">🏦 NEXBANK</h1>
                    <p style="margin: 8px 0 0; color: #060A12; font-size: 12px; letter-spacing: 2px;">SECURE BANKING PORTAL</p>
                </div>
                <div style="padding: 40px 32px;">
                    <h2 style="color: #F5C842; margin-top: 0;">Password Reset OTP</h2>
                    <p style="color: #7A8FA6; line-height: 1.6;">Hello <strong style="color: #F0EFEA;">%s</strong>,</p>
                    <p style="color: #7A8FA6; line-height: 1.6;">You requested a password reset for your NexBank account. Use the OTP below:</p>
                    <div style="background: #0D1524; border: 2px solid #F5C842; border-radius: 12px; padding: 24px; text-align: center; margin: 28px 0;">
                        <div style="font-size: 42px; font-weight: 900; color: #F5C842; letter-spacing: 12px; font-family: monospace;">%s</div>
                        <p style="color: #7A8FA6; font-size: 12px; margin: 12px 0 0;">This OTP expires in 10 minutes</p>
                    </div>
                    <p style="color: #7A8FA6; font-size: 13px; line-height: 1.6;">If you did not request this, please ignore this email. Your account is safe.</p>
                    <hr style="border: none; border-top: 1px solid #1A2A40; margin: 28px 0;" />
                    <p style="color: #3A5070; font-size: 12px; text-align: center;">© 2026 NexBank. All rights reserved.</p>
                </div>
            </div>
            """.formatted(name != null ? name : "User", otp);

        helper.setText(html, true);
        mailSender.send(message);
    }

    public ApiResponse<String> resetPassword(String email, String newPassword) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            return new ApiResponse<>(false, "Email not found", null);
        }
        User user = userOpt.get();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        otpStore.remove(email);

        // Send confirmation email
        try { sendConfirmationEmail(email, user.getName()); } catch (Exception ignored) {}

        return new ApiResponse<>(true, "Password reset successfully", null);
    }

    private void sendConfirmationEmail(String toEmail, String name) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail);
        helper.setTo(toEmail);
        helper.setSubject("NexBank — Password Changed Successfully");

        String html = """
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060A12; color: #F0EFEA; border-radius: 16px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #F5C842, #D4A017); padding: 32px; text-align: center;">
                    <h1 style="margin: 0; color: #060A12; font-size: 28px; letter-spacing: 3px;">🏦 NEXBANK</h1>
                </div>
                <div style="padding: 40px 32px; text-align: center;">
                    <div style="font-size: 64px; margin-bottom: 20px;">✅</div>
                    <h2 style="color: #00FFB2; margin-top: 0;">Password Changed!</h2>
                    <p style="color: #7A8FA6; line-height: 1.6;">Hello <strong style="color: #F0EFEA;">%s</strong>, your NexBank password has been changed successfully.</p>
                    <p style="color: #7A8FA6; font-size: 13px;">If you did not make this change, contact support immediately.</p>
                </div>
            </div>
            """.formatted(name != null ? name : "User");

        helper.setText(html, true);
        mailSender.send(message);
    }
}