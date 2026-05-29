package com.techtammina.crm.service;
 
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
 
import com.techtammina.crm.dto.*;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.entity.Signup;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.repository.SignupRepository;
import com.techtammina.crm.util.JwtUtil;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
 
@Service
public class AuthService {
 
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final UsersRepository usersRepository;
    private final SignupRepository signupRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final OtpService otpService;
 
    public AuthService(UsersRepository usersRepository, SignupRepository signupRepository,
                      PasswordEncoder passwordEncoder, JwtUtil jwtUtil, EmailService emailService,
                      OtpService otpService) {
        this.usersRepository = usersRepository;
        this.signupRepository = signupRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.otpService = otpService;
    }
 
    public LoginResponse login(LoginRequest request) {
        String raw = request.getEmail();
        if (raw == null || raw.trim().isEmpty()) {
            log.warn("Login attempt with empty username/email");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
        String input = raw.trim();
        log.info("Login attempt for identifier='{}'", input);
 
        // Exact case-sensitive match by username or email
        Users user = usersRepository.findByUsername(input)
                .orElseGet(() -> usersRepository.findByEmail(input).orElse(null));
 
        if (user != null) {
            log.info("User matched (identifier='{}', userId={}, role={})", input, user.getUserId(), user.getRole());
        }
 
        if (user == null) {
            log.warn("Login failed: user not found for identifier='{}'", input);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
 
        // Password comparison - handle both BCrypt and SHA-256
        String storedPass = user.getPassword();
        String providedPass = request.getPassword();
        boolean passwordMatches = false;
       
        log.info("Password debug - provided: '{}', stored starts with: '{}'", providedPass, storedPass != null ? storedPass.substring(0, Math.min(10, storedPass.length())) : "null");
       
        if (storedPass != null) {
            if (storedPass.startsWith("$2")) {
                // BCrypt format
                passwordMatches = passwordEncoder.matches(providedPass, storedPass);
                log.info("BCrypt password match result: {}", passwordMatches);
            } else {
                // SHA-256 format - compute hash of provided password
                try {
                    java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                    byte[] hash = digest.digest(providedPass.getBytes("UTF-8"));
                    StringBuilder hexString = new StringBuilder();
                    for (byte b : hash) {
                        String hex = Integer.toHexString(0xff & b);
                        if (hex.length() == 1) hexString.append('0');
                        hexString.append(hex);
                    }
                    passwordMatches = storedPass.equals(hexString.toString());
                    log.info("SHA-256 password match result: {}", passwordMatches);
                } catch (Exception e) {
                    log.error("Error computing SHA-256 hash", e);
                }
            }
        }
       
        if (!passwordMatches) {
            log.warn("Login failed: password mismatch for userId={} (username='{}')", user.getUserId(), user.getUsername());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }
 
        // Check if user account is active
        if (!user.getIsActive()) {
            log.warn("Login failed: user account is inactive for userId={} (username='{}')", user.getUserId(), user.getUsername());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account is disabled! You cannot login");
        }
        
        // Check if this is first login - require password reset
        if (user.getFirstLogin() != null && user.getFirstLogin()) {
            log.info("First login detected for userId={}, requiring password reset", user.getUserId());
            throw new ResponseStatusException(HttpStatus.PRECONDITION_REQUIRED, "FIRST_LOGIN_PASSWORD_RESET_REQUIRED");
        }
 
        // User data is already in the users table, no need to check signup table
 
        // Generate JWT token
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole(), user.getUserId());
       
        // Get user details from users table
        String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
        String username = user.getUsername();
        String email = user.getEmail();
        String countryCode = user.getCountryCode() != null ? user.getCountryCode() : "";
        String phoneNumber = user.getPhoneNumber() != null ? user.getPhoneNumber() : "";
        String gender = user.getGender() != null ? user.getGender().toString() : "";
       
        log.info("Final user details - firstName: '{}', lastName: '{}', username: '{}', email: '{}'", firstName, lastName, username, email);
       
        // Combine firstName and lastName into fullName
        String fullName = "";
        if (!firstName.isEmpty() && !lastName.isEmpty()) {
            fullName = firstName + " " + lastName;
        } else if (!firstName.isEmpty()) {
            fullName = firstName;
        } else if (!lastName.isEmpty()) {
            fullName = lastName;
        } else {
            fullName = username;
        }
       
        // Get manager information
        String managerName = null;
        Integer managerId = user.getManagerId();
        if (managerId != null) {
            var managerOpt = usersRepository.findById(managerId);
            if (managerOpt.isPresent()) {
                var manager = managerOpt.get();
                String managerFirstName = manager.getFirstName() != null ? manager.getFirstName().trim() : "";
                String managerLastName = manager.getLastName() != null ? manager.getLastName().trim() : "";
               
                if (!managerFirstName.isEmpty() || !managerLastName.isEmpty()) {
                    managerName = (managerFirstName + " " + managerLastName).trim();
                } else {
                    managerName = manager.getUsername();
                }
            }
        }
        log.info("Login successful for userId={}, role={}, fullName='{}', managerName='{}'", user.getUserId(), user.getRole(), fullName, managerName);
        LoginResponse response = new LoginResponse("Login successful", user.getRole(), user.getUserId(), token);
        response.setFirstName(firstName);
        response.setLastName(lastName);
        response.setFullName(fullName);
        response.setUsername(username);
        response.setEmail(email);
        response.setCountryCode(countryCode);
        response.setPhoneNumber(phoneNumber);
        response.setGender(gender);
        response.setManagerId(managerId);
        response.setManagerName(managerName);
        return response;
    }
   
    public String hashPassword(String plainPassword) {
        return passwordEncoder.encode(plainPassword);
    }
   
    public void sendPasswordResetOtp(ForgotPasswordRequest request) {
        String email = request.getEmail().trim();
        log.info("Password reset requested for email: '{}'", email);
       
        Optional<Users> userOpt = usersRepository.findByIdentifierIgnoreCase(email);
        if (userOpt.isEmpty()) {
            userOpt = usersRepository.findByEmail(email);
            if (userOpt.isEmpty()) {
                userOpt = usersRepository.findByEmail(email.toLowerCase());
            }
        }
        
        if (userOpt.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with this email address");
        }
       
        Users user = userOpt.get();
        if (!user.getIsActive()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is disabled");
        }
       
        String userEmail = user.getEmail().toLowerCase();
        String otp = otpService.generateOtp(userEmail);
       
        // For admin roles with invalid email domains, use console logging instead of email
        if (("IT_Admin".equals(user.getRole()) || "CEO".equals(user.getRole())) && 
            (userEmail.contains("@tammina.in") && !userEmail.equals("crms-noreply@tammina.in"))) {
            log.warn("=== ADMIN PASSWORD RESET OTP ===");
            log.warn("User: {} ({})", user.getFirstName(), userEmail);
            log.warn("OTP: {}", otp);
            log.warn("This OTP expires in 10 minutes");
            log.warn("=================================");
            return; // Skip email sending for invalid admin emails
        }
       
        String subject = "Password Reset OTP - Tech Tammina CRM";
        String body = String.format(
            "Dear %s,\n\n" +
            "You have requested to reset your password for Tech Tammina CRM.\n\n" +
            "Your OTP is: %s\n\n" +
            "This OTP will expire in 10 minutes.\n\n" +
            "If you did not request this password reset, please ignore this email.\n\n" +
            "Best regards,\n" +
            "Tech Tammina CRM Team",
            user.getFirstName() != null ? user.getFirstName() : "User",
            otp
        );
       
        try {
            emailService.sendEmail(userEmail, null, subject, body);
            log.info("Password reset OTP sent successfully to email: {}", userEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}", userEmail, e);
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Email service is temporarily unavailable. Please contact your administrator.");
        }
    }
   
    public void verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp();
       
        log.info("OTP verification requested for email: {}", email);
       
        if (!otpService.verifyOtp(email, otp)) {
            log.warn("Invalid or expired OTP for email: {}", email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }
       
        log.info("OTP verified successfully for email: {}", email);
    }
   
    public void resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();
       
        log.info("Password reset requested for email: {}", email);
       
        // Validate password confirmation
        if (!newPassword.equals(confirmPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }
       
        // Verify OTP was previously verified
        if (!otpService.isOtpVerified(email)) {
            log.warn("OTP not verified for password reset: {}", email);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP verification required");
        }
       
        // Find user using case-insensitive lookup
        Optional<Users> userOpt = usersRepository.findByIdentifierIgnoreCase(request.getEmail().trim());
        if (userOpt.isEmpty()) {
            log.warn("User not found for password reset: {}", email);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
       
        Users user = userOpt.get();
       
        // Update password
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(hashedPassword);
        usersRepository.save(user);
       
        // Remove OTP from memory
        otpService.removeOtp(email);
       
        log.info("Password reset successfully for email: {}", email);
       
        // Send confirmation email (skip for admin roles with invalid email domains)
        String userEmail = user.getEmail().toLowerCase();
        if (("IT_Admin".equals(user.getRole()) || "CEO".equals(user.getRole())) && 
            (userEmail.contains("@tammina.in") && !userEmail.equals("crms-noreply@tammina.in"))) {
            log.info("Password reset completed for admin user: {} ({}). Email confirmation skipped due to invalid email domain.", user.getFirstName(), userEmail);
        } else {
            String subject = "Password Reset Successful - Tech Tammina CRM";
            String body = String.format(
                "Dear %s,\n\n" +
                "Your password has been successfully reset for Tech Tammina CRM.\n\n" +
                "If you did not make this change, please contact your administrator immediately.\n\n" +
                "Best regards,\n" +
                "Tech Tammina CRM Team",
                user.getFirstName() != null ? user.getFirstName() : "User"
            );
           
            try {
                emailService.sendEmail(user.getEmail(), null, subject, body);
                log.info("Password reset confirmation email sent to: {}", userEmail);
            } catch (Exception e) {
                log.warn("Failed to send password reset confirmation email to: {} - {}", userEmail, e.getMessage());
                // Don't throw exception here as password reset was successful
            }
        }
    }
    
    public void resetFirstLoginPassword(FirstLoginPasswordResetRequest request) {
        String identifier = request.getIdentifier().trim();
        String currentPassword = request.getCurrentPassword();
        String newPassword = request.getNewPassword();
        String confirmPassword = request.getConfirmPassword();
        
        log.info("First login password reset requested for identifier: {}", identifier);
        
        // Validate password confirmation
        if (!newPassword.equals(confirmPassword)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Passwords do not match");
        }
        
        // Find user by username or email (case-sensitive)
        Users user = usersRepository.findByUsername(identifier)
                .orElseGet(() -> usersRepository.findByEmail(identifier).orElse(null));
        
        if (user == null) {
            log.warn("User not found for first login password reset: {}", identifier);
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        
        // Verify current password
        String storedPass = user.getPassword();
        boolean passwordMatches = false;
        
        if (storedPass != null) {
            if (storedPass.startsWith("$2")) {
                // BCrypt format
                passwordMatches = passwordEncoder.matches(currentPassword, storedPass);
            } else {
                // SHA-256 format
                try {
                    java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
                    byte[] hash = digest.digest(currentPassword.getBytes("UTF-8"));
                    StringBuilder hexString = new StringBuilder();
                    for (byte b : hash) {
                        String hex = Integer.toHexString(0xff & b);
                        if (hex.length() == 1) hexString.append('0');
                        hexString.append(hex);
                    }
                    passwordMatches = storedPass.equals(hexString.toString());
                } catch (Exception e) {
                    log.error("Error computing SHA-256 hash", e);
                }
            }
        }
        
        if (!passwordMatches) {
            log.warn("Current password verification failed for first login reset: {}", identifier);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is incorrect. Please try again");
        }
        
        // Update password and mark first login as complete
        String hashedPassword = passwordEncoder.encode(newPassword);
        user.setPassword(hashedPassword);
        user.setFirstLogin(false);
        usersRepository.save(user);
        
        log.info("First login password reset completed for identifier: {}", identifier);
        
        // Send confirmation email (skip for admin roles with invalid email domains)
        String userEmail = user.getEmail().toLowerCase();
        if (("IT_Admin".equals(user.getRole()) || "CEO".equals(user.getRole())) && 
            (userEmail.contains("@tammina.in") && !userEmail.equals("crms-noreply@tammina.in"))) {
            log.info("First login password reset completed for admin user: {} ({}). Email confirmation skipped due to invalid email domain.", user.getFirstName(), userEmail);
        } else {
            String subject = "Password Updated Successfully - Tech Tammina CRM";
            String body = String.format(
                "Dear %s,\n\n" +
                "Your password has been successfully updated for Tech Tammina CRM.\n\n" +
                "You can now login with your new password.\n\n" +
                "If you did not make this change, please contact your administrator immediately.\n\n" +
                "Best regards,\n" +
                "Tech Tammina CRM Team",
                user.getFirstName() != null ? user.getFirstName() : "User"
            );
            
            try {
                emailService.sendEmail(user.getEmail(), null, subject, body);
                log.info("First login password reset confirmation email sent to: {}", userEmail);
            } catch (Exception e) {
                log.warn("Failed to send first login password reset confirmation email to: {} - {}", userEmail, e.getMessage());
                // Don't throw exception here as password reset was successful
            }
        }
    }
 
}
 