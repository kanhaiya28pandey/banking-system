package com.banking.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class RegistrationPhase1Request {
    // Personal Details
    private String firstName;
    private String middleName;
    private String lastName;
    private String fathersName;
    private String gender;  // Male, Female, Other
    private LocalDate dateOfBirth;
    private String phone;  // Phone number

    // Address
    private String address;
    private String city;
    private String state;
    private String pinCode;
}
