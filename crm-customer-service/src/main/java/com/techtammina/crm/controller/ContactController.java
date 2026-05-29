package com.techtammina.crm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.extern.slf4j.Slf4j;

import com.techtammina.crm.dto.ContactDTO;
import com.techtammina.crm.entity.Account;
import com.techtammina.crm.repository.AccountRepository;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.service.ContactService;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/contacts")
@Slf4j
public class ContactController {

    private static final Logger log = LoggerFactory.getLogger(ContactController.class);
    private final ContactService contactService;
    private final AccountRepository accountRepository;
    private final UsersRepository usersRepository;

    public ContactController(ContactService contactService, AccountRepository accountRepository, UsersRepository usersRepository) {
        this.contactService = contactService;
        this.accountRepository = accountRepository;
        this.usersRepository = usersRepository;
    }

    @PostMapping
    public ResponseEntity<ContactDTO> create(@Valid @RequestBody ContactDTO dto,
                                             @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        try {
            Integer userId = userIdStr != null ? Integer.parseInt(userIdStr) : 1;
            
            // If no accountId but has company name, find or create account
            if (dto.getAccountId() == null) {
                String companyName = dto.getCompanyName();
                if (companyName != null && !companyName.trim().isEmpty()) {
                    // Check if account exists for this specific executive
                    List<Account> userAccounts = accountRepository.findByCreatedBy(usersRepository.findById(userId).orElse(null));
                    Account existingAccount = null;
                    
                    // Find exact match within this executive's accounts
                    for (Account acc : userAccounts) {
                        if (acc.getAccountName().equalsIgnoreCase(companyName.trim())) {
                            existingAccount = acc;
                            break;
                        }
                    }
                    
                    if (existingAccount != null) {
                        dto.setAccountId(existingAccount.getAccountId());
                        log.info("Using existing account: {} (ID: {})", existingAccount.getAccountName(), existingAccount.getAccountId());
                    } else {
                        // Create new account
                        Account newAccount = new Account();
                        newAccount.setAccountName(companyName.trim());
                        newAccount.setIndustry("General");
                        newAccount.setCountry("Unknown");
                        newAccount.setCompanyLocation("Unknown");
                        newAccount.setReassignTo(usersRepository.findById(userId).orElse(null));
                        newAccount.setCreatedBy(usersRepository.findById(userId).orElse(null));
                        newAccount = accountRepository.save(newAccount);
                        dto.setAccountId(newAccount.getAccountId());
                        log.info("Created new account: {} (ID: {})", newAccount.getAccountName(), newAccount.getAccountId());
                    }
                } else {
                    // Create individual account
                    Account individualAccount = new Account();
                    individualAccount.setAccountName("Individual - " + dto.getFirstName() + " " + (dto.getLastName() != null ? dto.getLastName() : ""));
                    individualAccount.setIndustry("Individual");
                    individualAccount.setReassignTo(usersRepository.findById(userId).orElse(null));
                    individualAccount.setCreatedBy(usersRepository.findById(userId).orElse(null));
                    individualAccount = accountRepository.save(individualAccount);
                    dto.setAccountId(individualAccount.getAccountId());
                }
            }
            
            ContactDTO result = contactService.create(dto, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error creating contact: {}", e.getMessage());
            return ResponseEntity.status(500).body(new ContactDTO());
        }
    }
    
    @PostMapping("/smart-create")
    public ResponseEntity<Map<String, Object>> smartCreate(@RequestBody Map<String, Object> request,
                                                          @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
                                                          @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        try {
            Integer userId = null;
            if (userIdStr != null && !userIdStr.trim().isEmpty()) {
                try {
                    userId = Integer.parseInt(userIdStr);
                } catch (NumberFormatException e) {
                    userId = 1; // Default for testing
                }
            } else {
                userId = 1; // Default for testing
            }
            
            Map<String, Object> result = contactService.smartCreateContact(request, userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error in smart contact creation: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
    
    @GetMapping("/available-accounts")
    public ResponseEntity<List<Map<String, Object>>> getAvailableAccounts(
            @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        try {
            Integer userId = userIdStr != null ? Integer.parseInt(userIdStr) : 1;
            
            List<Account> accounts;
            if ("Sales_Executive".equals(userRole)) {
                // Sales Executive sees accounts they created or are assigned to
                accounts = accountRepository.findAll().stream()
                    .filter(acc -> (acc.getCreatedBy() != null && acc.getCreatedBy().getUserId().equals(userId)) ||
                                  (acc.getReassignTo() != null && acc.getReassignTo().getUserId().equals(userId)))
                    .collect(java.util.stream.Collectors.toList());
            } else {
                // Managers and above see all accounts
                accounts = accountRepository.findAll();
            }
            
            List<Map<String, Object>> accountOptions = accounts.stream()
                .map(acc -> {
                    Map<String, Object> option = new HashMap<>();
                    option.put("accountId", acc.getAccountId());
                    option.put("accountName", acc.getAccountName());
                    option.put("industry", acc.getIndustry());
                    option.put("companyLocation", acc.getCompanyLocation());
                    option.put("country", acc.getCountry());
                    return option;
                })
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(accountOptions);
        } catch (Exception e) {
            log.error("Error fetching available accounts: {}", e.getMessage());
            return ResponseEntity.ok(new java.util.ArrayList<>());
        }
    }
    
    @PostMapping("/create")
    public ResponseEntity<Map<String, Object>> createUnified(@RequestBody Map<String, Object> request,
                                                            @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        try {
            Integer userId = userIdStr != null ? Integer.parseInt(userIdStr) : 1;
            
            // Check if this is a smart create (has companyName) or regular create (has accountId)
            if (request.containsKey("companyName") && request.get("companyName") != null) {
                // Smart create
                Map<String, Object> result = contactService.smartCreateContact(request, userId);
                return ResponseEntity.ok(result);
            } else if (request.containsKey("accountId") && request.get("accountId") != null) {
                // Regular create - convert to DTO
                ContactDTO dto = new ContactDTO();
                dto.setFirstName((String) request.get("firstName"));
                dto.setLastName((String) request.get("lastName"));
                dto.setEmail((String) request.get("email"));
                dto.setPhoneNumber((String) request.get("phoneNumber"));

                dto.setDesignation((String) request.get("designation"));
                dto.setAccountId((Integer) request.get("accountId"));
                
                ContactDTO result = contactService.create(dto, userId);
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("contact", result);
                return ResponseEntity.ok(response);
            } else {
                throw new RuntimeException("Either companyName (for smart create) or accountId (for regular create) is required");
            }
        } catch (Exception e) {
            log.error("Error creating contact: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping
    public ResponseEntity<List<ContactDTO>> list(@RequestParam(required = false) Integer accountId,
                                                 @RequestParam(required = false) String q,
                                                 @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
                                                 @RequestHeader(value = "X-User-Role", required = false) String userRoleStr) {
        if (accountId != null) {
            return ResponseEntity.ok(contactService.listByAccountId(accountId));
        }

        // Parse headers
        Integer userId = null;
        if (userIdStr != null && !userIdStr.trim().isEmpty()) {
            try {
                userId = Integer.parseInt(userIdStr);
            } catch (NumberFormatException e) {
                // ignore
            }
        }
        String userRole = userRoleStr != null ? userRoleStr.trim() : null;

        // For testing: if no userId/role provided, use defaults
        if (userId == null || userId == 0) {
            userId = 1; // Default user for testing
            log.warn("No valid X-User-Id header provided, using default user ID: {}", userId);
        }
        if (userRole == null || userRole.trim().isEmpty()) {
            userRole = "Sales_Manager"; // Default role for testing
            log.warn("No X-User-Role header provided, using default role: {}", userRole);
        }

        List<ContactDTO> contacts = contactService.listFiltered(q, userId, userRole);
        log.info("ContactController returning {} contacts to frontend", contacts.size());
        return ResponseEntity.ok(contacts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContactDTO> get(@PathVariable Integer id) {
        return ResponseEntity.ok(contactService.get(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ContactDTO> update(@PathVariable Integer id,
                                           @Valid @RequestBody ContactDTO dto,
                                           @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        try {
            log.info("Updating contact {} with data: firstName={}, lastName={}, email={}, phoneNumber={}", 
                       id, dto.getFirstName(), dto.getLastName(), dto.getEmail(), dto.getPhoneNumber());
            Integer userId = null;
            if (userIdStr != null && !userIdStr.trim().isEmpty()) {
                try {
                    userId = Integer.parseInt(userIdStr);
                } catch (NumberFormatException e) {
                    // ignore
                }
            }
            ContactDTO result = contactService.update(id, dto, userId);
            log.info("Updated contact result: phoneNumber={}", result.getPhoneNumber());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            throw e;
        }
    }

    @PutMapping("/{id}/remarks")
    public ResponseEntity<ContactDTO> updateRemarks(@PathVariable Integer id,
                                                    @RequestBody Map<String, String> body,
                                                    @RequestHeader(value = "X-User-Id", required = false) String userIdStr,
                                                    @RequestHeader(value = "X-User-Role", required = false) String userRoleStr) {
        String remarks = body.get("remarks");
        if (remarks == null) {
            throw new RuntimeException("Remarks field is required");
        }
        Integer userId = null;
        if (userIdStr != null && !userIdStr.trim().isEmpty()) {
            try {
                userId = Integer.parseInt(userIdStr);
            } catch (NumberFormatException e) {
                // ignore
            }
        }
        String userRole = userRoleStr != null ? userRoleStr.trim() : null;
        ContactDTO result = contactService.updateRemarks(id, remarks, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/owner-email")
    public ResponseEntity<Map<String, String>> getOwnerEmail(@PathVariable Integer id) {
        String ownerEmail = contactService.getOwnerEmail(id);
        Map<String, String> response = new HashMap<>();
        response.put("ownerEmail", ownerEmail);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/stats")
    public ResponseEntity<Map<String, Object>> getContactStats(@PathVariable Integer id) {
        Map<String, Object> stats = contactService.getContactStats(id);
        return ResponseEntity.ok(stats);
    }
    
    @GetMapping("/by-account/{accountId}")
    public ResponseEntity<List<Map<String, Object>>> getContactsByAccount(@PathVariable Integer accountId) {
        List<ContactDTO> contacts = contactService.listByAccountId(accountId);
        List<Map<String, Object>> contactOptions = contacts.stream()
            .map(contact -> {
                Map<String, Object> option = new HashMap<>();
                option.put("contactId", contact.getContactId());
                option.put("name", contact.getFirstName() + " " + (contact.getLastName() != null ? contact.getLastName() : ""));
                option.put("email", contact.getEmail());
                option.put("designation", contact.getDesignation());
                return option;
            })
            .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(contactOptions);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> delete(@PathVariable Integer id) {
        contactService.delete(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Contact deleted successfully");
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/{id}/reassign")
    public ResponseEntity<Map<String, Object>> reassignContact(@PathVariable Integer id,
                                                              @RequestBody Map<String, Integer> request,
                                                              @RequestHeader(value = "X-User-Id", required = false) String userIdStr) {
        try {
            Integer newAssignedToId = request.get("assignedToId");
            if (newAssignedToId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "assignedToId is required"));
            }
            
            Integer currentUserId = userIdStr != null ? Integer.parseInt(userIdStr) : null;
            contactService.reassignContact(id, newAssignedToId, currentUserId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Contact reassigned successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error reassigning contact: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}


