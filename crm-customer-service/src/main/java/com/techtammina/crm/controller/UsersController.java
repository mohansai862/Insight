package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.service.UsersService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@Slf4j
public class UsersController {
    private static final Logger log = LoggerFactory.getLogger(UsersController.class);
    
    private final UsersService usersService;
    
    public UsersController(UsersService usersService) {
        this.usersService = usersService;
    }
    
    @GetMapping("/sales-vps")
    public ResponseEntity<List<Map<String, Object>>> getSalesVPs() {
        return ResponseEntity.ok(usersService.getSalesVPs());
    }
    
    @GetMapping("/sales-managers")
    public ResponseEntity<List<Map<String, Object>>> getSalesManagers() {
        return ResponseEntity.ok(usersService.getSalesManagers());
    }
    
    @GetMapping("/sales-executives")
    public ResponseEntity<List<Map<String, Object>>> getSalesExecutives() {
        return ResponseEntity.ok(usersService.getSalesExecutives());
    }
    
    @GetMapping("/leads/{executiveId}")
    public ResponseEntity<List<Map<String, Object>>> getLeadsByExecutive(@PathVariable Integer executiveId) {
        log.debug("Getting leads for executive ID: {}", executiveId);
        List<Map<String, Object>> leads = usersService.getLeadsByExecutive(executiveId);
        log.debug("Found {} leads for executive {}", leads.size(), executiveId);
        return ResponseEntity.ok(leads);
    }
    
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllUsers() {
        return ResponseEntity.ok(usersService.getAllUsers());
    }
    
    @GetMapping("/approved")
    public ResponseEntity<Map<String, Object>> getApprovedUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(usersService.getApprovedUsersWithFilters(search, status, role, startDate, endDate, page, size));
    }
    
    @PutMapping("/{userId}/toggle-status")
    public ResponseEntity<Map<String, Object>> toggleUserStatus(@PathVariable Integer userId) {
        try {
            boolean newStatus = usersService.toggleUserStatus(userId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("isActive", newStatus);
            response.put("message", newStatus ? "User enabled successfully" : "User disabled successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/organization-tree")
    public ResponseEntity<Map<String, Object>> getOrganizationTree() {
        return ResponseEntity.ok(usersService.getOrganizationTree());
    }
    

    
    @PostMapping("/preview-excel")
    public ResponseEntity<Map<String, Object>> previewUsersExcel(
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            log.info("Excel preview request received - filename: {}, size: {} bytes", 
                    file.getOriginalFilename(), file.getSize());
            
            Map<String, Object> result = usersService.previewUsersExcel(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Excel preview failed: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @PostMapping("/accept-excel-preview")
    public ResponseEntity<Map<String, Object>> acceptExcelPreview(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> users = (List<Map<String, Object>>) request.get("users");
            
            log.info("Excel preview acceptance request received for {} users", users.size());
            
            Map<String, Object> result = usersService.acceptExcelPreview(users);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Excel preview acceptance failed: {}", e.getMessage(), e);
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
}