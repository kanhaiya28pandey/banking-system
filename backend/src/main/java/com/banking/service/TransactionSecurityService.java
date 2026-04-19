package com.banking.service;

import com.banking.model.*;
import com.banking.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class TransactionSecurityService {
    @Autowired
    private TransactionLimitRepository transactionLimitRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private ApprovalRepository approvalRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private OTPService otpService;

    public static class TransactionSecurityCheck {
        public boolean requiresOTP;
        public boolean requiresApproval;
        public BigDecimal dailyTotal;
        public String message;
    }

    /**
     * Validate transaction security requirements
     */
    public TransactionSecurityCheck validateTransaction(String userId, BigDecimal amount) {
        TransactionSecurityCheck check = new TransactionSecurityCheck();
        check.requiresOTP = false;
        check.requiresApproval = false;
        check.message = "Transaction approved";

        try {
            // Get user and account type
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            // Get transaction limits - use userType (NORMAL or PREMIUM)
            String accountType = user.getUserType() != null ? user.getUserType() : "NORMAL";
            TransactionLimit limit = transactionLimitRepository.findByAccountType(accountType)
                    .orElseThrow(() -> new RuntimeException("Transaction limit not configured for type: " + accountType));

            // Check 1: Per-transaction limit
            if (amount.compareTo(limit.getPerTransactionLimit()) > 0) {
                check.message = "Transaction amount exceeds per-transaction limit of ₹" + limit.getPerTransactionLimit();
                auditLogService.log(userId, "TRANSACTION_REJECTED", "TRANSACTION", null, null, null, "FAILED");
                throw new RuntimeException(check.message);
            }

            // Check 2: Daily limit
            BigDecimal dailyTotal = getDailyTransactionTotal(userId);
            check.dailyTotal = dailyTotal;

            if (dailyTotal.add(amount).compareTo(limit.getDailyLimit()) > 0) {
                check.message = "Transaction would exceed daily limit. Current total: ₹" + dailyTotal +
                        ", Limit: ₹" + limit.getDailyLimit();
                auditLogService.log(userId, "TRANSACTION_REJECTED", "TRANSACTION", null, null, null, "FAILED");
                throw new RuntimeException(check.message);
            }

            // Check 3: OTP requirement
            if (amount.compareTo(limit.getOtpThreshold()) >= 0) {
                check.requiresOTP = true;
                log.info("OTP required for transaction of ₹{} for user {}", amount, userId);
            }

            // Check 4: Manager approval requirement
            if (amount.compareTo(limit.getApprovalThreshold()) >= 0) {
                check.requiresApproval = true;
                check.message = "This transaction requires manager approval";
                log.info("Manager approval required for transaction of ₹{} for user {}", amount, userId);
            }

            auditLogService.log(userId, "TRANSACTION_VALIDATED", "TRANSACTION", null, null, null, "SUCCESS");
            return check;

        } catch (Exception e) {
            log.error("Error validating transaction for user: {}", userId, e);
            check.message = e.getMessage();
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Get total transaction amount for today
     */
    public BigDecimal getDailyTransactionTotal(String userId) {
        try {
            LocalDate today = LocalDate.now();
            LocalDateTime startOfDay = today.atStartOfDay();
            LocalDateTime endOfDay = today.atTime(23, 59, 59);

            // Get transactions - note: this is a simplified approach without complex queries
            List<Transaction> allTransactions = transactionRepository.findAll();

            BigDecimal total = allTransactions.stream()
                    .filter(t -> t.getFromAccount() != null &&
                               t.getDate() != null &&
                               t.getDate().isAfter(startOfDay) &&
                               t.getDate().isBefore(endOfDay) &&
                               !"FAILED".equals(t.getStatus()))
                    .map(t -> t.getAmount() != null ? BigDecimal.valueOf(t.getAmount()) : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            return total;

        } catch (Exception e) {
            log.error("Error getting daily transaction total for user: {}", userId, e);
            return BigDecimal.ZERO;
        }
    }

    /**
     * Create approval request for large transaction
     */
    public Approval createApprovalRequest(String userId, String transactionId,
                                         BigDecimal amount, String managerId) {
        try {
            // Verify users exist
            User requestedBy = userRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            User assignedTo = userRepository.findById(managerId)
                    .orElseThrow(() -> new RuntimeException("Manager not found"));

            LocalDateTime expiresAt = LocalDateTime.now().plusHours(24);

            Approval approval = Approval.builder()
                    .transactionId(transactionId)
                    .requestedBy(Integer.parseInt(userId))  // Store as ID
                    .assignedTo(Integer.parseInt(managerId))  // Store as ID
                    .actionType("LARGE_TRANSFER")
                    .amount(amount)
                    .status("PENDING")
                    .expiresAt(expiresAt)
                    .build();

            approvalRepository.save(approval);

            auditLogService.log(userId, "APPROVAL_REQUESTED", "APPROVAL", approval.getId(),
                    null, null, "SUCCESS");

            log.info("Approval request created for transaction: {}", transactionId);
            return approval;

        } catch (Exception e) {
            log.error("Error creating approval request", e);
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Approve a transaction
     */
    public void approveTransaction(String approvalId, String managerId) {
        try {
            Approval approval = approvalRepository.findById(approvalId)
                    .orElseThrow(() -> new RuntimeException("Approval not found"));

            if (!"PENDING".equals(approval.getStatus())) {
                throw new RuntimeException("Approval is not pending");
            }

            if (approval.getExpiresAt().isBefore(LocalDateTime.now())) {
                approval.setStatus("REJECTED");
                approval.setRejectionReason("Auto-rejected: 24 hour timeout");
                approvalRepository.save(approval);
                throw new RuntimeException("Approval has expired");
            }

            approval.setStatus("APPROVED");
            approval.setReviewedBy(Integer.parseInt(managerId));
            approval.setReviewedAt(LocalDateTime.now());
            approvalRepository.save(approval);

            // Update transaction status
            if (approval.getTransactionId() != null) {
                Transaction transaction = transactionRepository.findById(approval.getTransactionId()).orElse(null);
                if (transaction != null) {
                    transaction.setStatus("APPROVED");
                    transactionRepository.save(transaction);
                }
            }

            auditLogService.log(managerId, "APPROVAL_APPROVED", "APPROVAL", approvalId,
                    null, null, "SUCCESS");

            log.info("Transaction approved by manager: {}", managerId);

        } catch (Exception e) {
            log.error("Error approving transaction", e);
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Reject a transaction
     */
    public void rejectTransaction(String approvalId, String managerId, String reason) {
        try {
            Approval approval = approvalRepository.findById(approvalId)
                    .orElseThrow(() -> new RuntimeException("Approval not found"));

            approval.setStatus("REJECTED");
            approval.setRejectionReason(reason);
            approval.setReviewedBy(Integer.parseInt(managerId));
            approval.setReviewedAt(LocalDateTime.now());
            approvalRepository.save(approval);

            // Update transaction status
            if (approval.getTransactionId() != null) {
                Transaction transaction = transactionRepository.findById(approval.getTransactionId()).orElse(null);
                if (transaction != null) {
                    transaction.setStatus("REJECTED");
                    transactionRepository.save(transaction);
                }
            }

            auditLogService.log(managerId, "APPROVAL_REJECTED", "APPROVAL", approvalId,
                    null, null, "SUCCESS");

            log.info("Transaction rejected by manager: {}", managerId);

        } catch (Exception e) {
            log.error("Error rejecting transaction", e);
            throw new RuntimeException(e.getMessage());
        }
    }

    /**
     * Get pending approvals for a manager
     */
    public List<Approval> getPendingApprovalsForManager(Integer managerId) {
        return approvalRepository.findByStatusAndAssignedTo("PENDING", managerId);
    }
}
