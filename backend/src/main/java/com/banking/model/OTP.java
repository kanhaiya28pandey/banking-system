package com.banking.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.LocalDateTime;

@Document(collection = "otps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OTP {
    @Id
    private String id;

    private String userId;

    private String otpCode;

    @Builder.Default
    private String otpType = "TRANSACTION";

    @Builder.Default
    private Boolean isUsed = false;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime expiresAt;

    private LocalDateTime verifiedAt;

    @Builder.Default
    private Integer attemptCount = 0;

    public enum OTPType {
        PASSWORD_RESET, TRANSACTION, LOGIN
    }

    public boolean isExpired() {
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    public boolean isValid() {
        return !isUsed && !isExpired();
    }
}
