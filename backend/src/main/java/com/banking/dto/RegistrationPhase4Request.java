package com.banking.dto;

import lombok.Data;

@Data
public class RegistrationPhase4Request {
    private String password;
    private String confirmPassword;
    private String transactionPin;
    private String confirmTransactionPin;
}
