package com.techtammina.crm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.extern.slf4j.Slf4j;

import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.LeadReassignmentRequest;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.repository.AccountRepository;
import com.techtammina.crm.repository.ContactRepository;
import com.techtammina.crm.repository.DealRepository;
import com.techtammina.crm.repository.ActivityRepository;
import com.techtammina.crm.repository.EmailRepository;
import com.techtammina.crm.service.LeadReassignmentService;
import com.techtammina.crm.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/lead-assignment")
@Slf4j
public class LeadAssignmentController {

    private static final Logger log = LoggerFactory.getLogger(LeadAssignmentController.class);

    @Autowired
    private LeadRepository leadRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private LeadReassignmentService reassignmentService;
    
    @Autowired
    private com.techtammina.crm.repository.LeadReassignmentRequestRepository reassignmentRequestRepository;
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private ContactRepository contactRepository;
    
    @Autowired
    private DealRepository dealRepository;
    
    @Autowired
    private ActivityRepository activityRepository;
    
    @Autowired
    private EmailRepository emailRepository;

    @GetMapping("/test-data")
    public ResponseEntity<Map<String, Object>> testData() {
        Map<String, Object> result = new HashMap<>();
        
        List<Lead> allLeads = leadRepository.findAll();
        List<Lead> unassignedLeads = leadRepository.findByAssignedToIsNull();
        List<Users> allUsers = usersRepository.findAll();
        List<Users> salesExecs = usersRepository.findByRole("Sales_Executive");
        List<com.techtammina.crm.entity.LeadReassignmentRequest> allRequests = reassignmentRequestRepository.findAll();
        
        result.put("totalLeads", allLeads.size());
        result.put("unassignedLeads", unassignedLeads.size());
        result.put("totalUsers", allUsers.size());
        result.put("salesExecutives", salesExecs.size());
        result.put("reassignmentRequests", allRequests.size());
        
        log.debug("=== TEST DATA ===");
        log.debug("{}", "Total leads: " + allLeads.size());
        log.debug("{}", "Unassigned leads: " + unassignedLeads.size());
        log.debug("{}", "Total users: " + allUsers.size());
        log.debug("{}", "Sales executives: " + salesExecs.size());
        log.debug("{}", "Reassignment requests: " + allRequests.size());
        
        // Show recent reassignment requests
        log.debug("\n=== RECENT REASSIGNMENT REQUESTS ===");
        for (com.techtammina.crm.entity.LeadReassignmentRequest req : allRequests) {
            log.debug("{}", "Request " + req.getId() + ": Lead " + req.getLead().getLeadId() + " (" + req.getLead().getFirstName() + " " + req.getLead().getLastName() + ") - Status: " + req.getStatus() + " - Requested by: " + req.getRequestedBy().getFirstName() + " (Manager: " + req.getRequestedBy().getManagerId() + ")");
        }
        
        return ResponseEntity.ok(result);
    }

    // REMOVED: This endpoint was showing all unassigned leads instead of only approved reassignment requests

    static class UserSummary {
        private Integer userId;
        private String firstName;
        private String lastName;

        public UserSummary(Integer userId, String firstName, String lastName) {
            this.userId = userId;
            this.firstName = firstName;
            this.lastName = lastName;
        }

        public Integer getUserId() { return userId; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
    }

    static class LeadAssignmentLead {
        private Integer leadId;
        private String firstName;
        private String lastName;
        private String companyName;
        private String email;
        private String phoneNumber;
        private Lead.LeadStatus leadStatus;
        private Lead.LeadSource leadSource;
        private String country;
        private String companyLocation;
        private BigDecimal prospectValue;
        private LocalDateTime createdAt;
        private UserSummary createdBy;
        private UserSummary assignedTo; // always null for Lead Assignment UI

        public LeadAssignmentLead(Lead lead) {
            this.leadId = lead.getLeadId();
            this.firstName = lead.getFirstName();
            this.lastName = lead.getLastName();
            this.companyName = lead.getCompanyName();
            this.email = lead.getEmail();
            this.phoneNumber = lead.getPhoneNumber();
            this.leadStatus = lead.getLeadStatus();
            this.leadSource = lead.getLeadSource();
            this.country = lead.getCountry();
            this.companyLocation = lead.getCompanyLocation();
            this.prospectValue = lead.getProspectValue();
            this.createdAt = lead.getCreatedAt();
            this.createdBy = lead.getCreatedBy() != null
                ? new UserSummary(lead.getCreatedBy().getUserId(), lead.getCreatedBy().getFirstName(), lead.getCreatedBy().getLastName())
                : null;
            this.assignedTo = null;
        }

        public Integer getLeadId() { return leadId; }
        public String getFirstName() { return firstName; }
        public String getLastName() { return lastName; }
        public String getCompanyName() { return companyName; }
        public String getEmail() { return email; }
        public String getPhoneNumber() { return phoneNumber; }
        public Lead.LeadStatus getLeadStatus() { return leadStatus; }
        public Lead.LeadSource getLeadSource() { return leadSource; }
        public String getCountry() { return country; }
        public String getCompanyLocation() { return companyLocation; }
        public BigDecimal getProspectValue() { return prospectValue; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public UserSummary getCreatedBy() { return createdBy; }
        public UserSummary getAssignedTo() { return assignedTo; }
    }

    @GetMapping("/unassigned")
    public ResponseEntity<List<LeadAssignmentLead>> getUnassignedLeads(
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        log.debug("{}", "=== GET UNASSIGNED LEADS CALLED ===");
        log.debug("{}", "Manager ID: " + managerId + ", Role: " + userRole);
        
        if ("Sales_Manager".equals(userRole) && managerId != null) {
            // Base: unassigned leads created by executives under this manager
            List<Lead> unassignedLeads = leadRepository.findUnassignedLeadsByManagerTeam(managerId);
            log.debug("{}", "Found " + unassignedLeads.size() + " unassigned leads for manager " + managerId);

            // Also include approved reassignment requests (regardless of current assignment)
            List<LeadReassignmentRequest> approvedRequests = reassignmentRequestRepository.findApprovedRequestsByManager(managerId);
            log.debug("{}", "Found " + approvedRequests.size() + " approved requests for manager " + managerId);

            Map<Integer, Lead> combined = new java.util.LinkedHashMap<>();
            for (Lead lead : unassignedLeads) {
                // Reassignment workflow rule:
                // If a lead has any reassignment request history, do not include it
                // via generic "unassigned" pool. It should appear only when there is
                // an approved request and still pending assignment (handled below).
                if (reassignmentRequestRepository.existsByLead_LeadId(lead.getLeadId())) {
                    continue;
                }
                combined.put(lead.getLeadId(), lead);
            }
            for (LeadReassignmentRequest req : approvedRequests) {
                Lead lead = req.getLead();
                if (lead == null) continue;

                // If there's any pending request for this lead, it should NOT appear yet
                List<LeadReassignmentRequest> pendingForLead = reassignmentRequestRepository.findActiveRequestsByLeadId(lead.getLeadId());
                if (pendingForLead != null && !pendingForLead.isEmpty()) {
                    continue;
                }

                // Only show requests that are still pending assignment (reassignmentPending = true)
                if (Boolean.TRUE.equals(lead.getReassignmentPending())) {
                    combined.put(lead.getLeadId(), lead);
                }
            }

            List<LeadAssignmentLead> leadsForAssignment = combined.values().stream()
                .map(LeadAssignmentLead::new)
                .collect(java.util.stream.Collectors.toList());
            
            log.debug("{}", "Manager " + managerId + " has " + leadsForAssignment.size() + " approved reassignment leads");
            for (LeadAssignmentLead lead : leadsForAssignment) {
                log.debug("{}", "  - Lead: " + lead.getLeadId() + " (" + lead.getFirstName() + " " + lead.getLastName() + ")");
            }
            return ResponseEntity.ok(leadsForAssignment);
        }
        
        log.debug("{}", "Not a sales manager or missing manager ID - returning empty list");
        // For non-managers or missing manager ID, return empty list
        return ResponseEntity.ok(java.util.Collections.emptyList());
    }

