package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.entity.Users;
import com.techtammina.crm.entity.Signup;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.repository.SignupRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/migration")
@Slf4j
public class MigrationController {
    private static final Logger log = LoggerFactory.getLogger(MigrationController.class);
    
    private final UsersRepository usersRepository;
    private final SignupRepository signupRepository;
    private final PasswordEncoder passwordEncoder;
    
    public MigrationController(UsersRepository usersRepository, SignupRepository signupRepository, PasswordEncoder passwordEncoder) {
        this.usersRepository = usersRepository;
        this.signupRepository = signupRepository;
        this.passwordEncoder = passwordEncoder;
    }
    
    @PostMapping("/hash-passwords")
    public Map<String, Object> hashExistingPasswords() {
        try {
            log.info("Starting migration process...");
            
            int usersUpdated = 0;
            int signupsUpdated = 0;
            
            // Hash passwords in users table
            List<Users> users = usersRepository.findAll();
            List<Users> usersToUpdate = users.stream()
                .filter(user -> user.getPassword() != null && !isAlreadyHashed(user.getPassword()))
                .peek(user -> user.setPassword(passwordEncoder.encode(user.getPassword())))
                .toList();
            
            if (!usersToUpdate.isEmpty()) {
                usersRepository.saveAll(usersToUpdate);
                usersUpdated = usersToUpdate.size();
            }
            
            // Hash passwords in signup table
            List<Signup> signups = signupRepository.findAll();
            List<Signup> signupsToUpdate = signups.stream()
                .filter(signup -> signup.getPassword() != null && !isAlreadyHashed(signup.getPassword()))
                .peek(signup -> signup.setPassword(passwordEncoder.encode(signup.getPassword())))
                .toList();
            
            if (!signupsToUpdate.isEmpty()) {
                signupRepository.saveAll(signupsToUpdate);
                signupsUpdated = signupsToUpdate.size();
            }
            
            log.info("Migration process completed. Users: {}, Signups: {}", usersUpdated, signupsUpdated);
            
            return Map.of(
                "success", true,
                "message", "Migration completed successfully",
                "usersUpdated", usersUpdated,
                "signupsUpdated", signupsUpdated
            );
        } catch (Exception e) {
            log.error("Migration operation failed", e);
            return Map.of(
                "success", false,
                "message", "Migration operation failed"
            );
        }
    }
    
    private boolean isAlreadyHashed(String password) {
        if (password == null || password.length() < 50) {
            return false;
        }
        // Check if password matches BCrypt hash pattern
        return password.matches("^\\$2[ayb]\\$[0-9]{2}\\$[A-Za-z0-9./]{53}$");
    }
}