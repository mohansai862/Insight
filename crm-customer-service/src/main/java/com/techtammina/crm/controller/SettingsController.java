package com.techtammina.crm.controller;

import com.techtammina.crm.service.SettingsService;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.stereotype.Controller;

import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin(origins = "http://30.0.1.159:4201")
public class SettingsController {
    private final SettingsService settingsService;
    private final UsersRepository usersRepository;

    public SettingsController(SettingsService settingsService, UsersRepository usersRepository) {
        this.settingsService = settingsService;
        this.usersRepository = usersRepository;
    }

    @GetMapping("/{role}")
    public ResponseEntity<Map<String, Object>> getSettingsByRole(
            @PathVariable String role,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        // Parse user ID and get actual role from database
        String actualUserRole = userRole;
        if (userIdStr != null && !userIdStr.trim().isEmpty()) {
            try {
                Integer userId = Integer.parseInt(userIdStr);
                var userOpt = usersRepository.findById(userId);
                if (userOpt.isPresent()) {
                    actualUserRole = userOpt.get().getRole();
                }
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid user ID format"));
            }
        }
        
        // Validate user can access settings for this role
        if (!settingsService.canAccessRole(actualUserRole, role)) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Access denied");
            errorResponse.put("message", "You don't have permission to access settings for role: " + role);
            errorResponse.put("userRole", actualUserRole);
            errorResponse.put("requestedRole", role);
            return ResponseEntity.status(403).body(errorResponse);
        }
        
        Map<String, Object> response = settingsService.getSettingsForRole(role);
        response.put("accessGrantedBy", actualUserRole);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/current")
    public ResponseEntity<Map<String, Object>> getCurrentUserSettings(
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        
        // Parse and validate user ID
        Integer userId = null;
        if (userIdStr != null && !userIdStr.trim().isEmpty()) {
            try {
                userId = Integer.parseInt(userIdStr);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid user ID format"));
            }
        }
        
        // Get real user data from database if user ID is provided
        String actualRole = userRole;
        if (userId != null) {
            var userOpt = usersRepository.findById(userId);
            if (userOpt.isPresent()) {
                actualRole = userOpt.get().getRole();
            }
        }
        
        // Fallback to provided role or default
        if (actualRole == null || actualRole.trim().isEmpty()) {
            actualRole = userRole != null ? userRole : "sales_executive";
        }
        
        // Validate and normalize role
        String normalizedRole = actualRole.toLowerCase().replace(" ", "_");
        
        Map<String, Object> response = settingsService.getSettingsForRole(normalizedRole);
        response.put("userId", userId);
        response.put("actualRole", actualRole);
        response.put("normalizedRole", normalizedRole);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Settings controller is working");
    }
}

