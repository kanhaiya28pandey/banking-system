package com.banking.dto;

import lombok.Data;

@Data
public class RegistrationPhase3Request {
    // Account Details
    private String accountType;  // SAVING, CURRENT, FIXED_DEPOSIT, RECURRING_DEPOSIT

    // Services Required
    private Boolean atmCard;
    private Boolean internetBanking;
    private Boolean mobileBanking;
    private Boolean emailAlerts;
    private Boolean chequeBook;
    private Boolean eStatement;

    // Initial Deposit (>= 1000)
    private Double initialDeposit;
}
