package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.repository.UsersRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@Slf4j
public class ProfileController {
    private static final Logger log = LoggerFactory.getLogger(ProfileController.class);
    private final UsersRepository usersRepository;

    public ProfileController(UsersRepository usersRepository) {
        this.usersRepository = usersRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUserProfile(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        
        log.debug("Profile API - Received userIdStr: {}", userIdStr);
        
        Integer userId = null;
        if (userIdStr != null) {
            try {
                userId = Integer.parseInt(userIdStr);
            } catch (NumberFormatException e) {
                log.debug("Profile API - Invalid user ID format: {}", userIdStr);
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid user ID format"));
            }
        }
        
        if (userId == null) {
            log.debug("Profile API - No user ID provided, using default ID 1 for testing");
            userId = 1; // Default for testing
        }
        
        return getUserProfile(userId);
    }
    
    @GetMapping("/profile/{userId}")
    public ResponseEntity<Map<String, Object>> getUserProfile(@PathVariable Integer userId) {
        log.debug("Profile API - Looking for user with ID: {}", userId);
        
        var userOpt = usersRepository.findById(userId);
        if (!userOpt.isPresent()) {
            log.debug("Profile API - User not found with ID: {}", userId);
            return ResponseEntity.status(404).body(Map.of(
                "error", "User not found", 
                "message", "No user found with ID: " + userId,
                "userId", userId
            ));
        }
        
        var user = userOpt.get();
        log.debug("Profile API - Found user: {}, email: {}", user.getUsername(), user.getEmail());
        
        Map<String, Object> profile = new HashMap<>();
        profile.put("userId", user.getUserId());
        profile.put("username", user.getUsername());
        profile.put("email", user.getEmail());
        profile.put("role", user.getRole());
        
        // Construct full name: first_name + middle_name + last_name
        String firstName = user.getFirstName() != null ? user.getFirstName().trim() : "";
        String middleName = user.getMiddleName() != null ? user.getMiddleName().trim() : "";
        String lastName = user.getLastName() != null ? user.getLastName().trim() : "";
        
        StringBuilder fullNameBuilder = new StringBuilder();
        if (!firstName.isEmpty()) {
            fullNameBuilder.append(firstName);
        }
        if (!middleName.isEmpty()) {
            if (fullNameBuilder.length() > 0) fullNameBuilder.append(" ");
            fullNameBuilder.append(middleName);
        }
        if (!lastName.isEmpty()) {
            if (fullNameBuilder.length() > 0) fullNameBuilder.append(" ");
            fullNameBuilder.append(lastName);
        }
        
        String fullName = fullNameBuilder.toString();
        if (fullName.isEmpty()) {
            fullName = user.getUsername();
        }
        
        profile.put("firstName", firstName);
        profile.put("middleName", middleName);
        profile.put("lastName", lastName);
        profile.put("fullName", fullName);
        profile.put("countryCode", user.getCountryCode() != null ? user.getCountryCode() : "");
        profile.put("phoneNumber", user.getPhoneNumber() != null ? user.getPhoneNumber() : "");
        profile.put("gender", user.getGender() != null ? user.getGender().toString() : "");
        profile.put("createdAt", user.getCreatedAt() != null ? user.getCreatedAt().toString() : "");
        
        // Get manager name instead of ID
        String managerName = null;
        if (user.getManagerId() != null) {
            var managerOpt = usersRepository.findById(user.getManagerId());
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
        profile.put("managerName", managerName);
        profile.put("managerId", user.getManagerId());
        
        // Set avatar URL to null as it's not in the schema
        profile.put("avatarUrl", null);

        
        return ResponseEntity.ok(Map.of("data", profile));
    }
    
    @PutMapping("/me")
    public ResponseEntity<Map<String, Object>> updateCurrentUserProfile(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestBody Map<String, Object> updates) {
        
        if (userId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "User ID required"));
        }
        
        return updateUserProfile(userId, updates);
    }
    
    @PutMapping("/profile/{userId}")
    public ResponseEntity<Map<String, Object>> updateUserProfile(
            @PathVariable Integer userId, 
            @RequestBody Map<String, Object> updates) {
        
        var userOpt = usersRepository.findById(userId);
        if (!userOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        var user = userOpt.get();
        
        // Validate country code if provided
        if (updates.containsKey("countryCode")) {
            String countryCode = (String) updates.get("countryCode");
            if (countryCode != null && !countryCode.trim().isEmpty()) {
                // Normalize country code (handle both +91 and 91 formats)
                String normalizedCode = countryCode.startsWith("+") ? countryCode : "+" + countryCode;
                
                // Only allow our 4 supported country codes
                if (!normalizedCode.equals("+91") && !normalizedCode.equals("+1") && 
                    !normalizedCode.equals("+44") && !normalizedCode.equals("+49")) {
                    return ResponseEntity.badRequest().body(Map.of(
                        "error", "Invalid country code",
                        "message", "Only India (+91), US (+1), UK (+44), and Germany (+49) are supported"
                    ));
                }
                user.setCountryCode(normalizedCode);
            } else {
                user.setCountryCode(null);
            }
        }
        
        // Update other allowed fields in users table
        if (updates.containsKey("firstName")) {
            user.setFirstName((String) updates.get("firstName"));
        }
        if (updates.containsKey("lastName")) {
            user.setLastName((String) updates.get("lastName"));
        }
        if (updates.containsKey("middleName")) {
            user.setMiddleName((String) updates.get("middleName"));
        }
        if (updates.containsKey("phoneNumber")) {
            String phoneNumber = (String) updates.get("phoneNumber");
            // Clean phone number - only digits
            if (phoneNumber != null && !phoneNumber.trim().isEmpty()) {
                phoneNumber = phoneNumber.replaceAll("\\D", "");
            }
            user.setPhoneNumber(phoneNumber);
        }
        
        usersRepository.save(user);
        
        // Return updated profile
        return getUserProfile(userId);
    }
}