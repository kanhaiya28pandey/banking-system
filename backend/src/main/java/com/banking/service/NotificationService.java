package com.banking.service;

import com.banking.model.NotificationLog;
import com.banking.model.NotificationPreference;
import com.banking.model.Transaction;
import com.banking.model.Account;
import com.banking.model.User;
import com.banking.repository.NotificationLogRepository;
import com.banking.repository.NotificationPreferenceRepository;
import com.banking.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class NotificationService {

    @Autowired private NotificationPreferenceRepository prefRepo;
    @Autowired private NotificationLogRepository logRepo;
    @Autowired private UserRepository userRepository;
    @Autowired private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    public void sendTransactionNotification(Transaction tx, Account account, User user) {
        try {
            // Get user's notification preferences
            NotificationPreference pref = getOrCreatePreference(user.getId());

            // Check if notifications are enabled
            if (pref == null || !pref.getEmailNotificationsEnabled()) {
                return;
            }

            // Check transaction alert threshold
            if (pref.getTransactionAlertThreshold() > 0 && tx.getAmount() < pref.getTransactionAlertThreshold()) {
                return;
            }

            // Build email subject and content
            String subject = buildEmailSubject(tx);
            String htmlContent = buildTransactionEmailHtml(tx, user, account);

            // Send email notification
            sendEmailNotification(user.getEmail(), subject, htmlContent, user.getId(), tx.getId());

        } catch (Exception e) {
            System.err.println("Notification failed: " + e.getMessage());
        }
    }

    public NotificationPreference getOrCreatePreference(String userId) {
        Optional<NotificationPreference> existing = prefRepo.findByUserId(userId);
        if (existing.isPresent()) {
            return existing.get();
        }

        NotificationPreference pref = new NotificationPreference();
        pref.setUserId(userId);
        return prefRepo.save(pref);
    }

    public NotificationPreference updatePreference(String userId, NotificationPreference updateData) {
        NotificationPreference pref = getOrCreatePreference(userId);

        if (updateData.getEmailNotificationsEnabled() != null) {
            pref.setEmailNotificationsEnabled(updateData.getEmailNotificationsEnabled());
        }
        if (updateData.getSmsNotificationsEnabled() != null) {
            pref.setSmsNotificationsEnabled(updateData.getSmsNotificationsEnabled());
        }
        if (updateData.getNotificationFrequency() != null) {
            pref.setNotificationFrequency(updateData.getNotificationFrequency());
        }
        if (updateData.getTransactionAlertThreshold() != null) {
            pref.setTransactionAlertThreshold(updateData.getTransactionAlertThreshold());
        }

        pref.setUpdatedAt(LocalDateTime.now());
        return prefRepo.save(pref);
    }

    private String buildEmailSubject(Transaction tx) {
        if ("CREDIT".equals(tx.getType())) {
            return "NexBank — ₹" + String.format("%.2f", tx.getAmount()) + " Credited";
        } else if ("DEBIT".equals(tx.getType())) {
            return "NexBank — ₹" + String.format("%.2f", tx.getAmount()) + " Debited";
        } else {
            return "NexBank — Transfer of ₹" + String.format("%.2f", tx.getAmount());
        }
    }

    private String buildTransactionEmailHtml(Transaction tx, User user, Account account) {
        String typeIcon = "CREDIT".equals(tx.getType()) ? "↓" : "DEBIT".equals(tx.getType()) ? "↑" : "⇄";
        String typeColor = "CREDIT".equals(tx.getType()) ? "#00FFB2" : "DEBIT".equals(tx.getType()) ? "#FF4D6D" : "#3B9EFF";
        String statusIcon = "SUCCESS".equals(tx.getStatus()) ? "✓" : "✗";
        String statusColor = "SUCCESS".equals(tx.getStatus()) ? "#00FFB2" : "#FF4D6D";
        String typeLabel = "CREDIT".equals(tx.getType()) ? "Amount Credited" : "DEBIT".equals(tx.getType()) ? "Amount Debited" : "Transfer Completed";
        String txId = tx.getId().substring(0, Math.min(12, tx.getId().length()));
        String amount = String.format("%.2f", tx.getAmount());

        return "<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #060A12; color: #F0EFEA; border-radius: 16px; overflow: hidden;\">" +
               "<div style=\"background: linear-gradient(135deg, #F5C842, #D4A017); padding: 32px; text-align: center;\">" +
               "<h1 style=\"margin: 0; color: #060A12; font-size: 28px; letter-spacing: 3px;\">🏦 NEXBANK</h1>" +
               "<p style=\"margin: 8px 0 0; color: #060A12; font-size: 12px; letter-spacing: 2px;\">TRANSACTION ALERT</p>" +
               "</div>" +
               "<div style=\"padding: 40px 32px;\">" +
               "<h2 style=\"color: " + typeColor + "; margin-top: 0; font-size: 24px;\">" + typeIcon + " " + typeLabel + "</h2>" +
               "<div style=\"background: #0D1524; border: 2px solid " + typeColor + "; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;\">" +
               "<div style=\"font-size: 44px; font-weight: 900; color: " + typeColor + "; letter-spacing: -2px;\">₹" + amount + "</div>" +
               "</div>" +
               "<div style=\"background: rgba(255,255,255,0.02); border-radius: 12px; padding: 20px; margin: 20px 0;\">" +
               "<div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 16px;\">" +
               "<div>" +
               "<p style=\"color: #7A8FA6; font-size: 12px; margin: 0 0 6px;\">Transaction Type</p>" +
               "<p style=\"color: #F0EFEA; font-size: 14px; font-weight: 700; margin: 0;\">" + tx.getType() + "</p>" +
               "</div>" +
               "<div>" +
               "<p style=\"color: #7A8FA6; font-size: 12px; margin: 0 0 6px;\">Status</p>" +
               "<p style=\"color: " + statusColor + "; font-size: 14px; font-weight: 700; margin: 0;\">" + statusIcon + " " + tx.getStatus() + "</p>" +
               "</div>" +
               "<div>" +
               "<p style=\"color: #7A8FA6; font-size: 12px; margin: 0 0 6px;\">Date & Time</p>" +
               "<p style=\"color: #F0EFEA; font-size: 14px; margin: 0;\">" + tx.getDate().toString() + "</p>" +
               "</div>" +
               "<div>" +
               "<p style=\"color: #7A8FA6; font-size: 12px; margin: 0 0 6px;\">Reference</p>" +
               "<p style=\"color: #F0EFEA; font-size: 13px; margin: 0; font-family: monospace;\">" + txId + "</p>" +
               "</div>" +
               "</div>" +
               "</div>" +
               "<p style=\"color: #7A8FA6; line-height: 1.6; font-size: 13px;\">If you did not authorize this transaction, contact support immediately.</p>" +
               "<hr style=\"border: none; border-top: 1px solid #1A2A40; margin: 28px 0;\" />" +
               "<p style=\"color: #3A5070; font-size: 12px; text-align: center;\">© 2026 NexBank. All rights reserved.</p>" +
               "</div>" +
               "</div>";
    }

    private void sendEmailNotification(String toEmail, String subject, String htmlContent, String userId, String transactionId) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            // Log successful notification
            NotificationLog log = new NotificationLog();
            log.setUserId(userId);
            log.setTransactionId(transactionId);
            log.setNotificationType("EMAIL");
            log.setRecipientAddress(toEmail);
            log.setSubject(subject);
            log.setStatus("SENT");
            log.setSentAt(LocalDateTime.now());
            logRepo.save(log);

        } catch (Exception e) {
            // Log failed notification
            NotificationLog log = new NotificationLog();
            log.setUserId(userId);
            log.setTransactionId(transactionId);
            log.setNotificationType("EMAIL");
            log.setRecipientAddress(toEmail);
            log.setSubject(subject);
            log.setStatus("FAILED");
            log.setErrorMessage(e.getMessage());
            log.setSentAt(LocalDateTime.now());
            logRepo.save(log);
        }
    }

    public java.util.List<NotificationLog> getUserNotificationLogs(String userId) {
        return logRepo.findByUserIdOrderBySentAtDesc(userId);
    }
}
