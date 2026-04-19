package com.banking.service;

import com.banking.model.AuditLog;
import com.banking.model.User;
import com.banking.repository.AuditLogRepository;
import com.banking.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;

@Service
@Slf4j
public class AuditLogService {
    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private UserRepository userRepository;

    private ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Log an action with full details
     */
    public void log(String userId, String action, String entityType, String entityId,
                    Object oldValue, Object newValue, String status) {
        try {
            String ipAddress = getClientIP();
            String userAgent = getUserAgent();

            AuditLog auditLog = AuditLog.builder()
                    .userId(userId)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .oldValue(oldValue != null ? objectMapper.valueToTree(oldValue) : null)
                    .newValue(newValue != null ? objectMapper.valueToTree(newValue) : null)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .status(status)
                    .build();

            auditLogRepository.save(auditLog);
            log.debug("Audit log saved: Action={}, EntityType={}, Status={}", action, entityType, status);

        } catch (Exception e) {
            log.error("Error saving audit log", e);
        }
    }

    /**
     * Log an action without old/new values
     */
    public void log(String userId, String action, String status) {
        log(userId, action, null, null, null, null, status);
    }

    /**
     * Get client IP address from request
     */
    private String getClientIP() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String ip = request.getHeader("X-Forwarded-For");
                if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
                    ip = request.getRemoteAddr();
                }
                return ip;
            }
        } catch (Exception e) {
            log.debug("Could not get client IP", e);
        }
        return "UNKNOWN";
    }

    /**
     * Get user agent from request
     */
    private String getUserAgent() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                return request.getHeader("User-Agent");
            }
        } catch (Exception e) {
            log.debug("Could not get user agent", e);
        }
        return "UNKNOWN";
    }
}
