package com.techtammina.crm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.AccountDTO;
import com.techtammina.crm.service.AccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private static final Logger log = LoggerFactory.getLogger(AccountController.class);
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody AccountDTO dto, HttpServletRequest request) {
        log.info("Ã°Å¸Å¡â‚¬ Account creation request received");
        log.info("Ã°Å¸â€œâ€¹ Request data: accountName={}, email={}, contactName={}, country={}", 
                   dto.getAccountName(), dto.getEmail(), dto.getContactName(), dto.getCountry());
        
        try {
            // Validate required fields
            if (dto.getAccountName() == null || dto.getAccountName().trim().isEmpty()) {
                log.warn("Ã¢ÂÅ’ Validation failed: Account name is required");
                return ResponseEntity.badRequest().body(Map.of("error", "Please enter valid details Ã¢â‚¬â€ Account name is required"));
            }
            if (dto.getContactName() == null || dto.getContactName().trim().isEmpty()) {
                log.warn("Ã¢ÂÅ’ Validation failed: Contact name is required");
                return ResponseEntity.badRequest().body(Map.of("error", "Please enter valid details Ã¢â‚¬â€ Contact name is required"));
            }
            if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
                log.warn("Ã¢ÂÅ’ Validation failed: Email is required");
                return ResponseEntity.badRequest().body(Map.of("error", "Please enter valid details Ã¢â‚¬â€ Email is required"));
            }
            if (dto.getCountry() == null || dto.getCountry().trim().isEmpty()) {
                log.warn("Ã¢ÂÅ’ Validation failed: Country is required");
                return ResponseEntity.badRequest().body(Map.of("error", "Please enter valid details Ã¢â‚¬â€ Country is required"));
            }
            
            // Validate email format
            if (!dto.getEmail().matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Please enter valid details Ã¢â‚¬â€ Invalid email format"));
            }
            
            // Validate phone numbers (digits only, length 7-15)
            if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().trim().isEmpty()) {
                String phoneNumber = dto.getPhoneNumber().replaceAll("[^0-9]", "");
                if (phoneNumber.length() < 10 || phoneNumber.length() > 15) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Please enter valid details Ã¢â‚¬â€ Phone number must be 10-15 digits"));
                }
                dto.setPhoneNumber(phoneNumber);
            }

            
            if (dto.getMobile() != null && !dto.getMobile().trim().isEmpty()) {
                String mobile = dto.getMobile().replaceAll("[^0-9]", "");
                if (mobile.length() < 10 || mobile.length() > 15) {
                    return ResponseEntity.badRequest().body(Map.of("error", "Please enter valid details Ã¢â‚¬â€ Mobile number must be 10-15 digits"));
                }
                dto.setMobile(mobile);
            }
            
            // Sanitize inputs
            dto.setAccountName(dto.getAccountName().trim());
            dto.setContactName(dto.getContactName().trim());
            dto.setEmail(dto.getEmail().trim().toLowerCase());
            if (dto.getIndustry() != null) dto.setIndustry(dto.getIndustry().trim());
            if (dto.getCountry() != null) dto.setCountry(dto.getCountry().trim());
            if (dto.getCompanyLocation() != null) dto.setCompanyLocation(dto.getCompanyLocation().trim());
            
            Integer userId = (Integer) request.getAttribute("userId");
            if (userId == null) userId = 1; // Default for testing
            dto.setCreatedBy(userId);
            dto.setReassignTo(userId); // Set reassign to current user
            
            log.info("Ã¢Å“â€¦ Validation passed, calling service to create account");
            AccountDTO created = accountService.create(dto);
            log.info("Ã°Å¸Å½â€° Account created successfully with ID: {}", created.getAccountId());
            
            return ResponseEntity.status(201).body(created);
            
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Email already exists")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already exists"));
            }
            log.error("Error creating account", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create account: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Error creating account", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create account: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<AccountDTO>> list(@RequestParam(required = false) String q,
                                                 @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                 @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // For testing: if no userId/role provided or empty, use defaults
        if (userId == null) {
            userId = 1; // Default user for testing
            log.warn("No X-User-Id header provided, using default user ID: {}", userId);
        }
        if (userRole == null || userRole.trim().isEmpty()) {
            userRole = "Sales_Manager"; // Default role for testing
            log.warn("No X-User-Role header provided or empty, using default role: {}", userRole);
        }

        return ResponseEntity.ok(accountService.listFiltered(q, userId, userRole));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(accountService.get(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountDTO> update(@PathVariable Integer id, @RequestBody AccountDTO dto) {
        return ResponseEntity.ok(accountService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id,
                                      @RequestParam(name = "force", defaultValue = "false") boolean force,
                                      @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                      @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        try {
            // Default values for testing
            if (userId == null) userId = 1;
            if (userRole == null || userRole.trim().isEmpty()) userRole = "Sales_Manager";

            accountService.delete(id, force);
            log.info("Account deleted successfully with ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Business error deleting account with ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(403).build();
        } catch (Exception e) {
            log.error("Error deleting account with ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{sourceAccountId}/reassign/{targetAccountId}")
    public ResponseEntity<Void> reassign(
            @PathVariable Integer sourceAccountId,
            @PathVariable Integer targetAccountId,
            @RequestParam(name = "moveContacts", defaultValue = "true") boolean moveContacts,
            @RequestParam(name = "deleteSource", defaultValue = "false") boolean deleteSource
    ) {
        accountService.reassign(sourceAccountId, targetAccountId, moveContacts, deleteSource);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/create-sample")
    public ResponseEntity<String> createSampleAccount(@RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                     @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        try {
            if (userId == null) userId = 1;
            if (userRole == null || userRole.trim().isEmpty()) userRole = "Sales_Manager";
            
            AccountDTO sampleAccount = new AccountDTO();
            sampleAccount.setAccountName("Sample Company " + System.currentTimeMillis());
            sampleAccount.setIndustry("Technology");
            sampleAccount.setCountry("USA");
            sampleAccount.setCompanyLocation("New York");
            sampleAccount.setContactName("Sample Contact");
            sampleAccount.setEmail("contact@sample" + System.currentTimeMillis() + ".com");
            sampleAccount.setPhoneNumber("+1-555-0123");
            sampleAccount.setCreatedBy(userId);
            sampleAccount.setReassignTo(userId);
            
            AccountDTO created = accountService.create(sampleAccount);
            return ResponseEntity.ok("Sample account created: " + created.getAccountName() + " (ID: " + created.getAccountId() + ")");
        } catch (Exception e) {
            log.error("Error creating sample account", e);
            return ResponseEntity.status(500).body("Failed to create sample account: " + e.getMessage());
        }
    }

    @GetMapping("/debug")
    public ResponseEntity<String> debugAccounts(@RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                               @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        try {
            List<AccountDTO> accounts = accountService.listFiltered(null, userId != null ? userId : 1, userRole != null ? userRole : "Sales_Manager");
            return ResponseEntity.ok("Debug: Found " + accounts.size() + " accounts");
        } catch (Exception e) {
            log.error("Error in debug", e);
            return ResponseEntity.status(500).body("Debug failed: " + e.getMessage());
        }
    }
    
    @PostMapping("/test-create")
    public ResponseEntity<String> testCreate() {
        try {
            AccountDTO testAccount = new AccountDTO();
            testAccount.setAccountName("Test Account " + System.currentTimeMillis());
            testAccount.setContactName("Test Contact");
            testAccount.setEmail("test@example.com");
            testAccount.setCountry("India");
            testAccount.setCompanyLocation("Mumbai");
            testAccount.setIndustry("Technology");
            testAccount.setCreatedBy(1);
            testAccount.setReassignTo(1);
            
            AccountDTO created = accountService.create(testAccount);
            return ResponseEntity.ok("Test account created successfully with ID: " + created.getAccountId());
        } catch (Exception e) {
            log.error("Test account creation failed", e);
            return ResponseEntity.status(500).body("Test failed: " + e.getMessage());
        }
    }
    
    @GetMapping("/{id}/revenue")
    public ResponseEntity<Map<String, Object>> getAccountRevenue(@PathVariable Integer id) {
        Double revenue = accountService.calculateRevenue(id);
        return ResponseEntity.ok(Map.of("revenue", revenue != null ? revenue : 0.0));
    }
    
    @GetMapping("/{id}/total-deal-value")
    public ResponseEntity<Map<String, Object>> getTotalDealValue(@PathVariable Integer id) {
        Double totalDealValue = accountService.calculateTotalDealValue(id);
        return ResponseEntity.ok(Map.of("totalDealValue", totalDealValue != null ? totalDealValue : 0.0));
    }
    
    @GetMapping("/{id}/revenue/debug")
    public ResponseEntity<Map<String, Object>> debugAccountRevenue(@PathVariable Integer id) {
        return ResponseEntity.ok(accountService.debugRevenue(id));
    }
}