    @GetMapping("/sales-executives-for-lead/{leadId}")
    public ResponseEntity<List<Users>> getSalesExecutivesForLead(
            @PathVariable Integer leadId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        log.debug("{}", "=== GETTING EXECUTIVES FOR LEAD " + leadId + " ===");

        List<Users> salesExecutives = new java.util.ArrayList<>();
        try {
            // Determine managerId: prefer header; if absent, infer from active request's requester.managerId
            Integer managerId = userId;

            // Check for pending reassignment requests to find who requested reassignment
            List<LeadReassignmentRequest> pendingRequests = reassignmentRequestRepository.findActiveRequestsByLeadId(leadId);
            log.debug("{}", "*** FOUND " + pendingRequests.size() + " PENDING REQUESTS FOR LEAD " + leadId + " ***");
            
            // Also check approved requests to find the requester
            List<LeadReassignmentRequest> approvedRequests = reassignmentRequestRepository.findApprovedRequestsByLeadId(leadId);
            log.debug("{}", "*** FOUND " + approvedRequests.size() + " APPROVED REQUESTS FOR LEAD " + leadId + " ***");
            
            if (managerId == null && !pendingRequests.isEmpty()) {
                Users requester = pendingRequests.get(0).getRequestedBy();
                if (requester != null) {
                    managerId = requester.getManagerId();
                    log.debug("{}", "*** DERIVED MANAGER ID FROM PENDING REQUEST: " + managerId + " ***");
                }
            } else if (managerId == null && !approvedRequests.isEmpty()) {
                Users requester = approvedRequests.get(0).getRequestedBy();
                if (requester != null) {
                    managerId = requester.getManagerId();
                    log.debug("{}", "*** DERIVED MANAGER ID FROM APPROVED REQUEST: " + managerId + " ***");
                }
            }

            if (managerId == null) {
                log.debug("{}", "No managerId available from headers or pending request; returning empty list to avoid leaking all executives");
                return ResponseEntity.ok(salesExecutives);
            }

            log.debug("{}", "*** GETTING EXECUTIVES FOR LEAD " + leadId + " UNDER MANAGER " + managerId + " ***");
            // Get all executives under this manager
            salesExecutives = usersRepository.findSalesExecutivesByManagerId(managerId);
            log.debug("{}", "*** FOUND " + salesExecutives.size() + " EXECUTIVES UNDER MANAGER ***");

            // Get the lead to check who is currently assigned
            Lead currentLead = leadRepository.findById(leadId).orElse(null);
            Integer excludeExecutiveId = null;

            // Priority 1: Exclude who requested PENDING reassignment (most important)
            if (!pendingRequests.isEmpty()) {
                excludeExecutiveId = pendingRequests.get(0).getRequestedBy().getUserId();
                log.debug("{}", "*** EXCLUDING EXECUTIVE " + excludeExecutiveId + " WHO REQUESTED REASSIGNMENT (PENDING) ***");
            }
            // Priority 2: Exclude who requested APPROVED reassignment (for recent approved requests)
            else if (!approvedRequests.isEmpty()) {
                // Get the most recent approved request
                LeadReassignmentRequest latestApproved = approvedRequests.stream()
                    .sorted((r1, r2) -> r2.getApprovedDate().compareTo(r1.getApprovedDate()))
                    .findFirst()
                    .orElse(approvedRequests.get(0));
                excludeExecutiveId = latestApproved.getRequestedBy().getUserId();
                log.debug("{}", "*** EXCLUDING EXECUTIVE " + excludeExecutiveId + " WHO REQUESTED REASSIGNMENT (APPROVED) - Request ID: " + latestApproved.getId() + " ***");
            }
            // Priority 3: Exclude currently assigned executive
            else if (currentLead != null && currentLead.getAssignedTo() != null) {
                excludeExecutiveId = currentLead.getAssignedTo().getUserId();
                log.debug("{}", "*** EXCLUDING CURRENTLY ASSIGNED EXECUTIVE " + excludeExecutiveId + " ***");
            }
            // Priority 4: Exclude creator if they are Sales_Executive (only if no one else to exclude)
            else if (currentLead != null && currentLead.getCreatedBy() != null && "Sales_Executive".equals(currentLead.getCreatedBy().getRole().toString())) {
                excludeExecutiveId = currentLead.getCreatedBy().getUserId();
                log.debug("{}", "*** EXCLUDING CREATOR EXECUTIVE " + excludeExecutiveId + " (" + currentLead.getCreatedBy().getFirstName() + ") TO PREVENT SELF-ASSIGNMENT ***");
            }

            // Filter out the excluded executive
            if (excludeExecutiveId != null) {
                final Integer finalExcludeId = excludeExecutiveId;
                List<Users> filteredExecutives = new java.util.ArrayList<>();
                for (Users exec : salesExecutives) {
                    if (!exec.getUserId().equals(finalExcludeId)) {
                        filteredExecutives.add(exec);
                        log.debug("{}", "Executive " + exec.getUserId() + " (" + exec.getFirstName() + "): INCLUDED");
                    } else {
                        log.debug("{}", "Executive " + exec.getUserId() + " (" + exec.getFirstName() + "): EXCLUDED (requested reassignment)");
                    }
                }
                salesExecutives = filteredExecutives;
            } else {
                log.debug("*** NO EXECUTIVE TO EXCLUDE - SHOWING ALL TEAM EXECUTIVES ***");
            }

            log.debug("{}", "*** FINAL DROPDOWN OPTIONS: " + salesExecutives.size() + " EXECUTIVES ***");
            for (Users exec : salesExecutives) {
                log.debug("{}", "  - " + exec.getFirstName() + " " + exec.getLastName() + " (ID: " + exec.getUserId() + ")");
            }
            
            // Compare with "Added By" field
            if (currentLead != null && currentLead.getCreatedBy() != null) {
                log.debug("{}", "*** COMPARISON: Added By = " + currentLead.getCreatedBy().getFirstName() + " " + currentLead.getCreatedBy().getLastName() + " (ID: " + currentLead.getCreatedBy().getUserId() + ") ***");
                boolean addedByInDropdown = salesExecutives.stream().anyMatch(exec -> exec.getUserId().equals(currentLead.getCreatedBy().getUserId()));
                log.debug("{}", "*** IS 'ADDED BY' PERSON IN DROPDOWN? " + addedByInDropdown + " ***");
            }
        } catch (Exception e) {
            log.debug("{}", "Error building executives list: " + e.getMessage());
            salesExecutives = new java.util.ArrayList<>();
        }

        return ResponseEntity.ok(salesExecutives);
    }

