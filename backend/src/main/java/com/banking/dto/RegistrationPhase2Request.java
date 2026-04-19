package com.banking.dto;

import lombok.Data;

@Data
public class RegistrationPhase2Request {
    // KYC Information
    private String religion;           // Hindu, Muslim, Sikh, Christian, Other
    private String category;           // General, OBC, SC, ST, Other
    private String incomeRange;        // <1L, 1L-5L, 5L-10L, >10L
    private String educationalQualification;
    private String educationOtherDetails;
    private String occupation;
    private String occupationOtherDetails;

    // Important Fields
    private String panNumber;
    private String aadhaarNumber;

    // Options
    private Boolean seniorCitizen;
    private Boolean existingAccountHolder;
}
