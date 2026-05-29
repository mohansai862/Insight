package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.LeadDTO;
import com.techtammina.crm.dto.ContactDTO;
import com.techtammina.crm.dto.UserDTO;
import com.techtammina.crm.service.SalesManagerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/sales-manager")
@Slf4j
public class SalesManagerController {
    private static final Logger log = LoggerFactory.getLogger(SalesManagerController.class);
    private final SalesManagerService salesManagerService;

    public SalesManagerController(SalesManagerService salesManagerService) {
        this.salesManagerService = salesManagerService;
    }

    @GetMapping("/executives")
    public ResponseEntity<Map<String, Object>> getExecutives(@RequestHeader("X-User-Id") Integer userId,
                                                             @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getExecutives() called for userId: {}, role: {}", userId, userRole);

        // Check if user is Sales Manager or Sales VP
        if (!"Sales_Manager".equals(userRole) && !"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access executives", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserDTO> result;
        if ("Sales_VP".equals(userRole)) {
            // Sales VP can see all managers under them
            result = salesManagerService.getManagersUnderVP(userId);
        } else {
            // Sales Manager can only see executives under them
            result = salesManagerService.getExecutivesUnderManager(userId);
        }
        log.info("SalesManagerController.getExecutives() returned {} items", result.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", result);
        response.put("total", result.size());
        response.put("page", 0);
        response.put("size", result.size());

        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/vp/leads")
    public ResponseEntity<Map<String, Object>> getVPLeads(@RequestParam(required = false) String q,
                                                          @RequestHeader("X-User-Id") Integer userId,
                                                          @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getVPLeads() called for userId: {}, role: {}", userId, userRole);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<LeadDTO> leads = salesManagerService.getLeadsForVP(userId, q);
        log.info("SalesManagerController.getVPLeads() returned {} leads", leads.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", leads);
        response.put("total", leads.size());
        response.put("page", 0);
        response.put("size", leads.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/manager/executives/{executiveId}/leads")
    public ResponseEntity<Map<String, Object>> getExecutiveLeads(@PathVariable Integer executiveId,
                                                                 @RequestParam(required = false) String q,
                                                                 @RequestParam(required = false, defaultValue = "0") int page,
                                                                 @RequestParam(required = false, defaultValue = "10") int size,
                                                                 @RequestParam(required = false, defaultValue = "createdAt") String sort,
                                                                 @RequestParam(required = false, defaultValue = "desc") String order,
                                                                 @RequestParam(required = false) String status,
                                                                 @RequestParam(required = false) String source,
                                                                 @RequestParam(required = false) String startDate,
                                                                 @RequestParam(required = false) String endDate,
                                                                 @RequestHeader("X-User-Id") Integer userId,
                                                                 @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getExecutiveLeads() called for executiveId: {}, userId: {}, role: {}, page: {}, size: {}, status: {}, source: {}, startDate: {}, endDate: {}", executiveId, userId, userRole, page, size, status, source, startDate, endDate);

        // Check if user is Sales Manager or Sales VP
        if (!"Sales_Manager".equals(userRole) && !"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access executive leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Verify that the executive belongs to this manager (skip for Sales VP)
        if ("Sales_Manager".equals(userRole) && !salesManagerService.isExecutiveUnderManager(executiveId, userId)) {
            log.warn("Access denied: Executive {} does not belong to manager {}", executiveId, userId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Map<String, Object> result = salesManagerService.getLeadsForExecutiveWithPagination(executiveId, q, status, source, startDate, endDate, page, size);
        log.info("SalesManagerController.getExecutiveLeads() returned {} leads", ((List<?>) result.get("data")).size());

        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/manager/{managerId}/executives")
    public ResponseEntity<Map<String, Object>> getExecutivesUnderManager(@PathVariable Integer managerId,
                                                                         @RequestHeader("X-User-Id") Integer userId,
                                                                         @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getExecutivesUnderManager() called for managerId: {}, userId: {}, role: {}", managerId, userId, userRole);

        // Check if user is Sales VP or Sales Manager
        if (!"Sales_Manager".equals(userRole) && !"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access manager executives", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserDTO> executives = salesManagerService.getExecutivesUnderManager(managerId);
        log.info("SalesManagerController.getExecutivesUnderManager() returned {} executives", executives.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", executives);
        response.put("total", executives.size());
        response.put("page", 0);
        response.put("size", executives.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/manager/{managerId}/leads")
    public ResponseEntity<Map<String, Object>> getManagerLeads(@PathVariable Integer managerId,
                                                               @RequestParam(required = false) String q,
                                                               @RequestParam(required = false, defaultValue = "createdAt") String sort,
                                                               @RequestParam(required = false, defaultValue = "desc") String order,
                                                               @RequestHeader("X-User-Id") Integer userId,
                                                               @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getManagerLeads() called for managerId: {}, userId: {}, role: {}", managerId, userId, userRole);

        // Check if user is Sales VP
        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access manager leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<LeadDTO> leads = salesManagerService.getLeadsForManager(managerId, q);
        log.info("SalesManagerController.getManagerLeads() returned {} leads", leads.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", leads);
        response.put("total", leads.size());
        response.put("page", 0);
        response.put("size", leads.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/leads")
    public ResponseEntity<Map<String, Object>> getManagerLeadsForSalesManager(@RequestParam(required = false) String q,
                                                                              @RequestParam(required = false, defaultValue = "0") int page,
                                                                              @RequestParam(required = false, defaultValue = "10") int size,
                                                                              @RequestParam(required = false) String status,
                                                                              @RequestParam(required = false) String source,
                                                                              @RequestParam(required = false) String startDate,
                                                                              @RequestParam(required = false) String endDate,
                                                                              @RequestHeader("X-User-Id") Integer userId,
                                                                              @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getManagerLeadsForSalesManager() called for userId: {}, role: {}, page: {}, size: {}, status: {}, source: {}, startDate: {}, endDate: {}", userId, userRole, page, size, status, source, startDate, endDate);

        // Check if user is Sales Manager
        if (!"Sales_Manager".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access manager leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Map<String, Object> result = salesManagerService.getLeadsForManagerWithPagination(userId, q, status, source, startDate, endDate, page, size);
        log.info("SalesManagerController.getManagerLeadsForSalesManager() returned {} leads", ((List<?>) result.get("data")).size());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/my-leads")
    public ResponseEntity<Map<String, Object>> getMyLeads(@RequestParam(required = false) String q,
                                                          @RequestParam(required = false, defaultValue = "0") int page,
                                                          @RequestParam(required = false, defaultValue = "10") int size,
                                                          @RequestParam(required = false) String status,
                                                          @RequestParam(required = false) String source,
                                                          @RequestParam(required = false) String startDate,
                                                          @RequestParam(required = false) String endDate,
                                                          @RequestHeader("X-User-Id") Integer userId,
                                                          @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getMyLeads() called for userId: {}, role: {}, page: {}, size: {}", userId, userRole, page, size);

        // Check if user is Sales Manager
        if (!"Sales_Manager".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access my leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Map<String, Object> result = salesManagerService.getMyLeadsWithPagination(userId, q, status, source, startDate, endDate, page, size);
        log.info("SalesManagerController.getMyLeads() returned {} leads", ((List<?>) result.get("data")).size());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/vp-leads")
    public ResponseEntity<Map<String, Object>> getVPLeads(@RequestParam(required = false) String q,
                                                          @RequestParam(required = false, defaultValue = "0") int page,
                                                          @RequestParam(required = false, defaultValue = "10") int size,
                                                          @RequestParam(required = false) String status,
                                                          @RequestParam(required = false) String source,
                                                          @RequestParam(required = false) String startDate,
                                                          @RequestParam(required = false) String endDate,
                                                          @RequestHeader("X-User-Id") Integer userId,
                                                          @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getVPLeads() called for userId: {}, role: {}, page: {}, size: {}", userId, userRole, page, size);

        // Check if user is Sales Manager
        if (!"Sales_Manager".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Map<String, Object> result = salesManagerService.getVPLeadsWithPagination(userId, q, status, source, startDate, endDate, page, size);
        log.info("SalesManagerController.getVPLeads() returned {} leads", ((List<?>) result.get("data")).size());

        return ResponseEntity.ok(result);
    }

    @GetMapping("/assignable-executives")
    public ResponseEntity<Map<String, Object>> getAssignableExecutives(@RequestHeader("X-User-Id") Integer userId,
                                                                       @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getAssignableExecutives() called for userId: {}, role: {}", userId, userRole);

        // Check if user is Sales Manager or Sales VP
        if (!"Sales_Manager".equals(userRole) && !"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to get assignable executives", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserDTO> assignableUsers;
        if ("Sales_VP".equals(userRole)) {
            // Sales VP can assign to Sales Managers under them
            assignableUsers = salesManagerService.getManagersUnderVP(userId);
        } else {
            // Sales Manager can only assign to executives under them
            assignableUsers = salesManagerService.getExecutivesUnderManager(userId);
        }

        log.info("SalesManagerController.getAssignableExecutives() returned {} assignable users", assignableUsers.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", assignableUsers);
        response.put("total", assignableUsers.size());
        response.put("page", 0);
        response.put("size", assignableUsers.size());

        return ResponseEntity.ok(response);
    }

    // Contact endpoints
    @GetMapping("/my-contacts")
    public ResponseEntity<Map<String, Object>> getMyContacts(@RequestParam(required = false) String q,
                                                             @RequestParam(required = false) String startDate,
                                                             @RequestParam(required = false) String endDate,
                                                             @RequestHeader("X-User-Id") Integer userId,
                                                             @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getMyContacts() called for userId: {}, role: {}", userId, userRole);

        // Check if user is Sales Manager
        if (!"Sales_Manager".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access my contacts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ContactDTO> contacts = salesManagerService.getMyContactsWithFilters(userId, q, startDate, endDate);
        log.info("SalesManagerController.getMyContacts() returned {} contacts", contacts.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", contacts);
        response.put("totalElements", contacts.size());
        response.put("totalPages", 1);
        response.put("currentPage", 0);
        response.put("size", contacts.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/vp-contacts")
    public ResponseEntity<Map<String, Object>> getVPContacts(@RequestParam(required = false) String q,
                                                             @RequestParam(required = false) String startDate,
                                                             @RequestParam(required = false) String endDate,
                                                             @RequestHeader("X-User-Id") Integer userId,
                                                             @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getVPContacts() called for userId: {}, role: {}", userId, userRole);

        // Check if user is Sales Manager
        if (!"Sales_Manager".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP contacts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ContactDTO> contacts = salesManagerService.getVPContactsWithFilters(userId, q, startDate, endDate);
        log.info("SalesManagerController.getVPContacts() returned {} contacts", contacts.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", contacts);
        response.put("totalElements", contacts.size());
        response.put("totalPages", 1);
        response.put("currentPage", 0);
        response.put("size", contacts.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/manager/executives/{executiveId}/contacts")
    public ResponseEntity<Map<String, Object>> getExecutiveContacts(@PathVariable Integer executiveId,
                                                                    @RequestParam(required = false) String q,
                                                                    @RequestParam(required = false) String startDate,
                                                                    @RequestParam(required = false) String endDate,
                                                                    @RequestHeader("X-User-Id") Integer userId,
                                                                    @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesManagerController.getExecutiveContacts() called for executiveId: {}, userId: {}, role: {}", executiveId, userId, userRole);

        // Check if user is Sales Manager or Sales VP
        if (!"Sales_Manager".equals(userRole) && !"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access executive contacts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Verify that the executive belongs to this manager (skip for Sales VP)
        if ("Sales_Manager".equals(userRole) && !salesManagerService.isExecutiveUnderManager(executiveId, userId)) {
            log.warn("Access denied: Executive {} does not belong to manager {}", executiveId, userId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ContactDTO> contacts = salesManagerService.getContactsForExecutiveWithFilters(executiveId, q, startDate, endDate);
        log.info("SalesManagerController.getExecutiveContacts() returned {} contacts", contacts.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", contacts);
        response.put("totalElements", contacts.size());
        response.put("totalPages", 1);
        response.put("currentPage", 0);
        response.put("size", contacts.size());

        return ResponseEntity.ok(response);
    }
}