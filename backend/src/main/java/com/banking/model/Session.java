package com.banking.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session {
    @Id
    private String id;

    private String userId;

    private String ipAddress;

    private String deviceInfo;

    private String userAgent;

    @Builder.Default
    private Boolean isActive = true;

    private LocalDateTime lastActivity;

    @Builder.Default
    private LocalDateTime loginAt = LocalDateTime.now();

    private LocalDateTime logoutAt;

    public void logout() {
        this.isActive = false;
        this.logoutAt = LocalDateTime.now();
    }

    public void updateActivity() {
        this.lastActivity = LocalDateTime.now();
    }
}
