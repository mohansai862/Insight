package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.ContactDTO;
import com.techtammina.crm.dto.DealDTO;
import com.techtammina.crm.dto.LeadDTO;
import com.techtammina.crm.dto.UserDTO;
import com.techtammina.crm.service.CEOService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ceo")
@Slf4j
public class CEOController {
    private static final Logger log = LoggerFactory.getLogger(CEOController.class);
    private final CEOService ceoService;

    public CEOController(CEOService ceoService) {
        this.ceoService = ceoService;
    }

    @GetMapping("/leads")
    public ResponseEntity<Map<String, Object>> getCEOLeads(@RequestParam(required = false) String q,
                                                          @RequestParam(required = false) String status,
                                                          @RequestParam(required = false) String source,
                                                          @RequestParam(required = false) String startDate,
                                                          @RequestParam(required = false) String endDate,
                                                          @RequestParam(required = false) Integer salesVpId,
                                                          @RequestParam(required = false) Integer managerId,
                                                          @RequestParam(required = false) Integer executiveId,
                                                          @RequestHeader("X-User-Id") Integer userId,
                                                          @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getCEOLeads() called for userId: {}, role: {}, salesVpId: {}, managerId: {}, executiveId: {}", 
                userId, userRole, salesVpId, managerId, executiveId);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access CEO leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<LeadDTO> leads = ceoService.getLeadsForCEOWithFilters(userId, q, status, source, startDate, endDate, 
                salesVpId, managerId, executiveId);
        log.info("CEOController.getCEOLeads() returned {} leads", leads.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", leads);
        response.put("total", leads.size());
        response.put("page", 0);
        response.put("size", leads.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/deals")
    public ResponseEntity<Map<String, Object>> getCEODeals(@RequestParam(required = false) String q,
                                                          @RequestParam(required = false) String startDate,
                                                          @RequestParam(required = false) String endDate,
                                                          @RequestParam(required = false) Integer salesVpId,
                                                          @RequestParam(required = false) Integer managerId,
                                                          @RequestParam(required = false) Integer executiveId,
                                                          @RequestHeader("X-User-Id") Integer userId,
                                                          @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getCEODeals() called for userId: {}, role: {}, salesVpId: {}, managerId: {}, executiveId: {}, startDate: {}, endDate: {}", 
                userId, userRole, salesVpId, managerId, executiveId, startDate, endDate);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access CEO deals", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<DealDTO> deals = ceoService.getDealsForCEOWithFilters(userId, q, startDate, endDate, salesVpId, managerId, executiveId);
        log.info("CEOController.getCEODeals() returned {} deals", deals.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", deals);
        response.put("total", deals.size());
        response.put("page", 0);
        response.put("size", deals.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard/counts")
    public ResponseEntity<Map<String, Object>> getCEODashboardCounts(@RequestHeader("X-User-Id") Integer userId,
                                                                    @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getCEODashboardCounts() called for userId: {}, role: {}", userId, userRole);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access CEO dashboard", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        long dealsCount = ceoService.getDealsCountForCEO(userId);
        long leadsCount = ceoService.getLeadsCountForCEO(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("dealsCount", dealsCount);
        response.put("leadsCount", leadsCount);

        log.info("CEOController.getCEODashboardCounts() returned dealsCount: {}, leadsCount: {}", dealsCount, leadsCount);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/sales-vps")
    public ResponseEntity<Map<String, Object>> getSalesVPs(@RequestHeader("X-User-Id") Integer userId,
                                                          @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getSalesVPs() called for userId: {}, role: {}", userId, userRole);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access Sales VPs", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserDTO> salesVPs = ceoService.getAllSalesVPs();
        log.info("CEOController.getSalesVPs() returned {} Sales VPs", salesVPs.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", salesVPs);
        response.put("total", salesVPs.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/sales-vps/{salesVpId}/managers")
    public ResponseEntity<Map<String, Object>> getManagersUnderSalesVP(@PathVariable Integer salesVpId,
                                                                      @RequestHeader("X-User-Id") Integer userId,
                                                                      @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getManagersUnderSalesVP() called for salesVpId: {}, userId: {}, role: {}", salesVpId, userId, userRole);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access Sales VP managers", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserDTO> managers = ceoService.getManagersUnderSalesVP(salesVpId);
        log.info("CEOController.getManagersUnderSalesVP() returned {} managers", managers.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", managers);
        response.put("total", managers.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/contacts")
    public ResponseEntity<Map<String, Object>> getCEOContacts(@RequestParam(required = false) String q,
                                                             @RequestParam(required = false) String startDate,
                                                             @RequestParam(required = false) String endDate,
                                                             @RequestParam(required = false) Integer salesVpId,
                                                             @RequestParam(required = false) Integer managerId,
                                                             @RequestParam(required = false) Integer executiveId,
                                                             @RequestHeader("X-User-Id") Integer userId,
                                                             @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getCEOContacts() called for userId: {}, role: {}, salesVpId: {}, managerId: {}, executiveId: {}, startDate: {}, endDate: {}", 
                userId, userRole, salesVpId, managerId, executiveId, startDate, endDate);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access CEO contacts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ContactDTO> contacts = ceoService.getContactsForCEOWithFilters(userId, q, startDate, endDate, salesVpId, managerId, executiveId);
        log.info("CEOController.getCEOContacts() returned {} contacts", contacts.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", contacts);
        response.put("total", contacts.size());
        response.put("page", 0);
        response.put("size", contacts.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/sales-vps/{salesVpId}/leads")
    public ResponseEntity<Map<String, Object>> getLeadsForSalesVP(@PathVariable Integer salesVpId,
                                                                 @RequestParam(required = false) String q,
                                                                 @RequestParam(required = false) String status,
                                                                 @RequestParam(required = false) String source,
                                                                 @RequestParam(required = false) String startDate,
                                                                 @RequestParam(required = false) String endDate,
                                                                 @RequestHeader("X-User-Id") Integer userId,
                                                                 @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getLeadsForSalesVP() called for salesVpId: {}, userId: {}, role: {}", salesVpId, userId, userRole);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access Sales VP leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<LeadDTO> leads = ceoService.getLeadsForSpecificSalesVP(salesVpId, q, status, source, startDate, endDate);
        log.info("CEOController.getLeadsForSalesVP() returned {} leads", leads.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", leads);
        response.put("total", leads.size());
        response.put("page", 0);
        response.put("size", leads.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/sales-vps/{salesVpId}/contacts")
    public ResponseEntity<Map<String, Object>> getContactsForSalesVP(@PathVariable Integer salesVpId,
                                                                    @RequestParam(required = false) String q,
                                                                    @RequestHeader("X-User-Id") Integer userId,
                                                                    @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getContactsForSalesVP() called for salesVpId: {}, userId: {}, role: {}", salesVpId, userId, userRole);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access Sales VP contacts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ContactDTO> contacts = ceoService.getContactsForSpecificSalesVP(salesVpId, q);
        log.info("CEOController.getContactsForSalesVP() returned {} contacts", contacts.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", contacts);
        response.put("total", contacts.size());
        response.put("page", 0);
        response.put("size", contacts.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/managers/{managerId}/executives")
    public ResponseEntity<Map<String, Object>> getExecutivesUnderManager(@PathVariable Integer managerId,
                                                                         @RequestHeader("X-User-Id") Integer userId,
                                                                         @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getExecutivesUnderManager() called for managerId: {}, userId: {}, role: {}", managerId, userId, userRole);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access manager executives", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserDTO> executives = ceoService.getExecutivesUnderManager(managerId);
        log.info("CEOController.getExecutivesUnderManager() returned {} executives", executives.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", executives);
        response.put("total", executives.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/accounts")
    public ResponseEntity<Map<String, Object>> getCEOAccounts(@RequestParam(required = false) String q,
                                                             @RequestParam(required = false) String startDate,
                                                             @RequestParam(required = false) String endDate,
                                                             @RequestParam(required = false) Integer salesVpId,
                                                             @RequestParam(required = false) Integer managerId,
                                                             @RequestParam(required = false) Integer executiveId,
                                                             @RequestHeader("X-User-Id") Integer userId,
                                                             @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getCEOAccounts() called for userId: {}, role: {}, salesVpId: {}, managerId: {}, executiveId: {}, startDate: {}, endDate: {}", 
                userId, userRole, salesVpId, managerId, executiveId, startDate, endDate);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access CEO accounts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ContactDTO> accounts = ceoService.getAccountsForCEOWithFilters(userId, q, startDate, endDate, salesVpId, managerId, executiveId);
        log.info("CEOController.getCEOAccounts() returned {} accounts", accounts.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", accounts);
        response.put("total", accounts.size());
        response.put("page", 0);
        response.put("size", accounts.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/accounts/{accountId}")
    public ResponseEntity<Map<String, Object>> getCEOAccountDetails(@PathVariable String accountId,
                                                                   @RequestHeader("X-User-Id") Integer userId,
                                                                   @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getCEOAccountDetails() called for accountId: {}, userId: {}, role: {}", accountId, userId, userRole);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access CEO account details", userId, userRole);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Access denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        }

        try {
            // Validate accountId is a valid integer
            Integer accountIdInt;
            try {
                accountIdInt = Integer.parseInt(accountId);
            } catch (NumberFormatException e) {
                log.warn("Invalid account ID format: {}", accountId);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid account ID format");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            ContactDTO account = ceoService.getAccountDetailsForCEO(userId, accountIdInt);
            if (account == null) {
                log.warn("Account not found for ID: {}", accountIdInt);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Account not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
            log.info("CEOController.getCEOAccountDetails() returned account details for ID: {}", accountIdInt);

            Map<String, Object> response = new HashMap<>();
            response.put("data", account);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get account details for ID: {}", accountId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load account details: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/contacts/{contactId}")
    public ResponseEntity<Map<String, Object>> getCEOContactDetails(@PathVariable String contactId,
                                                                   @RequestHeader("X-User-Id") Integer userId,
                                                                   @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getCEOContactDetails() called for contactId: {}, userId: {}, role: {}", contactId, userId, userRole);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access CEO contact details", userId, userRole);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Access denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        }

        try {
            // Validate contactId is a valid integer
            Integer contactIdInt;
            try {
                contactIdInt = Integer.parseInt(contactId);
            } catch (NumberFormatException e) {
                log.warn("Invalid contactId format: {}", contactId);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid contact ID format");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            ContactDTO contact = ceoService.getContactDetailsForCEO(userId, contactIdInt);
            if (contact == null) {
                log.warn("Contact not found for ID: {}", contactIdInt);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Contact not found");
                errorResponse.put("message", "The requested contact does not exist or you don't have access to it");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
            log.info("CEOController.getCEOContactDetails() returned contact details for ID: {}", contactIdInt);

            Map<String, Object> response = new HashMap<>();
            response.put("data", contact);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get contact details for ID: {}", contactId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load contact details: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping("/leads/{leadId}")
    public ResponseEntity<Map<String, Object>> getCEOLeadDetails(@PathVariable String leadId,
                                                                @RequestHeader("X-User-Id") Integer userId,
                                                                @RequestHeader("X-User-Role") String userRole) {
        log.info("CEOController.getCEOLeadDetails() called for leadId: {}, userId: {}, role: {}", leadId, userId, userRole);

        if (!"CEO".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access CEO lead details", userId, userRole);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Access denied");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        }

        try {
            // Validate leadId is a valid integer
            Integer leadIdInt;
            try {
                leadIdInt = Integer.parseInt(leadId);
            } catch (NumberFormatException e) {
                log.warn("Invalid lead ID format: {}", leadId);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Invalid lead ID format");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            LeadDTO lead = ceoService.getLeadDetailsForCEO(userId, leadIdInt);
            if (lead == null) {
                log.warn("Lead not found for ID: {}", leadIdInt);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "Lead not found");
                errorResponse.put("message", "The requested lead does not exist or you don't have access to it");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }
            
            log.info("CEOController.getCEOLeadDetails() returned lead details for ID: {}", leadIdInt);

            Map<String, Object> response = new HashMap<>();
            response.put("data", lead);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Failed to get lead details for ID: {}", leadId, e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to load lead details: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
}