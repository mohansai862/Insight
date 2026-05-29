package com.techtammina.crm.controller;
 
import java.net.InetAddress;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.service.EmailService;
 
@RestController
@RequestMapping("/api/users")
public class BulkUserController {
 
    @Autowired
    private UsersRepository usersRepository;
 
    @Autowired
    private PasswordEncoder passwordEncoder;
   
    @Autowired
    private EmailService emailService;
    
    @Value("${server.port}")
    private String serverPort;
    
    @Value("${spring.web.cors.allowed-origins:}")
    private String allowedOrigins;
 
    @PostMapping("/bulk-create")
    public ResponseEntity<?> bulkCreateUsers(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> usersList = (List<Map<String, Object>>) request.get("users");
           
            for (Map<String, Object> userData : usersList) {
                Users user = new Users();
                String username = String.valueOf(userData.get("username"));
                String email = String.valueOf(userData.get("email"));
                String defaultPassword = "TechTammina@123";
                String role = String.valueOf(userData.get("role"));
                String reportingEmpId = String.valueOf(userData.get("reportingId"));
               
                // Validate reporting_id based on role hierarchy
                String validationError = validateReportingId(role, reportingEmpId);
                if (validationError != null) {
                    return ResponseEntity.badRequest().body(Map.of("error", validationError));
                }
               
                user.setEmpid(String.valueOf(userData.get("empId")));
                user.setFirstName(String.valueOf(userData.get("firstName")));
                user.setMiddleName(String.valueOf(userData.get("middleName")));
                user.setLastName(String.valueOf(userData.get("lastName")));
                user.setUsername(username);
                user.setEmail(email);
                user.setGender(Users.Gender.valueOf(String.valueOf(userData.get("gender"))));
                user.setCountryCode(String.valueOf(userData.get("countryCode")));
                user.setPhoneNumber(String.valueOf(userData.get("phoneNumber")));
                user.setRole(role);
                user.setReportingEmpid(reportingEmpId);
               
                // Find manager by reporting_empid and set manager_id
                if (reportingEmpId != null && !reportingEmpId.isEmpty() && !"null".equals(reportingEmpId)) {
                    Users manager = usersRepository.findByEmpid(reportingEmpId);
                    if (manager != null) {
                        user.setManagerId(manager.getUserId());
                    }
                }
               
                user.setPassword(passwordEncoder.encode(defaultPassword));
                user.setCreatedAt(LocalDateTime.now());
                user.setIsActive(true);
                user.setFirstLogin(true);
               
                usersRepository.save(user);
               
                // Send welcome email with credentials
                try {
                    String subject = "Welcome to Tech Tammina CRM - Your Account is Ready!";
                    String body = String.format(
                        "Dear %s %s,\n\n" +
                        "Welcome to Tech Tammina CRM! Your account has been approved and is now active.\n\n" +
                        "Login Credentials:\n" +
                        "Website: " + buildAppUrl() + "\n" +
                        "Username: %s\n" +
                        "Password: %s\n" +
                        "Employee ID: %s\n" +
                        "Role: %s\n\n" +
                        "Please login and change your password on first access.\n\n" +
                        "Best regards,\n" +
                        "Tech Tammina CRM Team",
                        user.getFirstName(),
                        user.getLastName(),
                        username,
                        defaultPassword,
                        user.getEmpid(),
                        user.getRole()
                    );
                   
                    emailService.sendEmail(email, null, subject, body);
                } catch (Exception e) {
                    // Log error but don't fail the user creation
                    System.err.println("Failed to send email to " + email + ": " + e.getMessage());
                }
            }
           
            return ResponseEntity.ok().body(Map.of("message", "Users created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    private String validateReportingId(String role, String reportingEmpId) {
        // Sales VP doesn't need reporting_id
        if ("Sales_VP".equals(role) || "Sales VP".equals(role)) {
            return null;
        }
        
        // Other roles must have reporting_id
        if (reportingEmpId == null || reportingEmpId.isEmpty() || "null".equals(reportingEmpId)) {
            return "Reporting ID is required for role: " + role;
        }
        
        // Check if reporting_empid exists
        Users manager = usersRepository.findByEmpid(reportingEmpId);
        if (manager == null) {
            return "Invalid reporting ID: " + reportingEmpId + ". Employee not found.";
        }
        
        // Validate role hierarchy
        String managerRole = manager.getRole();
        
        if ("Sales_Manager".equals(role) || "Sales Manager".equals(role)) {
            if (!"Sales_VP".equals(managerRole) && !"Sales VP".equals(managerRole)) {
                return "Sales Manager must report to Sales VP. Found manager role: " + managerRole;
            }
        } else if ("Sales_Executive".equals(role) || "Sales Executive".equals(role)) {
            if (!"Sales_Manager".equals(managerRole) && !"Sales Manager".equals(managerRole)) {
                return "Sales Executive must report to Sales Manager. Found manager role: " + managerRole;
            }
        }
        
        return null;
    }
    
    @PutMapping("/{userId}")
    public ResponseEntity<?> updateUser(@PathVariable Integer userId, @RequestBody Map<String, Object> updates) {
        try {
            Users user = usersRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            String originalEmail = user.getEmail();
            
            // Update user fields
            if (updates.containsKey("firstName")) {
                user.setFirstName(String.valueOf(updates.get("firstName")));
            }
            if (updates.containsKey("middleName")) {
                user.setMiddleName(String.valueOf(updates.get("middleName")));
            }
            if (updates.containsKey("lastName")) {
                user.setLastName(String.valueOf(updates.get("lastName")));
            }
            if (updates.containsKey("username")) {
                user.setUsername(String.valueOf(updates.get("username")));
            }
            if (updates.containsKey("email")) {
                user.setEmail(String.valueOf(updates.get("email")));
            }
            if (updates.containsKey("role")) {
                user.setRole(String.valueOf(updates.get("role")));
            }
            
            usersRepository.save(user);
            
            // Send email notification if email was changed
            if (!originalEmail.equals(user.getEmail())) {
                try {
                    String subject = "Tech Tammina CRM - Account Information Updated";
                    String body = String.format(
                        "Dear %s %s,\n\n" +
                        "Your account information has been updated in Tech Tammina CRM.\n\n" +
                        "Login Credentials:\n" +
                        "Website: " + buildAppUrl() + "\n" +
                        "Username: %s\n" +
                        "Email: %s\n" +
                        "Role: %s\n\n" +
                        "Your password remains the same. If you need to reset it, please use the 'Forgot Password' option.\n\n" +
                        "Best regards,\n" +
                        "Tech Tammina CRM Team",
                        user.getFirstName(),
                        user.getLastName(),
                        user.getUsername(),
                        user.getEmail(),
                        user.getRole()
                    );
                    
                    emailService.sendEmail(user.getEmail(), null, subject, body);
                } catch (Exception e) {
                    System.err.println("Failed to send email to " + user.getEmail() + ": " + e.getMessage());
                }
            }
            
            return ResponseEntity.ok().body(Map.of("message", "User updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    private String buildAppUrl() {
        // If CORS allowed origins is configured, use the first one
        if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
            String firstOrigin = allowedOrigins.split(",")[0].trim();
            if (!firstOrigin.isEmpty()) {
                return firstOrigin;
            }
        }
        
        // For development, dynamically detect host and port
        try {
            String host = InetAddress.getLocalHost().getHostAddress();
            return "http://" + host + ":" + serverPort;
        } catch (Exception e) {
            // Fallback to localhost if host detection fails
            return "http://localhost:" + serverPort;
        }
    }
}
 