    @GetMapping("/direct-sales-executives")
    public ResponseEntity<List<Users>> getDirectSalesExecutives(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String userRole) {
        log.debug("=== DIRECT SALES EXECUTIVES QUERY WITH FILTERING ===");
        log.debug("{}", "User ID: " + userId + ", Role: " + userRole);
        
        List<Users> salesExecutives;
        
        // Force filtering by manager ID if provided
        if (userId != null && !"null".equals(userId)) {
            try {
                Integer managerId = Integer.parseInt(userId);
                log.debug("{}", "*** FORCING EXECUTIVE FILTERING FOR MANAGER ID: " + managerId + " ***");
                
                // Get only executives under this manager
                salesExecutives = usersRepository.findSalesExecutivesByManagerId(managerId);
                log.debug("{}", "*** FOUND " + salesExecutives.size() + " EXECUTIVES UNDER MANAGER ***");
            } catch (NumberFormatException e) {
                salesExecutives = new java.util.ArrayList<>();
            }
        } else {
            log.debug("*** NO MANAGER ID - RETURNING ALL SALES EXECUTIVES ***");
            salesExecutives = usersRepository.findByRole("Sales_Executive");
        }
        
        for (Users exec : salesExecutives) {
            log.debug("{}", "Executive: ID=" + exec.getUserId() + ", Name=" + exec.getFirstName() + " " + exec.getLastName() + ", Manager ID: " + exec.getManagerId());
        }
        
        return ResponseEntity.ok(salesExecutives);
    }

    @GetMapping("/sales-executives")
    public ResponseEntity<List<Users>> getSalesExecutives(
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestParam(value = "leadId", required = false) Integer leadId) {
        log.debug("\n=== SALES EXECUTIVES ENDPOINT CALLED ===");
        log.debug("{}", "Manager ID from header: " + managerId);
        log.debug("{}", "User Role from header: " + userRole);
        log.debug("{}", "Lead ID param: " + leadId);
        
        List<Users> salesExecutives;
        
        // FORCE filtering for Sales Manager role
        if ("Sales_Manager".equals(userRole) && managerId != null) {
            log.debug("*** SALES MANAGER DETECTED - FILTERING BY MANAGER ID *** ");
            salesExecutives = usersRepository.findSalesExecutivesByManagerId(managerId);
            log.debug("{}", "*** FOUND " + salesExecutives.size() + " EXECUTIVES UNDER MANAGER " + managerId + " ***");
            
            // If leadId is provided, exclude the executive who requested reassignment
            if (leadId != null) {
                Integer excludeExecutiveId = null;
                
                // Get the lead to check current assignment
                Lead currentLead = leadRepository.findById(leadId).orElse(null);
                
                log.debug("{}", "*** LEAD DATA DEBUG ***");
                if (currentLead != null) {
                    log.debug("{}", "Lead ID: " + currentLead.getLeadId());
                    log.debug("{}", "Lead Name: " + currentLead.getFirstName() + " " + currentLead.getLastName());
                    log.debug("{}", "Created By (Added By): " + (currentLead.getCreatedBy() != null ? currentLead.getCreatedBy().getFirstName() + " " + currentLead.getCreatedBy().getLastName() + " (ID: " + currentLead.getCreatedBy().getUserId() + ")" : "null"));
                    log.debug("{}", "Assigned To: " + (currentLead.getAssignedTo() != null ? currentLead.getAssignedTo().getFirstName() + " " + currentLead.getAssignedTo().getLastName() + " (ID: " + currentLead.getAssignedTo().getUserId() + ")" : "null"));
                }
                
                // ONLY check for PENDING requests - ignore APPROVED/REJECTED ones
                List<LeadReassignmentRequest> pendingRequests = reassignmentRequestRepository.findActiveRequestsByLeadId(leadId);
                log.debug("{}", "*** FOUND " + pendingRequests.size() + " PENDING REQUESTS FOR LEAD " + leadId + " ***");
                
                if (!pendingRequests.isEmpty()) {
                    // Get the most recent pending request
                    LeadReassignmentRequest latestRequest = pendingRequests.stream()
                        .sorted((r1, r2) -> r2.getRequestedDate().compareTo(r1.getRequestedDate()))
                        .findFirst()
                        .orElse(pendingRequests.get(0));
                    excludeExecutiveId = latestRequest.getRequestedBy().getUserId();
                    log.debug("{}", "*** EXCLUDING EXECUTIVE " + excludeExecutiveId + " (" + latestRequest.getRequestedBy().getFirstName() + ") WHO REQUESTED REASSIGNMENT ***");
                } else if (currentLead != null && currentLead.getAssignedTo() != null) {
                    // If no pending requests, exclude currently assigned executive
                    excludeExecutiveId = currentLead.getAssignedTo().getUserId();
                    log.debug("{}", "*** EXCLUDING CURRENTLY ASSIGNED EXECUTIVE " + excludeExecutiveId + " (" + currentLead.getAssignedTo().getFirstName() + ") ***");
                } else {
                    log.debug("{}", "*** NO EXECUTIVE TO EXCLUDE - LEAD IS UNASSIGNED AND NO PENDING REQUESTS ***");
                }
                
                // Filter out the excluded executive
                if (excludeExecutiveId != null) {
                    final Integer finalExcludeId = excludeExecutiveId;
                    List<Users> filteredExecutives = new java.util.ArrayList<>();
                    log.debug("{}", "*** FILTERING EXECUTIVES - EXCLUDING ID: " + finalExcludeId + " ***");
                    for (Users exec : salesExecutives) {
                        if (!exec.getUserId().equals(finalExcludeId)) {
                            filteredExecutives.add(exec);
                            log.debug("{}", "Executive " + exec.getUserId() + " (" + exec.getFirstName() + " " + exec.getLastName() + "): INCLUDED");
                        } else {
                            log.debug("{}", "Executive " + exec.getUserId() + " (" + exec.getFirstName() + " " + exec.getLastName() + "): EXCLUDED");
                        }
                    }
                    salesExecutives = filteredExecutives;
                    log.debug("{}", "*** AFTER FILTERING: " + salesExecutives.size() + " EXECUTIVES REMAINING ***");
                } else {
                    log.debug("{}", "*** NO FILTERING APPLIED - SHOWING ALL " + salesExecutives.size() + " EXECUTIVES ***");
                }
            }
        } else {
            log.debug("*** NOT SALES MANAGER OR NO MANAGER ID - RETURNING ALL EXECUTIVES ***");
            salesExecutives = usersRepository.findByRole("Sales_Executive");
        }
        
        log.debug("\n=== FINAL RESULT ===");
        log.debug("{}", "Total executives returned: " + salesExecutives.size());
        for (Users exec : salesExecutives) {
            log.debug("{}", "  - ID: " + exec.getUserId() + ", Name: " + exec.getFirstName() + " " + exec.getLastName() + ", Manager: " + exec.getManagerId());
        }
        log.debug("=== END SALES EXECUTIVES ENDPOINT ===\n");

        return ResponseEntity.ok(salesExecutives);
    }

