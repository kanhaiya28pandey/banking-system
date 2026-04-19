package com.banking.service;

import com.banking.dto.*;
import com.banking.model.User;
import com.banking.model.OTP;
import com.banking.model.Account;
import com.banking.repository.UserRepository;
import com.banking.repository.OTPRepository;
import com.banking.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.regex.Pattern;

@Service
public class RegistrationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OTPRepository otpRepository;

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OTPService otpService;

    private static final Double MINIMUM_DEPOSIT = 1000.0;

    // ============ PHASE 1: PERSONAL DETAILS ============
    public User submitPhase1(String email, RegistrationPhase1Request phase1) {
        // Check if email already exists
        var existingUser = userRepository.findByEmail(email);
        if (existingUser.isPresent()) {
            User user = existingUser.get();
            String phase = user.getRegistrationPhase();

            // If user has progressed beyond Phase 1 (Phase 2+), they continue from their current phase
            // If Phase is null or PHASE_1 or PHASE_2, they can update Phase 1 data and continue
            // This allows users to either continue registration or update their details

            // Update Phase 1 data for the existing user
            user.setFirstName(phase1.getFirstName());
            user.setMiddleName(phase1.getMiddleName());
            user.setLastName(phase1.getLastName());
            user.setFullName(phase1.getFirstName() + " " + phase1.getLastName());
            user.setFathersName(phase1.getFathersName());
            user.setGender(phase1.getGender());
            user.setDateOfBirth(phase1.getDateOfBirth());
            user.setAddress(phase1.getAddress());
            user.setCity(phase1.getCity());
            user.setState(phase1.getState());
            user.setPinCode(phase1.getPinCode());

            // Always set to PHASE_1 when Phase 1 is submitted
            user.setRegistrationPhase("PHASE_1");
            if (phase == null) {
                user.setRegistrationStartedAt(LocalDateTime.now());
                user.setStatus("ACTIVE");
                user.setRole("USER");
            }

            return userRepository.save(user);
        }

        // Validate all fields
        if (phase1.getFirstName() == null || phase1.getFirstName().trim().isEmpty()) {
            throw new RuntimeException("First name is required");
        }
        if (phase1.getLastName() == null || phase1.getLastName().trim().isEmpty()) {
            throw new RuntimeException("Last name is required");
        }
        if (phase1.getFathersName() == null || phase1.getFathersName().trim().isEmpty()) {
            throw new RuntimeException("Father's name is required");
        }
        if (phase1.getGender() == null || !phase1.getGender().matches("Male|Female|Other")) {
            throw new RuntimeException("Valid gender selection required");
        }
        if (phase1.getDateOfBirth() == null || phase1.getDateOfBirth().isAfter(LocalDate.now())) {
            throw new RuntimeException("Valid date of birth required");
        }
        if (phase1.getAddress() == null || phase1.getAddress().trim().isEmpty()) {
            throw new RuntimeException("Address is required");
        }
        if (phase1.getCity() == null || phase1.getCity().trim().isEmpty()) {
            throw new RuntimeException("City is required");
        }
        if (phase1.getState() == null || phase1.getState().trim().isEmpty()) {
            throw new RuntimeException("State is required");
        }
        if (phase1.getPinCode() == null || !phase1.getPinCode().matches("\\d{6}")) {
            throw new RuntimeException("Valid 6-digit pin code required");
        }

        // Create user in PHASE_1 status
        User user = new User();
        user.setEmail(email);
        user.setFirstName(phase1.getFirstName());
        user.setMiddleName(phase1.getMiddleName());
        user.setLastName(phase1.getLastName());
        user.setFullName(phase1.getFirstName() + " " + phase1.getLastName());
        user.setFathersName(phase1.getFathersName());
        user.setGender(phase1.getGender());
        user.setDateOfBirth(phase1.getDateOfBirth());
        user.setAddress(phase1.getAddress());
        user.setCity(phase1.getCity());
        user.setState(phase1.getState());
        user.setPinCode(phase1.getPinCode());
        user.setRegistrationPhase("PHASE_1");
        user.setRegistrationStartedAt(LocalDateTime.now());
        user.setStatus("ACTIVE");
        user.setRole("USER");

        return userRepository.save(user);
    }

    // ============ PHASE 2: KYC INFORMATION ============
    public User submitPhase2(String email, RegistrationPhase2Request phase2) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User registration not found"));

        // If user already completed registration, allow account creation flow to continue
        if ("COMPLETED".equals(user.getRegistrationPhase())) {
            return user;
        }

        if (!"PHASE_1".equals(user.getRegistrationPhase())) {
            throw new RuntimeException("Please complete Phase 1 first");
        }

        // Validate fields
        if (phase2.getReligion() == null || phase2.getReligion().trim().isEmpty()) {
            throw new RuntimeException("Religion is required");
        }
        if (phase2.getCategory() == null || phase2.getCategory().trim().isEmpty()) {
            throw new RuntimeException("Category is required");
        }
        if (phase2.getIncomeRange() == null || phase2.getIncomeRange().trim().isEmpty()) {
            throw new RuntimeException("Income range is required");
        }
        if (phase2.getEducationalQualification() == null ||
            phase2.getEducationalQualification().trim().isEmpty()) {
            throw new RuntimeException("Educational qualification is required");
        }
        if ("Other".equals(phase2.getEducationalQualification()) &&
            (phase2.getEducationOtherDetails() == null ||
             phase2.getEducationOtherDetails().trim().isEmpty())) {
            throw new RuntimeException("Please specify other education details");
        }
        if (phase2.getOccupation() == null || phase2.getOccupation().trim().isEmpty()) {
            throw new RuntimeException("Occupation is required");
        }
        if ("Other".equals(phase2.getOccupation()) &&
            (phase2.getOccupationOtherDetails() == null ||
             phase2.getOccupationOtherDetails().trim().isEmpty())) {
            throw new RuntimeException("Please specify other occupation details");
        }
        if (phase2.getPanNumber() == null || !phase2.getPanNumber().matches("[A-Z]{5}[0-9]{4}[A-Z]{1}")) {
            throw new RuntimeException("Valid PAN number required (e.g., AAAPL5055K)");
        }
        if (phase2.getAadhaarNumber() == null || !phase2.getAadhaarNumber().matches("\\d{12}")) {
            throw new RuntimeException("Valid 12-digit Aadhaar number required");
        }
        if (phase2.getSeniorCitizen() == null) {
            throw new RuntimeException("Senior citizen status required");
        }
        if (phase2.getExistingAccountHolder() == null) {
            throw new RuntimeException("Existing account holder status required");
        }

        // Update user with Phase 2 data
        user.setReligion(phase2.getReligion());
        user.setCategory(phase2.getCategory());
        user.setIncomeRange(phase2.getIncomeRange());
        user.setEducationalQualification(phase2.getEducationalQualification());
        user.setEducationOtherDetails(phase2.getEducationOtherDetails());
        user.setOccupation(phase2.getOccupation());
        user.setOccupationOtherDetails(phase2.getOccupationOtherDetails());
        user.setPanNumber(phase2.getPanNumber());
        user.setAadhaarNumber(phase2.getAadhaarNumber());
        user.setSeniorCitizen(phase2.getSeniorCitizen());
        user.setExistingAccountHolder(phase2.getExistingAccountHolder());
        user.setRegistrationPhase("PHASE_2");

        return userRepository.save(user);
    }

    // ============ PHASE 3: ACCOUNT DETAILS ============
    public User submitPhase3(String email, RegistrationPhase3Request phase3) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User registration not found"));

        // Allow PHASE_2 (normal flow) or COMPLETED (returning user creating new account)
        if (!"PHASE_2".equals(user.getRegistrationPhase()) && !"COMPLETED".equals(user.getRegistrationPhase())) {
            throw new RuntimeException("Please complete Phase 2 first");
        }

        // Validate account type
        if (phase3.getAccountType() == null ||
            !phase3.getAccountType().matches("SAVING|CURRENT|FIXED_DEPOSIT|RECURRING_DEPOSIT")) {
            throw new RuntimeException("Valid account type required");
        }

        // Validate initial deposit
        if (phase3.getInitialDeposit() == null || phase3.getInitialDeposit() < MINIMUM_DEPOSIT) {
            throw new RuntimeException("Minimum deposit of ₹" + MINIMUM_DEPOSIT + " is required");
        }

        // At least one service should be optional (allow all to be false)
        // But let's encourage selecting at least one
        user.setAccountType(phase3.getAccountType());
        user.setAtmCard(phase3.getAtmCard() != null ? phase3.getAtmCard() : false);
        user.setInternetBanking(phase3.getInternetBanking() != null ? phase3.getInternetBanking() : false);
        user.setMobileBanking(phase3.getMobileBanking() != null ? phase3.getMobileBanking() : false);
        user.setEmailAlerts(phase3.getEmailAlerts() != null ? phase3.getEmailAlerts() : false);
        user.setChequeBook(phase3.getChequeBook() != null ? phase3.getChequeBook() : false);
        user.setEStatement(phase3.getEStatement() != null ? phase3.getEStatement() : false);
        user.setInitialDeposit(phase3.getInitialDeposit());
        user.setRegistrationPhase("PHASE_3");

        return userRepository.save(user);
    }

    // ============ PHASE 4: SECURITY SETUP ============
    public User submitPhase4(String email, RegistrationPhase4Request phase4) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User registration not found"));

        // Allow PHASE_3 (normal flow) or COMPLETED (returning user skipped phases)
        if (!"PHASE_3".equals(user.getRegistrationPhase()) && !"COMPLETED".equals(user.getRegistrationPhase())) {
            throw new RuntimeException("Please complete Phase 3 first");
        }

        // Validate passwords
        if (phase4.getPassword() == null || phase4.getPassword().length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }
        if (!phase4.getPassword().equals(phase4.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }
        if (!isStrongPassword(phase4.getPassword())) {
            throw new RuntimeException(
                "Password must contain at least one uppercase, one lowercase, and one digit");
        }

        // Validate transaction PIN
        if (phase4.getTransactionPin() == null || !phase4.getTransactionPin().matches("\\d{4}")) {
            throw new RuntimeException("Transaction PIN must be exactly 4 digits");
        }
        if (!phase4.getTransactionPin().equals(phase4.getConfirmTransactionPin())) {
            throw new RuntimeException("Transaction PINs do not match");
        }

        // Set security credentials (allow updating for existing users)
        user.setPassword(passwordEncoder.encode(phase4.getPassword()));
        user.setTransactionPin(phase4.getTransactionPin());
        user.setRegistrationPhase("PHASE_4");

        return userRepository.save(user);
    }

    // ============ PHASE 5: OTP VERIFICATION & ACCOUNT CREATION ============
    public User submitPhase5(String email, RegistrationPhase5Request phase5) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User registration not found"));

        if (!"PHASE_4".equals(user.getRegistrationPhase())) {
            throw new RuntimeException("Please complete Phase 4 first");
        }

        // Verify OTP
        OTP otp = otpRepository.findByUserIdAndOtpCodeAndIsUsedFalse(user.getId(), phase5.getOtpCode())
            .orElseThrow(() -> new RuntimeException("Invalid OTP"));

        if (otp.isExpired()) {
            throw new RuntimeException("OTP has expired");
        }

        // Mark OTP as used
        otp.setIsUsed(true);
        otp.setVerifiedAt(LocalDateTime.now());
        otpRepository.save(otp);

        // Create Account and finalize registration
        user.setUsername(email.split("@")[0] + "_" + System.nanoTime());
        user.setRegistrationPhase("COMPLETED");
        user.setRegistrationCompletedAt(LocalDateTime.now());
        user.setKycVerified(true);

        User savedUser = userRepository.save(user);

        // Create associated bank account
        Account account = new Account();
        account.setUserId(savedUser.getId());
        account.setAccountNumber(generateAccountNumber());
        account.setBalance(savedUser.getInitialDeposit());
        account.setAccountType(savedUser.getAccountType());
        account.setStatus("ACTIVE");
        account.setMinimumDepositRequired(MINIMUM_DEPOSIT);
        account.setMinimumDepositPaid(true);
        account.setCreatedAt(LocalDateTime.now());
        account.setActivatedAt(LocalDateTime.now());

        accountRepository.save(account);

        return savedUser;
    }

    // ============ HELPER METHODS ============

    public void sendOTPForRegistration(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        // Send OTP to email
        otpService.generateAndSendOTP(user.getId(), "REGISTRATION");
    }

    private boolean isStrongPassword(String password) {
        // At least one uppercase, one lowercase, one digit
        return password.matches(".*[A-Z].*") &&
               password.matches(".*[a-z].*") &&
               password.matches(".*\\d.*");
    }

    private String generateAccountNumber() {
        String accNum;
        do {
            long num = 1000000000L +
                Math.abs(new java.util.Random().nextLong() % 9000000000L);
            accNum = "ACC" + num;
        } while (accountRepository.findByAccountNumber(accNum).isPresent());
        return accNum;
    }

    public User getRegistrationStatus(String email) {
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
