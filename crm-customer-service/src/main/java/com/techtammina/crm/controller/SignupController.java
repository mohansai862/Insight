package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.techtammina.crm.entity.Signup;
import com.techtammina.crm.service.SignupService;

@RestController
@RequestMapping("/api/signup")
@Slf4j
public class SignupController {
    private static final Logger log = LoggerFactory.getLogger(SignupController.class);

    private final SignupService signupService;

    public SignupController(SignupService signupService) {
        this.signupService = signupService;
    }

    @PostMapping
    public ResponseEntity<?> register(@RequestBody Signup signup) {
        try {
            log.info("Signup request received for email: {}, username: {}", 
                       signup.getEmail(), signup.getUsername());
            
            // Log the full signup object for debugging
            log.debug("Full signup data: firstName={}, lastName={}, middleName={}, gender={}, countryCode={}, phoneNumber={}, role={}, reportingTo={}",
                        signup.getFirstName(), signup.getLastName(), signup.getMiddleName(), 
                        signup.getGender(), signup.getCountryCode(), signup.getPhoneNumber(), 
                        signup.getRole(), signup.getReportingTo());
            
            Signup registered = signupService.register(signup);
            
            // Create response without sensitive data
            Map<String, Object> response = new HashMap<>();
            response.put("id", registered.getId());
            response.put("username", registered.getUsername());
            response.put("email", registered.getEmail());
            response.put("firstName", registered.getFirstName());
            response.put("lastName", registered.getLastName());
            response.put("role", registered.getRole());
            response.put("status", registered.getStatus());
            response.put("createdAt", registered.getCreatedAt());
            
            log.info("Signup successful for user: {}", registered.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
            
        } catch (RuntimeException e) {
            log.error("Signup registration failed: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Unexpected error during signup: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Internal server error: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping
    public ResponseEntity<List<Signup>> getAll() {
        return ResponseEntity.ok(signupService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Signup> getById(@PathVariable Integer id) {
        return signupService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Signup> updateStatus(@PathVariable Integer id,
                                               @RequestParam String status) {
        Signup.Status statusEnum;
        try {
            statusEnum = Signup.Status.valueOf(status);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(signupService.updateStatus(id, statusEnum));
    }

    @GetMapping("/pending-approvals")
    public ResponseEntity<List<Signup>> getAllPendingApprovals() {
        return ResponseEntity.ok(signupService.getAllPendingApprovals());
    }

    @GetMapping("/pending-approvals/manager/{managerId}")
    public ResponseEntity<List<Signup>> getPendingApprovalsForManager(@PathVariable Integer managerId) {
        return ResponseEntity.ok(signupService.getPendingApprovalsForManager(managerId));
    }

    @GetMapping("/approved-users")
    public ResponseEntity<List<Signup>> getAllApprovedUsers() {
        return ResponseEntity.ok(signupService.getAllApprovedUsers());
    }
    
    @PostMapping("/test")
    public ResponseEntity<?> testSignup() {
        try {
            // Create a test signup object
            Signup testSignup = new Signup();
            testSignup.setFirstName("Test");
            testSignup.setLastName("User");
            testSignup.setUsername("testuser" + System.currentTimeMillis());
            testSignup.setEmail("test" + System.currentTimeMillis() + "@example.com");
            testSignup.setPassword("password123");
            testSignup.setGender(Signup.Gender.Male);
            testSignup.setCountryCode("+91");
            testSignup.setPhoneNumber("9876543210");
            testSignup.setRole(Signup.Role.Sales_Executive);
            
            Signup result = signupService.register(testSignup);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Test signup successful");
            response.put("id", result.getId());
            response.put("username", result.getUsername());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Test signup failed: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            error.put("type", e.getClass().getSimpleName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}