    @GetMapping("/check-request/{requestId}")
    public ResponseEntity<Map<String, Object>> checkRequest(@PathVariable Integer requestId) {
        Map<String, Object> result = new HashMap<>();
        
        com.techtammina.crm.entity.LeadReassignmentRequest request = reassignmentRequestRepository.findById(requestId).orElse(null);
        if (request != null) {
            result.put("requestId", requestId);
            result.put("status", request.getStatus().toString());
            result.put("leadId", request.getLead().getLeadId());
            result.put("leadName", request.getLead().getFirstName() + " " + request.getLead().getLastName());
            result.put("requestedBy", request.getRequestedBy().getUserId());
            result.put("managerId", request.getRequestedBy().getManagerId());
        } else {
            result.put("error", "Request not found");
        }
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/test-session")
    public ResponseEntity<Map<String, Object>> testSession(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> result = new HashMap<>();
        
        result.put("userId", userId);
        result.put("userRole", userRole);
        result.put("hasAuthHeader", authHeader != null);
        
        log.debug("\n=== SESSION TEST ===");
        log.debug("{}", "User ID: " + userId);
        log.debug("{}", "User Role: " + userRole);
        log.debug("{}", "Auth Header: " + (authHeader != null ? "Present" : "Missing"));
        
        if (userId != null) {
            Users user = usersRepository.findById(userId).orElse(null);
            if (user != null) {
                result.put("userFound", true);
                result.put("userName", user.getFirstName() + " " + user.getLastName());
                result.put("actualRole", user.getRole());
                result.put("managerId", user.getManagerId());
                log.debug("{}", "User found: " + user.getFirstName() + " " + user.getLastName() + " (Role: " + user.getRole() + ", Manager: " + user.getManagerId() + ")");
                
                // Test the filtering method directly
                if ("Sales_Manager".equals(user.getRole().toString())) {
                    List<Users> teamExecutives = usersRepository.findSalesExecutivesByManagerId(userId);
                    result.put("teamExecutivesCount", teamExecutives.size());
                    log.debug("{}", "*** TEAM EXECUTIVES FOR MANAGER " + userId + ": " + teamExecutives.size() + " ***");
                    for (Users exec : teamExecutives) {
                        log.debug("{}", "  - " + exec.getFirstName() + " " + exec.getLastName() + " (ID: " + exec.getUserId() + ")");
                    }
                }
            } else {
                result.put("userFound", false);
                log.debug("User not found in database");
            }
        }
        
        // Test all sales executives
        List<Users> allExecutives = usersRepository.findByRole("Sales_Executive");
        result.put("totalExecutives", allExecutives.size());
        log.debug("\n=== ALL SALES EXECUTIVES ===");
        for (Users exec : allExecutives) {
            log.debug("{}", "  - ID: " + exec.getUserId() + ", Name: " + exec.getFirstName() + " " + exec.getLastName() + ", Manager: " + exec.getManagerId());
        }
        
        log.debug("=== END SESSION TEST ===\n");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/test-reassignment/{managerId}")
    public ResponseEntity<Map<String, Object>> testReassignment(@PathVariable Integer managerId) {
        Map<String, Object> result = new HashMap<>();
        
        // Check reassignment requests
        List<com.techtammina.crm.entity.LeadReassignmentRequest> allRequests = reassignmentRequestRepository.findAll();
        List<com.techtammina.crm.entity.LeadReassignmentRequest> approvedRequests = allRequests.stream()
            .filter(r -> r.getStatus() == com.techtammina.crm.entity.LeadReassignmentRequest.Status.APPROVED)
            .collect(java.util.stream.Collectors.toList());
        
        result.put("totalRequests", allRequests.size());
        result.put("approvedRequests", approvedRequests.size());
        result.put("managerId", managerId);
        
        // Check leads for assignment
        List<Lead> leadsForAssignment = leadRepository.findLeadsForAssignment(managerId);
        result.put("leadsForAssignment", leadsForAssignment.size());
        
        log.debug("{}", "=== REASSIGNMENT TEST FOR MANAGER " + managerId + " ===");
        log.debug("{}", "Total requests: " + allRequests.size());
        log.debug("{}", "Approved requests: " + approvedRequests.size());
        log.debug("{}", "Leads for assignment: " + leadsForAssignment.size());
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/debug")
    public ResponseEntity<Map<String, Object>> debugData(
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        Map<String, Object> debug = new HashMap<>();
        
        log.debug("=== DEBUG DATA REQUEST ===");
        log.debug("{}", "Manager ID: " + managerId);
        log.debug("{}", "User Role: " + userRole);
        log.debug("{}", "Auth Header: " + (authHeader != null ? "Present" : "Missing"));
        
        // Check all reassignment requests
        List<com.techtammina.crm.entity.LeadReassignmentRequest> allRequests = reassignmentRequestRepository.findAll();
        debug.put("totalReassignmentRequests", allRequests.size());
        
        log.debug("\n=== ALL REASSIGNMENT REQUESTS ===");
        for (com.techtammina.crm.entity.LeadReassignmentRequest req : allRequests) {
            log.debug("{}", "Request ID: " + req.getId() + 
                ", Status: " + req.getStatus() + 
                ", Lead: " + req.getLead().getLeadId() + " (" + req.getLead().getFirstName() + " " + req.getLead().getLastName() + ")" +
                ", Requested by: " + req.getRequestedBy().getUserId() + " (" + req.getRequestedBy().getFirstName() + " " + req.getRequestedBy().getLastName() + ")" +
                ", Manager ID: " + req.getRequestedBy().getManagerId());
        }
        
        // Check all users with their manager relationships
        List<Users> allUsers = usersRepository.findAll();
        debug.put("totalUsers", allUsers.size());
        
        log.debug("\n=== ALL USERS ===");
        for (Users user : allUsers) {
            log.debug("{}", "User: " + user.getFirstName() + " " + user.getLastName() + 
                " (ID: " + user.getUserId() + ", Role: " + user.getRole() + ", Manager ID: " + user.getManagerId() + ")");
        }
        
        // Check sales executives
        List<Users> salesExecs = usersRepository.findByRole("Sales_Executive");
        debug.put("salesExecutives", salesExecs.size());
        
        // Check sales managers
        List<Users> salesManagers = usersRepository.findByRole("Sales_Manager");
        debug.put("salesManagers", salesManagers.size());
        
        if (managerId != null) {
            // Check executives under this manager
            List<Users> teamExecs = usersRepository.findSalesExecutivesByManagerId(managerId);
            debug.put("executivesUnderManager", teamExecs.size());
            
            log.debug("{}", "\n=== EXECUTIVES UNDER MANAGER " + managerId + " ===");
            for (Users exec : teamExecs) {
                log.debug("{}", "Executive: " + exec.getFirstName() + " " + exec.getLastName() + 
                    " (ID: " + exec.getUserId() + ")");
            }
            
            // Check pending requests for this manager
            List<com.techtammina.crm.entity.LeadReassignmentRequest> pendingForManager = allRequests.stream()
                .filter(r -> managerId.equals(r.getRequestedBy().getManagerId()))
                .filter(r -> r.getStatus() == com.techtammina.crm.entity.LeadReassignmentRequest.Status.PENDING)
                .collect(java.util.stream.Collectors.toList());
            debug.put("pendingRequestsForManager", pendingForManager.size());
            
            log.debug("{}", "\n=== PENDING REQUESTS FOR MANAGER " + managerId + " ===");
            for (com.techtammina.crm.entity.LeadReassignmentRequest req : pendingForManager) {
                log.debug("{}", "Pending Request: Lead " + req.getLead().getLeadId() + " (" + req.getLead().getFirstName() + " " + req.getLead().getLastName() + ") requested by " + req.getRequestedBy().getFirstName() + " " + req.getRequestedBy().getLastName());
            }
        }
        
        // Check all leads with their creators
        List<Lead> allLeads = leadRepository.findAll();
        debug.put("totalLeads", allLeads.size());
        
        log.debug("\n=== ALL LEADS ===");
        for (Lead lead : allLeads) {
            String createdByName = lead.getCreatedBy() != null ? 
                lead.getCreatedBy().getFirstName() + " " + lead.getCreatedBy().getLastName() : "Unknown";
            Integer createdById = lead.getCreatedBy() != null ? lead.getCreatedBy().getUserId() : null;
            Integer createdByManagerId = lead.getCreatedBy() != null ? lead.getCreatedBy().getManagerId() : null;
            String assignedTo = lead.getAssignedTo() != null ? 
                lead.getAssignedTo().getFirstName() + " " + lead.getAssignedTo().getLastName() : "Unassigned";
            
            log.debug("{}", "Lead: " + lead.getFirstName() + " " + lead.getLastName() + 
                " (ID: " + lead.getLeadId() + ", Created by: " + createdByName + 
                " [ID: " + createdById + ", Manager: " + createdByManagerId + "], Assigned to: " + assignedTo + ")");
        }
        
        // Check unassigned leads
        List<Lead> unassignedLeads = leadRepository.findByAssignedToIsNull();
        debug.put("unassignedLeads", unassignedLeads.size());
        
        log.debug("\n=== DEBUG SUMMARY ===");
        log.debug("{}", "Total Users: " + allUsers.size());
        log.debug("{}", "Sales Executives: " + salesExecs.size());
        log.debug("{}", "Sales Managers: " + salesManagers.size());
        log.debug("{}", "Total Leads: " + allLeads.size());
        log.debug("{}", "Unassigned Leads: " + unassignedLeads.size());
        log.debug("{}", "Total Reassignment Requests: " + allRequests.size());
        
        return ResponseEntity.ok(debug);
    }

    @PostMapping("/assign")
    public ResponseEntity<Map<String, Object>> assignLead(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        Integer leadId = (Integer) request.get("leadId");
        Integer executiveId = (Integer) request.get("executiveId");

        log.debug("{}", "Assigning lead " + leadId + " to executive " + executiveId + " by manager " + managerId);

        Lead lead = leadRepository.findById(leadId).orElse(null);
        Users executive = usersRepository.findById(executiveId).orElse(null);

        if (lead == null || executive == null) {
            log.debug("{}", "Lead or executive not found - Lead: " + (lead != null) + ", Executive: " + (executive != null));
            return ResponseEntity.badRequest().build();
        }

        // Validate that sales manager can only assign to executives under their management
        if ("Sales_Manager".equals(userRole) && managerId != null) {
            if (!managerId.equals(executive.getManagerId()) || !"Sales_Executive".equals(executive.getRole())) {
                log.debug("{}", "Validation failed: Executive " + executiveId + " does not belong to manager " + managerId);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Cannot assign lead to executive outside your team");
                return ResponseEntity.badRequest().body(errorResponse);
            }
        }

        Users oldExecutive = lead.getAssignedTo();
        
        // DO NOT update createdBy - this should remain the original creator ("Added By" field)
        // Only update the assignment
        lead.setAssignedTo(executive);
        leadRepository.save(lead);
        log.debug("{}", "Lead " + leadId + " assigned from " + (oldExecutive != null ? oldExecutive.getUserId() : "null") + " to " + executiveId);
        log.debug("{}", "Lead conversion IDs - Account: " + lead.getConvertedAccountId() + ", Contact: " + lead.getConvertedContactId() + ", Deal: " + lead.getConvertedDealId());
        

        
        // Transfer all related data to new executive
        transferAllRelatedData(lead, executiveId);
        
        // Clear reassignment pending flag when lead is assigned
        reassignmentService.clearReassignmentPending(leadId);
        
        // Update reassignment request status when completing assignment
        List<LeadReassignmentRequest> activeRequests = reassignmentRequestRepository.findActiveRequestsByLeadId(leadId);
        for (LeadReassignmentRequest activeRequest : activeRequests) {
            activeRequest.setStatus(LeadReassignmentRequest.Status.APPROVED);
            reassignmentRequestRepository.save(activeRequest);
            log.debug("{}", "Updated reassignment request " + activeRequest.getId() + " status to APPROVED");
        }
        
        log.debug("Lead assigned successfully");

        // Get manager name for notification
        String managerName = "Sales Manager";
        if (managerId != null) {
            Users manager = usersRepository.findById(managerId).orElse(null);
            if (manager != null) {
                managerName = manager.getFirstName() + " " + manager.getLastName();
            }
        }

        // Create notification for the executive
        String leadName = lead.getFirstName() + " " + lead.getLastName();
        log.debug("{}", "Creating notification for executive " + executiveId + " for lead: " + leadName + " by " + managerName);
        notificationService.createLeadAssignmentNotification(executiveId, leadName, managerName);
        log.debug("Notification created");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lead assigned successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reassign")
    public ResponseEntity<Map<String, Object>> reassignLead(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        Integer leadId = (Integer) request.get("leadId");
        Integer newExecutiveId = (Integer) request.get("newExecutiveId");

        log.debug("{}", "Reassigning lead " + leadId + " to executive " + newExecutiveId + " by manager " + managerId);

        Lead lead = leadRepository.findById(leadId).orElse(null);
        Users newExecutive = usersRepository.findById(newExecutiveId).orElse(null);

        if (lead == null || newExecutive == null) {
            log.debug("{}", "Lead or executive not found - Lead: " + (lead != null) + ", Executive: " + (newExecutive != null));
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Lead or executive not found");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Validate that sales manager can only reassign to executives under their management
        if ("Sales_Manager".equals(userRole) && managerId != null) {
            if (!managerId.equals(newExecutive.getManagerId()) || !"Sales_Executive".equals(newExecutive.getRole())) {
                log.debug("{}", "Validation failed: Executive " + newExecutiveId + " does not belong to manager " + managerId);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Cannot reassign lead to executive outside your team");
                return ResponseEntity.badRequest().body(errorResponse);
            }
        }

        Users oldExecutive = lead.getAssignedTo();
        
        // DO NOT update createdBy - this should remain the original creator ("Added By" field)
        // Only update the assignment
        lead.setAssignedTo(newExecutive);
        leadRepository.save(lead);
        log.debug("{}", "Lead " + leadId + " reassigned from " + (oldExecutive != null ? oldExecutive.getUserId() : "null") + " to " + newExecutiveId);
        log.debug("{}", "Lead conversion IDs - Account: " + lead.getConvertedAccountId() + ", Contact: " + lead.getConvertedContactId() + ", Deal: " + lead.getConvertedDealId());
        

        
        // Transfer all related data to new executive
        transferAllRelatedData(lead, newExecutiveId);
        
        // Clear reassignment pending flag when lead is reassigned
        reassignmentService.clearReassignmentPending(leadId);
        
        // Update reassignment request status when completing reassignment
        List<LeadReassignmentRequest> activeRequests = reassignmentRequestRepository.findActiveRequestsByLeadId(leadId);
        for (LeadReassignmentRequest activeRequest : activeRequests) {
            activeRequest.setStatus(LeadReassignmentRequest.Status.APPROVED);
            reassignmentRequestRepository.save(activeRequest);
            log.debug("{}", "Updated reassignment request " + activeRequest.getId() + " status to APPROVED");
        }
        
        log.debug("Lead reassigned successfully");

        // Get manager name for notification
        String managerName = "Sales Manager";
        if (managerId != null) {
            Users manager = usersRepository.findById(managerId).orElse(null);
            if (manager != null) {
                managerName = manager.getFirstName() + " " + manager.getLastName();
            }
        }

        // Create notification for the new executive
        String leadName = lead.getFirstName() + " " + lead.getLastName();
        log.debug("{}", "Creating notification for executive " + newExecutiveId + " for reassigned lead: " + leadName + " by " + managerName);
        notificationService.createLeadAssignmentNotification(newExecutiveId, leadName, managerName);
        log.debug("Notification created");

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lead reassigned successfully");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/assigned/{executiveId}")
    public ResponseEntity<List<Lead>> getLeadsByExecutive(@PathVariable Integer executiveId) {
        List<Lead> leads = leadRepository.findByAssignedTo_UserId(executiveId);
        return ResponseEntity.ok(leads);
    }

    @PostMapping("/bulk-assign")
    public ResponseEntity<Map<String, Object>> bulkAssignLeads(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        @SuppressWarnings("unchecked")
        List<Integer> leadIds = (List<Integer>) request.get("leadIds");
        Integer executiveId = (Integer) request.get("executiveId");

        Users executive = usersRepository.findById(executiveId).orElse(null);
        if (executive == null) {
            return ResponseEntity.badRequest().build();
        }

        // Validate that sales manager can only assign to executives under their management
        if ("Sales_Manager".equals(userRole) && managerId != null) {
            if (!managerId.equals(executive.getManagerId()) || !"Sales_Executive".equals(executive.getRole())) {
                log.debug("{}", "Validation failed: Executive " + executiveId + " does not belong to manager " + managerId);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Cannot assign leads to executive outside your team");
                return ResponseEntity.badRequest().body(errorResponse);
            }
        }

        // Get manager name for notification
        String managerName = "Sales Manager";
        if (managerId != null) {
            Users manager = usersRepository.findById(managerId).orElse(null);
            if (manager != null) {
                managerName = manager.getFirstName() + " " + manager.getLastName();
            }
        }

        List<Lead> leads = leadRepository.findAllById(leadIds);
        for (Lead lead : leads) {
            Users oldExecutive = lead.getAssignedTo();
            lead.setAssignedTo(executive);
            leadRepository.save(lead);
            log.debug("{}", "Lead " + lead.getLeadId() + " assigned from " + (oldExecutive != null ? oldExecutive.getUserId() : "null") + " to " + executiveId);
            
            // Transfer all related data to new executive
            transferAllRelatedData(lead, executiveId);
            
            // Clear reassignment pending flag
            reassignmentService.clearReassignmentPending(lead.getLeadId());
            
            // Update reassignment request status
            List<LeadReassignmentRequest> activeRequests = reassignmentRequestRepository.findActiveRequestsByLeadId(lead.getLeadId());
            for (LeadReassignmentRequest activeRequest : activeRequests) {
                activeRequest.setStatus(LeadReassignmentRequest.Status.APPROVED);
                reassignmentRequestRepository.save(activeRequest);
            }
            
            // Create notification for each lead
            String leadName = lead.getFirstName() + " " + lead.getLastName();
            notificationService.createLeadAssignmentNotification(executiveId, leadName, managerName);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", leads.size() + " leads assigned successfully");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/unassign")
    public ResponseEntity<Map<String, Object>> unassignLead(@RequestBody Map<String, Object> request) {
        Integer leadId = (Integer) request.get("leadId");
        Lead lead = leadRepository.findById(leadId).orElse(null);

        if (lead == null) {
            return ResponseEntity.badRequest().build();
        }

        lead.setAssignedTo(null);
        leadRepository.save(lead);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Lead unassigned successfully");
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/request-reassignment")
    public ResponseEntity<Map<String, Object>> requestReassignment(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Id", required = false) Integer executiveId) {
        Integer leadId = (Integer) request.get("leadId");
        String reason = (String) request.get("reason");
        
        try {
            log.debug("{}", "*** CREATING REASSIGNMENT REQUEST ***");
            log.debug("{}", "Lead ID: " + leadId + ", Executive ID: " + executiveId + ", Reason: " + reason);
            LeadReassignmentRequest reassignmentRequest = reassignmentService.requestReassignment(leadId, executiveId, reason);
            log.debug("{}", "*** REASSIGNMENT REQUEST CREATED WITH ID: " + reassignmentRequest.getId() + " ***");
            
            // Send notification to manager
            Lead lead = leadRepository.findById(leadId).orElse(null);
            Users executive = usersRepository.findById(executiveId).orElse(null);
            
            log.debug("{}", "*** REASSIGNMENT REQUEST DEBUG ***");
            log.debug("{}", "Lead ID: " + leadId + ", Lead found: " + (lead != null));
            if (lead != null) {
                log.debug("{}", "Lead: " + lead.getFirstName() + " " + lead.getLastName());
                log.debug("{}", "Lead created by: " + (lead.getCreatedBy() != null ? lead.getCreatedBy().getFirstName() + " " + lead.getCreatedBy().getLastName() + " (" + lead.getCreatedBy().getRole() + ")" : "null"));
            }
            log.debug("{}", "Executive ID: " + executiveId + ", Executive found: " + (executive != null));
            if (executive != null) {
                log.debug("{}", "Executive: " + executive.getFirstName() + " " + executive.getLastName());
                log.debug("{}", "Executive manager ID: " + executive.getManagerId());
            }
            
            if (lead != null && executive != null && executive.getManagerId() != null) {
                String executiveName = executive.getFirstName() + " " + executive.getLastName();
                String leadName = lead.getFirstName() + " " + lead.getLastName();
                log.debug("{}", "*** SENDING NOTIFICATION TO MANAGER ID: " + executive.getManagerId() + " ***");
                notificationService.createReassignmentRequestNotification(
                    executive.getManagerId(), executiveName, leadName, reason, reassignmentRequest.getId());
                log.debug("{}", "*** NOTIFICATION SENT SUCCESSFULLY ***");
            } else {
                log.debug("{}", "*** NOTIFICATION NOT SENT - Missing data: lead=" + (lead != null) + ", executive=" + (executive != null) + ", managerId=" + (executive != null ? executive.getManagerId() : "null") + " ***");
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Reassignment request submitted successfully");
            response.put("requestId", reassignmentRequest.getId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/debug-reassignment-requests/{leadId}")
    public ResponseEntity<Map<String, Object>> debugReassignmentRequests(@PathVariable Integer leadId) {
        Map<String, Object> debug = new HashMap<>();
        
        List<LeadReassignmentRequest> allRequests = reassignmentRequestRepository.findAll();
        List<LeadReassignmentRequest> activeRequests = reassignmentRequestRepository.findActiveRequestsByLeadId(leadId);
        
        debug.put("leadId", leadId);
        debug.put("totalRequests", allRequests.size());
        debug.put("activeRequestsForLead", activeRequests.size());
        
        log.debug("{}", "=== DEBUG REASSIGNMENT REQUESTS FOR LEAD " + leadId + " ===");
        log.debug("{}", "Total requests in DB: " + allRequests.size());
        log.debug("{}", "Active requests for lead " + leadId + ": " + activeRequests.size());
        
        for (LeadReassignmentRequest req : activeRequests) {
            log.debug("{}", "Request ID: " + req.getId() + ", Status: " + req.getStatus() + ", Requested by: " + req.getRequestedBy().getUserId());
        }
        
        return ResponseEntity.ok(debug);
    }
    
    @PostMapping("/approve-reassignment")
    public ResponseEntity<Map<String, Object>> approveReassignment(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId) {
        Integer requestId = (Integer) request.get("requestId");
        Integer newExecutiveId = (Integer) request.get("newExecutiveId");
        
        try {
            reassignmentService.approveReassignment(requestId, newExecutiveId, managerId);
            
            // Send notification to executive about approval
            LeadReassignmentRequest reassignmentRequest = reassignmentService.getRequestById(requestId);
            if (reassignmentRequest != null) {
                String managerName = usersRepository.findById(managerId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Manager");
                String leadName = reassignmentRequest.getLead().getFirstName() + " " + 
                                 reassignmentRequest.getLead().getLastName();
                notificationService.createReassignmentResponseNotification(
                    reassignmentRequest.getRequestedBy().getUserId(), managerName, "approved", leadName);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Reassignment approved successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/reject-reassignment")
    public ResponseEntity<Map<String, Object>> rejectReassignment(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId) {
        Integer requestId = (Integer) request.get("requestId");
        
        try {
            LeadReassignmentRequest reassignmentRequest = reassignmentService.getRequestById(requestId);
            reassignmentService.rejectReassignmentRequest(requestId, managerId);
            
            // Send notification to executive about rejection
            if (reassignmentRequest != null) {
                String managerName = usersRepository.findById(managerId)
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Manager");
                String leadName = reassignmentRequest.getLead().getFirstName() + " " + 
                                 reassignmentRequest.getLead().getLastName();
                notificationService.createReassignmentResponseNotification(
                    reassignmentRequest.getRequestedBy().getUserId(), managerName, "rejected", leadName);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Reassignment rejected successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    // Simple approve/reject endpoints for notification system
    @PostMapping("/simple-approve-reassignment")
    public ResponseEntity<Map<String, Object>> simpleApproveReassignment(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId) {
        Integer requestId = (Integer) request.get("requestId");
        
        try {
            log.debug("{}", "=== APPROVING REASSIGNMENT REQUEST " + requestId + " ===");
            
            LeadReassignmentRequest reassignmentRequest = reassignmentService.getRequestById(requestId);
            if (reassignmentRequest == null) {
                throw new RuntimeException("Reassignment request not found");
            }
            
            // Approve the request (this unassigns the lead)
            reassignmentService.approveReassignmentRequest(requestId, managerId);
            log.debug("Request approved and lead unassigned");
            
            // Delete the original reassignment request notification
            notificationService.deleteReassignmentRequestNotification(requestId);
            log.debug("Notification deleted");
            
            // Send notification to executive about approval
            String managerName = usersRepository.findById(managerId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Manager");
            String leadName = reassignmentRequest.getLead().getFirstName() + " " + 
                             reassignmentRequest.getLead().getLastName();
            notificationService.createReassignmentResponseNotification(
                reassignmentRequest.getRequestedBy().getUserId(), managerName, "approved", leadName);
            log.debug("Approval notification sent to executive");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Reassignment approved - lead is now available for assignment");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/simple-reject-reassignment")
    public ResponseEntity<Map<String, Object>> simpleRejectReassignment(
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId) {
        Integer requestId = (Integer) request.get("requestId");
        
        try {
            log.debug("{}", "=== REJECTING REASSIGNMENT REQUEST " + requestId + " ===");
            
            LeadReassignmentRequest reassignmentRequest = reassignmentService.getRequestById(requestId);
            if (reassignmentRequest == null) {
                throw new RuntimeException("Reassignment request not found");
            }
            
            reassignmentService.rejectReassignmentRequest(requestId, managerId);
            log.debug("Request rejected");
            
            // Delete the original reassignment request notification
            notificationService.deleteReassignmentRequestNotification(requestId);
            log.debug("Notification deleted");
            
            // Send notification to executive about rejection
            String managerName = usersRepository.findById(managerId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Manager");
            String leadName = reassignmentRequest.getLead().getFirstName() + " " + 
                             reassignmentRequest.getLead().getLastName();
            notificationService.createReassignmentResponseNotification(
                reassignmentRequest.getRequestedBy().getUserId(), managerName, "rejected", leadName);
            log.debug("Rejection notification sent to executive");
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Reassignment rejected successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    private void transferAllRelatedData(Lead lead, Integer newExecutiveId) {
        log.debug("{}", "=== TRANSFERRING ASSIGNMENT DATA FOR LEAD " + lead.getLeadId() + " TO EXECUTIVE " + newExecutiveId + " ===");
        
        Users newExecutive = usersRepository.findById(newExecutiveId).orElse(null);
        if (newExecutive == null) {
            log.debug("{}", "New executive not found: " + newExecutiveId);
            return;
        }
        
        // IMPORTANT: DO NOT change lead.createdBy - this is the immutable Owner field
        // Only assignment-related data should be transferred, not ownership
        
        // Transfer converted account assignment (not ownership)
        if (lead.getConvertedAccountId() != null) {
            accountRepository.findById(lead.getConvertedAccountId()).ifPresentOrElse(
                account -> {
                    // Only update reassignTo field, NOT createdBy (Owner remains unchanged)
                    account.setReassignTo(newExecutive);
                    accountRepository.save(account);
                    log.debug("{}", "Account " + account.getAccountId() + " reassigned to " + newExecutiveId + " (Owner unchanged)");
                },
                () -> log.debug("{}", "Account with ID " + lead.getConvertedAccountId() + " not found")
            );
        }
        
        // Transfer converted contact assignment (not ownership)
        if (lead.getConvertedContactId() != null) {
            contactRepository.findById(lead.getConvertedContactId()).ifPresentOrElse(
                contact -> {
                    // Only update reassignTo field, NOT createdBy (Owner remains unchanged)
                    contact.setReassignTo(newExecutive);
                    contactRepository.save(contact);
                    log.debug("{}", "Contact " + contact.getContactId() + " reassigned to " + newExecutiveId + " (Owner unchanged)");
                },
                () -> log.debug("{}", "Contact with ID " + lead.getConvertedContactId() + " not found")
            );
        }
        
        // Transfer converted deal assignment (not ownership)
        if (lead.getConvertedDealId() != null) {
            dealRepository.findById(lead.getConvertedDealId()).ifPresentOrElse(
                deal -> {
                    // Only update reassignTo field, NOT createdBy (Owner remains unchanged)
                    deal.setReassignTo(newExecutive);
                    dealRepository.save(deal);
                    log.debug("{}", "Deal " + deal.getDealId() + " reassigned to " + newExecutiveId + " (Owner unchanged)");
                },
                () -> log.debug("{}", "Deal with ID " + lead.getConvertedDealId() + " not found")
            );
        }
        
        // Transfer activities - these can be reassigned as they are operational
        List<com.techtammina.crm.entity.Activity> leadActivities = activityRepository.findByLead_LeadId(lead.getLeadId());
        if (!leadActivities.isEmpty()) {
            log.debug("{}", "Transferring " + leadActivities.size() + " activities for lead " + lead.getLeadId());
            for (com.techtammina.crm.entity.Activity activity : leadActivities) {
                activity.setCreatedBy(newExecutive);
                activityRepository.save(activity);
                log.debug("{}", "Activity " + activity.getActivityId() + " transferred to " + newExecutiveId);
            }
        }
        
        // Transfer emails - these can be reassigned as they are operational
        List<com.techtammina.crm.entity.Email> leadEmails = emailRepository.findByRelatedEntityTypeAndRelatedEntityIdOrderBySentDateDesc("Lead", lead.getLeadId());
        if (!leadEmails.isEmpty()) {
            log.debug("{}", "Transferring " + leadEmails.size() + " emails for lead " + lead.getLeadId());
            for (com.techtammina.crm.entity.Email email : leadEmails) {
                email.setCreatedBy(newExecutiveId);
                emailRepository.save(email);
                log.debug("{}", "Email " + email.getEmailId() + " transferred to " + newExecutiveId);
            }
        }
        
        // Transfer emails for related entities
        if (lead.getConvertedAccountId() != null) {
            List<com.techtammina.crm.entity.Email> accountEmails = emailRepository.findByRelatedEntityTypeAndRelatedEntityIdOrderBySentDateDesc("Account", lead.getConvertedAccountId());
            for (com.techtammina.crm.entity.Email email : accountEmails) {
                email.setCreatedBy(newExecutiveId);
                emailRepository.save(email);
            }
        }
        
        if (lead.getConvertedContactId() != null) {
            List<com.techtammina.crm.entity.Email> contactEmails = emailRepository.findByRelatedEntityTypeAndRelatedEntityIdOrderBySentDateDesc("Contact", lead.getConvertedContactId());
            for (com.techtammina.crm.entity.Email email : contactEmails) {
                email.setCreatedBy(newExecutiveId);
                emailRepository.save(email);
            }
        }
        
        if (lead.getConvertedDealId() != null) {
            List<com.techtammina.crm.entity.Email> dealEmails = emailRepository.findByRelatedEntityTypeAndRelatedEntityIdOrderBySentDateDesc("Deal", lead.getConvertedDealId());
            for (com.techtammina.crm.entity.Email email : dealEmails) {
                email.setCreatedBy(newExecutiveId);
                emailRepository.save(email);
            }
        }
        
        log.debug("{}", "=== COMPLETED ASSIGNMENT TRANSFER FOR LEAD " + lead.getLeadId() + " (OWNERSHIP PRESERVED) ===");
    }
    



}
