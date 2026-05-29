package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.ContactDTO;
import com.techtammina.crm.dto.DealDTO;
import com.techtammina.crm.dto.LeadDTO;
import com.techtammina.crm.dto.UserDTO;
import com.techtammina.crm.service.SalesVPService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales-vp")
@Slf4j
public class SalesVPController {
    private static final Logger log = LoggerFactory.getLogger(SalesVPController.class);
    private final SalesVPService salesVPService;

    public SalesVPController(SalesVPService salesVPService) {
        this.salesVPService = salesVPService;
    }

    @GetMapping("/leads")
    public ResponseEntity<Map<String, Object>> getVPLeads(@RequestParam(required = false) String q,
                                                          @RequestParam(required = false) String status,
                                                          @RequestParam(required = false) String source,
                                                          @RequestParam(required = false) String startDate,
                                                          @RequestParam(required = false) String endDate,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size,
                                                          @RequestHeader("X-User-Id") Integer userId,
                                                          @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getVPLeads() called for userId: {}, role: {}, status: {}, source: {}, startDate: {}, endDate: {}, page: {}, size: {}", userId, userRole, status, source, startDate, endDate, page, size);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Map<String, Object> response = salesVPService.getLeadsForVPWithFiltersAndPagination(userId, q, status, source, startDate, endDate, page, size);
        log.info("SalesVPController.getVPLeads() returned paginated response");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-leads")
    public ResponseEntity<Map<String, Object>> getMyLeads(@RequestParam(required = false) String q,
                                                          @RequestParam(required = false) String status,
                                                          @RequestParam(required = false) String source,
                                                          @RequestParam(required = false) String startDate,
                                                          @RequestParam(required = false) String endDate,
                                                          @RequestParam(defaultValue = "0") int page,
                                                          @RequestParam(defaultValue = "10") int size,
                                                          @RequestHeader("X-User-Id") Integer userId,
                                                          @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getMyLeads() called for userId: {}, role: {}, status: {}, source: {}, startDate: {}, endDate: {}, page: {}, size: {}", userId, userRole, status, source, startDate, endDate, page, size);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP my leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Map<String, Object> response = salesVPService.getMyLeadsWithFiltersAndPagination(userId, q, status, source, startDate, endDate, page, size);
        log.info("SalesVPController.getMyLeads() returned paginated response");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/deals")
    public ResponseEntity<Map<String, Object>> getVPDeals(@RequestParam(required = false) String q,
                                                          @RequestHeader("X-User-Id") Integer userId,
                                                          @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getVPDeals() called for userId: {}, role: {}", userId, userRole);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP deals", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<DealDTO> deals = salesVPService.getDealsForVP(userId, q);
        log.info("SalesVPController.getVPDeals() returned {} deals", deals.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", deals);
        response.put("total", deals.size());
        response.put("page", 0);
        response.put("size", deals.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard/counts")
    public ResponseEntity<Map<String, Object>> getVPDashboardCounts(@RequestHeader("X-User-Id") Integer userId,
                                                                    @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getVPDashboardCounts() called for userId: {}, role: {}", userId, userRole);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP dashboard", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        long dealsCount = salesVPService.getDealsCountForVP(userId);
        long leadsCount = salesVPService.getLeadsCountForVP(userId);

        Map<String, Object> response = new HashMap<>();
        response.put("dealsCount", dealsCount);
        response.put("leadsCount", leadsCount);

        log.info("SalesVPController.getVPDashboardCounts() returned dealsCount: {}, leadsCount: {}", dealsCount, leadsCount);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/managers")
    public ResponseEntity<Map<String, Object>> getManagersUnderVP(@RequestHeader("X-User-Id") Integer userId,
                                                                  @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getManagersUnderVP() called for userId: {}, role: {}", userId, userRole);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP managers", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserDTO> managers = salesVPService.getManagersUnderVP(userId);
        log.info("SalesVPController.getManagersUnderVP() returned {} managers", managers.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", managers);
        response.put("total", managers.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/managers/{managerId}/executives")
    public ResponseEntity<Map<String, Object>> getExecutivesUnderManager(@PathVariable Integer managerId,
                                                                         @RequestHeader("X-User-Id") Integer userId,
                                                                         @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getExecutivesUnderManager() called for managerId: {}, userId: {}, role: {}", managerId, userId, userRole);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access manager executives", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Validate that the manager is under the VP
        List<UserDTO> managers = salesVPService.getManagersUnderVP(userId);
        boolean isValidManager = managers.stream().anyMatch(m -> m.getUserId().equals(managerId));
        if (!isValidManager) {
            log.warn("Manager {} is not under VP {} hierarchy", managerId, userId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<UserDTO> executives = salesVPService.getExecutivesUnderManager(managerId);
        log.info("SalesVPController.getExecutivesUnderManager() returned {} executives", executives.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", executives);
        response.put("total", executives.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/executives/{executiveId}/leads")
    public ResponseEntity<Map<String, Object>> getLeadsForExecutiveUnderVP(@PathVariable Integer executiveId,
                                                                           @RequestParam(required = false) String q,
                                                                           @RequestParam(required = false) String status,
                                                                           @RequestParam(required = false) String source,
                                                                           @RequestParam(required = false) String startDate,
                                                                           @RequestParam(required = false) String endDate,
                                                                           @RequestParam(defaultValue = "0") int page,
                                                                           @RequestParam(defaultValue = "10") int size,
                                                                           @RequestHeader("X-User-Id") Integer userId,
                                                                           @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getLeadsForExecutiveUnderVP() called for executiveId: {}, userId: {}, role: {}, status: {}, source: {}, startDate: {}, endDate: {}, page: {}, size: {}", executiveId, userId, userRole, status, source, startDate, endDate, page, size);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access executive leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Map<String, Object> response = salesVPService.getLeadsForExecutiveUnderVPWithFiltersAndPagination(userId, executiveId, q, status, source, startDate, endDate, page, size);
        log.info("SalesVPController.getLeadsForExecutiveUnderVP() returned paginated response");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/managers/{managerId}/leads")
    public ResponseEntity<Map<String, Object>> getLeadsForManagerUnderVP(@PathVariable Integer managerId,
                                                                         @RequestParam(required = false) String q,
                                                                         @RequestParam(required = false) String status,
                                                                         @RequestParam(required = false) String source,
                                                                         @RequestParam(required = false) String startDate,
                                                                         @RequestParam(required = false) String endDate,
                                                                         @RequestParam(defaultValue = "0") int page,
                                                                         @RequestParam(defaultValue = "10") int size,
                                                                         @RequestHeader("X-User-Id") Integer userId,
                                                                         @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getLeadsForManagerUnderVP() called for managerId: {}, userId: {}, role: {}, status: {}, source: {}, startDate: {}, endDate: {}, page: {}, size: {}", managerId, userId, userRole, status, source, startDate, endDate, page, size);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access manager leads", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Map<String, Object> response = salesVPService.getLeadsForManagerUnderVPWithFiltersAndPagination(userId, managerId, q, status, source, startDate, endDate, page, size);
        log.info("SalesVPController.getLeadsForManagerUnderVP() returned paginated response");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/contacts")
    public ResponseEntity<Map<String, Object>> getVPContacts(@RequestParam(required = false) String q,
                                                             @RequestHeader("X-User-Id") Integer userId,
                                                             @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getVPContacts() called for userId: {}, role: {}", userId, userRole);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP contacts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ContactDTO> contacts = salesVPService.getContactsForVP(userId, q);
        log.info("SalesVPController.getVPContacts() returned {} contacts", contacts.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", contacts);
        response.put("total", contacts.size());
        response.put("page", 0);
        response.put("size", contacts.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-contacts")
    public ResponseEntity<Map<String, Object>> getMyContacts(@RequestParam(required = false) String q,
                                                            @RequestParam(required = false) String startDate,
                                                            @RequestParam(required = false) String endDate,
                                                            @RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "10") int size,
                                                            @RequestHeader("X-User-Id") Integer userId,
                                                            @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getMyContacts() called for userId: {}, role: {}, startDate: {}, endDate: {}, page: {}, size: {}", userId, userRole, startDate, endDate, page, size);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access VP my contacts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Map<String, Object> response = salesVPService.getMyContactsWithFiltersAndPagination(userId, q, startDate, endDate, page, size);
        log.info("SalesVPController.getMyContacts() returned paginated response");

        return ResponseEntity.ok(response);
    }

    @GetMapping("/executives/{executiveId}/contacts")
    public ResponseEntity<Map<String, Object>> getContactsForExecutiveUnderVP(@PathVariable Integer executiveId,
                                                                              @RequestParam(required = false) String q,
                                                                              @RequestHeader("X-User-Id") Integer userId,
                                                                              @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getContactsForExecutiveUnderVP() called for executiveId: {}, userId: {}, role: {}", executiveId, userId, userRole);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access executive contacts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ContactDTO> contacts = salesVPService.getContactsForExecutiveUnderVP(userId, executiveId, q);
        log.info("SalesVPController.getContactsForExecutiveUnderVP() returned {} contacts", contacts.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", contacts);
        response.put("total", contacts.size());
        response.put("page", 0);
        response.put("size", contacts.size());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/managers/{managerId}/contacts")
    public ResponseEntity<Map<String, Object>> getContactsForManagerUnderVP(@PathVariable Integer managerId,
                                                                            @RequestParam(required = false) String q,
                                                                            @RequestHeader("X-User-Id") Integer userId,
                                                                            @RequestHeader("X-User-Role") String userRole) {
        log.info("SalesVPController.getContactsForManagerUnderVP() called for managerId: {}, userId: {}, role: {}", managerId, userId, userRole);

        if (!"Sales_VP".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access manager contacts", userId, userRole);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<ContactDTO> contacts = salesVPService.getContactsForManagerUnderVP(userId, managerId, q);
        log.info("SalesVPController.getContactsForManagerUnderVP() returned {} contacts", contacts.size());

        Map<String, Object> response = new HashMap<>();
        response.put("data", contacts);
        response.put("total", contacts.size());
        response.put("page", 0);
        response.put("size", contacts.size());

        return ResponseEntity.ok(response);
    }
}