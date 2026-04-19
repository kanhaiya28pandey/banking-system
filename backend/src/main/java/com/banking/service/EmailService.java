package com.banking.service;

/**
 * Email service interface for sending emails
 * Implementations can use SMTP, SendGrid, AWS SES, etc.
 */
public interface EmailService {

    /**
     * Send OTP email to user
     * @param email Recipient email address
     * @param otpCode 6-digit OTP code
     * @param validityMinutes How long OTP is valid
     * @return true if email sent successfully
     */
    boolean sendOTP(String email, String otpCode, int validityMinutes);

    /**
     * Send generic email
     * @param email Recipient email
     * @param subject Email subject
     * @param plainText Plain text content
     * @param htmlContent HTML formatted content
     * @return true if email sent successfully
     */
    boolean sendEmail(String email, String subject, String plainText, String htmlContent);

    /**
     * Send notification email
     * @param email Recipient email
     * @param title Notification title
     * @param message Notification message
     * @return true if email sent successfully
     */
    boolean sendNotificationEmail(String email, String title, String message);

    /**
     * Send approval notification
     * @param email Recipient email
     * @param transactionId Transaction ID
     * @param amount Transaction amount
     * @param actionType Approval action type
     * @return true if email sent successfully
     */
    boolean sendApprovalEmail(String email, Integer transactionId, String amount, String actionType);

    /**
     * Send security alert email
     * @param email Recipient email
     * @param alertType Type of security alert
     * @param description Alert description
     * @return true if email sent successfully
     */
    boolean sendSecurityAlertEmail(String email, String alertType, String description);

    /**
     * Send daily report email
     * @param email Admin email
     * @param subject Report subject
     * @param plainText Plain text report
     * @param htmlContent HTML formatted report
     * @return true if email sent successfully
     */
    boolean sendReportEmail(String email, String subject, String plainText, String htmlContent);
}
