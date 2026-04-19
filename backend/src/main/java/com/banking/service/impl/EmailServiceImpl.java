package com.banking.service.impl;

import com.banking.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Mock/Console Email Service Implementation
 * For development and testing purposes
 * Replace with actual SMTP or cloud service (SendGrid, AWS SES) in production
 */
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Override
    public boolean sendOTP(String email, String otpCode, int validityMinutes) {
        try {
            log.info("📧 [OTP EMAIL] Sending OTP to: {}", email);
            log.info("   OTP Code: {}", otpCode);
            log.info("   Valid for: {} minutes", validityMinutes);

            // TODO: Implement actual email sending
            // For now, just log to console
            System.out.println("\n=== OTP EMAIL ===");
            System.out.println("To: " + email);
            System.out.println("Subject: Your OTP Code");
            System.out.println("Body:");
            System.out.println("Your OTP code is: " + otpCode);
            System.out.println("Valid for: " + validityMinutes + " minutes");
            System.out.println("==================\n");

            return true;
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendEmail(String email, String subject, String plainText, String htmlContent) {
        try {
            log.info("📧 [EMAIL] Sending email to: {}, Subject: {}", email, subject);

            System.out.println("\n=== EMAIL ===");
            System.out.println("To: " + email);
            System.out.println("Subject: " + subject);
            System.out.println("Content: " + plainText);
            System.out.println("==============\n");

            return true;
        } catch (Exception e) {
            log.error("Failed to send email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendNotificationEmail(String email, String title, String message) {
        try {
            log.info("📧 [NOTIFICATION] Sending to: {}, Title: {}", email, title);

            System.out.println("\n=== NOTIFICATION EMAIL ===");
            System.out.println("To: " + email);
            System.out.println("Title: " + title);
            System.out.println("Message: " + message);
            System.out.println("===========================\n");

            return true;
        } catch (Exception e) {
            log.error("Failed to send notification email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendApprovalEmail(String email, Integer transactionId, String amount, String actionType) {
        try {
            log.info("📧 [APPROVAL] Sending to: {}, Transaction ID: {}, Amount: {}", email, transactionId, amount);

            System.out.println("\n=== APPROVAL EMAIL ===");
            System.out.println("To: " + email);
            System.out.println("Transaction ID: " + transactionId);
            System.out.println("Amount: " + amount);
            System.out.println("Action: " + actionType);
            System.out.println("=======================\n");

            return true;
        } catch (Exception e) {
            log.error("Failed to send approval email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendSecurityAlertEmail(String email, String alertType, String description) {
        try {
            log.warn("🚨 [SECURITY ALERT] Sending to: {}, Alert Type: {}", email, alertType);

            System.out.println("\n=== SECURITY ALERT EMAIL ===");
            System.out.println("To: " + email);
            System.out.println("Alert Type: " + alertType);
            System.out.println("Description: " + description);
            System.out.println("=============================\n");

            return true;
        } catch (Exception e) {
            log.error("Failed to send security alert email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendReportEmail(String email, String subject, String plainText, String htmlContent) {
        try {
            log.info("📧 [REPORT] Sending to: {}, Subject: {}", email, subject);

            System.out.println("\n=== REPORT EMAIL ===");
            System.out.println("To: " + email);
            System.out.println("Subject: " + subject);
            System.out.println("Report:\n" + plainText);
            System.out.println("====================\n");

            return true;
        } catch (Exception e) {
            log.error("Failed to send report email to {}", email, e);
            return false;
        }
    }
}
