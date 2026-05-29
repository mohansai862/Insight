package com.techtammina.crm.service;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techtammina.crm.entity.Signup;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.SignupRepository;
import com.techtammina.crm.repository.UsersRepository;

@Slf4j
@Service
public class SignupService {
    private static final Logger log = LoggerFactory.getLogger(SignupService.class);

    private final SignupRepository signupRepository;
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;

    public SignupService(SignupRepository signupRepository, UsersRepository usersRepository, PasswordEncoder passwordEncoder) {
        this.signupRepository = signupRepository;
        this.usersRepository = usersRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Signup register(Signup signup) {
        // Basic validation
        if (signup.getEmail() == null || signup.getEmail().trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (signup.getUsername() == null || signup.getUsername().trim().isEmpty()) {
            throw new RuntimeException("Username is required");
        }
        if (signup.getPassword() == null || signup.getPassword().length() < 6) {
            throw new RuntimeException("Password must be at least 6 characters");
        }
        if (signup.getFirstName() == null || signup.getFirstName().trim().isEmpty()) {
            throw new RuntimeException("First name is required");
        }
        if (signup.getLastName() == null || signup.getLastName().trim().isEmpty()) {
            throw new RuntimeException("Last name is required");
        }
        if (signup.getCountryCode() == null || signup.getCountryCode().trim().isEmpty()) {
            throw new RuntimeException("Country code is required");
        }
        if (signup.getPhoneNumber() == null || signup.getPhoneNumber().trim().isEmpty()) {
            throw new RuntimeException("Phone number is required");
        }
        if (signup.getRole() == null) {
            throw new RuntimeException("Role is required");
        }
        if (signup.getGender() == null) {
            throw new RuntimeException("Gender is required");
        }
        
        // Validate reporting_to if provided
        if (signup.getReportingTo() != null) {
            if (!usersRepository.existsById(signup.getReportingTo())) {
                throw new RuntimeException("Selected manager does not exist");
            }
        } else {
            // For roles that require a manager, make reporting_to optional during signup
            // The manager assignment can be handled during approval process
            if (signup.getRole() == Signup.Role.Sales_Executive || signup.getRole() == Signup.Role.Sales_Manager) {
                log.info("Signup for {} role without manager assignment - will be handled during approval", signup.getRole());
            }
        }
        
        // Trim and normalize input data
        signup.setEmail(signup.getEmail().trim().toLowerCase());
        signup.setUsername(signup.getUsername().trim());
        signup.setFirstName(signup.getFirstName().trim());
        signup.setLastName(signup.getLastName().trim());
        if (signup.getMiddleName() != null) {
            signup.setMiddleName(signup.getMiddleName().trim());
        }
        signup.setCountryCode(signup.getCountryCode().trim());
        signup.setPhoneNumber(signup.getPhoneNumber().trim());
        
        // Check for existing records
        if (signupRepository.findByEmail(signup.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }
        if (signupRepository.findByUsername(signup.getUsername()).isPresent()) {
            throw new RuntimeException("Username already taken");
        }
        if (usersRepository.existsByEmail(signup.getEmail())) {
            throw new RuntimeException("Email already registered");
        }
        if (usersRepository.existsByUsername(signup.getUsername())) {
            throw new RuntimeException("Username already taken");
        }
        
        // Validate enum values before saving
        try {
            if (signup.getRole() != null) {
                // Validate role enum
                Signup.Role.valueOf(signup.getRole().name());
            }
            if (signup.getGender() != null) {
                // Validate gender enum
                Signup.Gender.valueOf(signup.getGender().name());
            }
        } catch (IllegalArgumentException e) {
            log.error("Invalid enum value in signup data: {}", e.getMessage());
            throw new RuntimeException("Invalid role or gender value");
        }
        
        // Hash password before saving
        signup.setPassword(passwordEncoder.encode(signup.getPassword()));
        
        log.info("Attempting to save signup for user: {}", signup.getUsername());
        
        // Save to signup table
        Signup saved;
        try {
            saved = signupRepository.save(signup);
            log.info("Successfully saved signup with ID: {}", saved.getId());
        } catch (Exception e) {
            log.error("Database error while saving signup: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save user registration: " + e.getMessage());
        }
        
        // Only create user if role is auto-approved (VP or IT_Admin)
        if (saved.getRole() == Signup.Role.Sales_VP || saved.getRole() == Signup.Role.IT_Admin) {
            saved.setStatus(Signup.Status.Approved);
            saved = signupRepository.save(saved);
            createUserFromSignup(saved);
        }
        // Sales_Executive and Sales_Manager remain pending until manager approval
        
        log.info("User successfully registered - Username: {}, Email: {}", 
                   saved.getUsername(), saved.getEmail());
        
        return saved;
    }

    public List<Signup> getAll() {
        return signupRepository.findAll();
    }

    public Optional<Signup> getById(Integer id) {
        return signupRepository.findById(id);
    }

    public Signup updateStatus(Integer id, Signup.Status status) {
        Signup signup = signupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        signup.setStatus(status);
        Signup updated = signupRepository.save(signup);

        // Create user if approved and doesn't exist
        if (status == Signup.Status.Approved) {
            if (!usersRepository.existsByEmail(updated.getEmail()) && 
                !usersRepository.existsByUsername(updated.getUsername())) {
                createUserFromSignup(updated);
            }
        }

        return updated;
    }

    public List<Signup> getPendingApprovalsForManager(Integer managerId) {
        return signupRepository.findByReportingToAndStatus(managerId, Signup.Status.Pending);
    }

    public List<Signup> getAllPendingApprovals() {
        return signupRepository.findByStatus(Signup.Status.Pending);
    }

    public List<Signup> getAllApprovedUsers() {
        return signupRepository.findApprovedSalesUsers(Signup.Status.Approved);
    }

    private Users createUserFromSignup(Signup signup) {
        Users user = new Users();
        
        // Map essential fields
        user.setUsername(signup.getUsername());
        user.setPassword(signup.getPassword()); // Already hashed
        user.setEmail(signup.getEmail());
        
        // Map optional fields with null checks
        user.setFirstName(signup.getFirstName());
        user.setMiddleName(signup.getMiddleName());
        user.setLastName(signup.getLastName());
        user.setCountryCode(signup.getCountryCode());
        user.setPhoneNumber(signup.getPhoneNumber());
        user.setManagerId(signup.getReportingTo());
        
        // No approval field needed in users table - using signup table status
        
        // Handle enum mappings safely
        if (signup.getGender() != null) {
            try {
                user.setGender(Users.Gender.valueOf(signup.getGender().name()));
            } catch (Exception e) {
                log.warn("Invalid gender value: {}", signup.getGender());
            }
        }
        
        if (signup.getRole() != null) {
            user.setRole(signup.getRole().name());
        }
        
        return usersRepository.save(user);
    }
}