package com.banking.dto;

import lombok.Data;

@Data
public class RegistrationPhase5Request {
    private String email;
    private String otpCode;
}
