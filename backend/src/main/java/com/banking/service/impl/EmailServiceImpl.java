package com.banking.service.impl;

import com.banking.service.EmailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

/**
 * Real SMTP Email Service Implementation
 * Uses Gmail SMTP for actual email delivery
 */
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Override
    public boolean sendOTP(String email, String otpCode, int validityMinutes) {
        try {
            log.info("📧 [OTP EMAIL] Sending OTP to: {}", email);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("🔐 Your One-Time Password (OTP) - NexBank");

            String htmlContent = buildOTPEmailTemplate(otpCode, validityMinutes);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ OTP email sent successfully to: {}", email);
            return true;

        } catch (MessagingException e) {
            log.error("❌ Failed to send OTP email to {}", email, e);
            return false;
        } catch (Exception e) {
            log.error("❌ Unexpected error sending OTP email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendEmail(String email, String subject, String plainText, String htmlContent) {
        try {
            log.info("📧 [EMAIL] Sending email to: {}, Subject: {}", email, subject);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(htmlContent != null ? htmlContent : plainText, htmlContent != null);

            mailSender.send(message);
            log.info("✅ Email sent successfully to: {}", email);
            return true;

        } catch (MessagingException e) {
            log.error("❌ Failed to send email to {}", email, e);
            return false;
        } catch (Exception e) {
            log.error("❌ Unexpected error sending email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendNotificationEmail(String email, String title, String message) {
        try {
            log.info("📧 [NOTIFICATION] Sending to: {}, Title: {}", email, title);

            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("🔔 " + title + " - NexBank");

            String htmlContent = buildNotificationEmailTemplate(title, message);
            helper.setText(htmlContent, true);

            mailSender.send(mimeMessage);
            log.info("✅ Notification email sent successfully to: {}", email);
            return true;

        } catch (MessagingException e) {
            log.error("❌ Failed to send notification email to {}", email, e);
            return false;
        } catch (Exception e) {
            log.error("❌ Unexpected error sending notification email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendApprovalEmail(String email, Integer transactionId, String amount, String actionType) {
        try {
            log.info("📧 [APPROVAL] Sending to: {}, Transaction ID: {}, Amount: {}", email, transactionId, amount);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("💼 Transaction Approval Request - NexBank");

            String htmlContent = buildApprovalEmailTemplate(transactionId, amount, actionType);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Approval email sent successfully to: {}", email);
            return true;

        } catch (MessagingException e) {
            log.error("❌ Failed to send approval email to {}", email, e);
            return false;
        } catch (Exception e) {
            log.error("❌ Unexpected error sending approval email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendSecurityAlertEmail(String email, String alertType, String description) {
        try {
            log.warn("🚨 [SECURITY ALERT] Sending to: {}, Alert Type: {}", email, alertType);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject("🚨 Security Alert - " + alertType + " - NexBank");

            String htmlContent = buildSecurityAlertEmailTemplate(alertType, description);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("✅ Security alert email sent successfully to: {}", email);
            return true;

        } catch (MessagingException e) {
            log.error("❌ Failed to send security alert email to {}", email, e);
            return false;
        } catch (Exception e) {
            log.error("❌ Unexpected error sending security alert email to {}", email, e);
            return false;
        }
    }

    @Override
    public boolean sendReportEmail(String email, String subject, String plainText, String htmlContent) {
        try {
            log.info("📧 [REPORT] Sending to: {}, Subject: {}", email, subject);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(email);
            helper.setSubject(subject);
            helper.setText(htmlContent != null ? htmlContent : plainText, htmlContent != null);

            mailSender.send(message);
            log.info("✅ Report email sent successfully to: {}", email);
            return true;

        } catch (MessagingException e) {
            log.error("❌ Failed to send report email to {}", email, e);
            return false;
        } catch (Exception e) {
            log.error("❌ Unexpected error sending report email to {}", email, e);
            return false;
        }
    }

    // ==================== EMAIL TEMPLATES ====================

    private String buildOTPEmailTemplate(String otpCode, int validityMinutes) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<style>" +
               "body { font-family: Arial, sans-serif; background-color: #f5f5f5; }" +
               ".container { max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }" +
               ".header { color: #d4af37; text-align: center; margin-bottom: 20px; }" +
               ".content { color: #333; line-height: 1.6; }" +
               ".otp-box { background-color: #f0f0f0; padding: 20px; text-align: center; margin: 20px 0; border-radius: 4px; border-left: 4px solid #d4af37; }" +
               ".otp-code { font-size: 32px; font-weight: bold; color: #d4af37; letter-spacing: 5px; }" +
               ".validity { color: #e74c3c; font-weight: bold; }" +
               ".footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; }" +
               ".warning { color: #e74c3c; font-size: 12px; margin-top: 15px; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "<div class='container'>" +
               "<div class='header'><h2>🏦 NexBank</h2></div>" +
               "<div class='content'>" +
               "<p>Dear Customer,</p>" +
               "<p>You have requested a One-Time Password (OTP) for your account security verification.</p>" +
               "<div class='otp-box'>" +
               "<p style='margin: 0 0 10px 0; color: #666;'>Your OTP Code is:</p>" +
               "<div class='otp-code'>" + otpCode + "</div>" +
               "<p style='margin: 10px 0 0 0; color: #666;'>Valid for <span class='validity'>" + validityMinutes + " minutes</span></p>" +
               "</div>" +
               "<p><strong>Do not share this OTP with anyone.</strong></p>" +
               "<div class='warning'>" +
               "<p>⚠️ Never share your OTP or password with anyone, including NexBank staff or anyone claiming to represent us.</p>" +
               "</div>" +
               "<p>If you did not request this OTP, please ignore this email.</p>" +
               "</div>" +
               "<div class='footer'>" +
               "<p>This is an automated email. Please do not reply to this message.</p>" +
               "<p>&copy; 2026 NexBank. All rights reserved.</p>" +
               "</div>" +
               "</div>" +
               "</body>" +
               "</html>";
    }

    private String buildNotificationEmailTemplate(String title, String message) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<style>" +
               "body { font-family: Arial, sans-serif; background-color: #f5f5f5; }" +
               ".container { max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }" +
               ".header { color: #d4af37; text-align: center; margin-bottom: 20px; }" +
               ".title { font-size: 18px; font-weight: bold; color: #d4af37; margin-bottom: 15px; }" +
               ".message { color: #333; line-height: 1.6; }" +
               ".footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "<div class='container'>" +
               "<div class='header'><h2>🏦 NexBank</h2></div>" +
               "<div class='title'>" + title + "</div>" +
               "<div class='message'>" +
               "<p>" + message + "</p>" +
               "</div>" +
               "<div class='footer'>" +
               "<p>&copy; 2026 NexBank. All rights reserved.</p>" +
               "</div>" +
               "</div>" +
               "</body>" +
               "</html>";
    }

    private String buildApprovalEmailTemplate(Integer transactionId, String amount, String actionType) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<style>" +
               "body { font-family: Arial, sans-serif; background-color: #f5f5f5; }" +
               ".container { max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }" +
               ".header { color: #d4af37; text-align: center; margin-bottom: 20px; }" +
               ".info-box { background-color: #f9f9f9; padding: 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid #d4af37; }" +
               ".label { color: #666; font-size: 12px; }" +
               ".value { color: #333; font-size: 16px; font-weight: bold; }" +
               ".footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "<div class='container'>" +
               "<div class='header'><h2>🏦 NexBank</h2></div>" +
               "<p>A transaction requires your approval:</p>" +
               "<div class='info-box'>" +
               "<div><span class='label'>Transaction ID:</span> <span class='value'>" + transactionId + "</span></div>" +
               "<div style='margin-top: 10px;'><span class='label'>Amount:</span> <span class='value'>" + amount + "</span></div>" +
               "<div style='margin-top: 10px;'><span class='label'>Action:</span> <span class='value'>" + actionType + "</span></div>" +
               "</div>" +
               "<p>Please log in to your account to review and approve this transaction.</p>" +
               "<div class='footer'>" +
               "<p>&copy; 2026 NexBank. All rights reserved.</p>" +
               "</div>" +
               "</div>" +
               "</body>" +
               "</html>";
    }

    private String buildSecurityAlertEmailTemplate(String alertType, String description) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<style>" +
               "body { font-family: Arial, sans-serif; background-color: #f5f5f5; }" +
               ".container { max-width: 600px; margin: 20px auto; background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }" +
               ".header { color: #d4af37; text-align: center; margin-bottom: 20px; }" +
               ".alert { background-color: #ffe6e6; padding: 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid #e74c3c; color: #c0392b; }" +
               ".footer { color: #999; font-size: 12px; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; text-align: center; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "<div class='container'>" +
               "<div class='header'><h2>🏦 NexBank</h2></div>" +
               "<div class='alert'>" +
               "<p><strong>🚨 Security Alert: " + alertType + "</strong></p>" +
               "<p>" + description + "</p>" +
               "</div>" +
               "<p>If this was not you, please contact our customer support immediately.</p>" +
               "<div class='footer'>" +
               "<p>&copy; 2026 NexBank. All rights reserved.</p>" +
               "</div>" +
               "</div>" +
               "</body>" +
               "</html>";
    }
}
