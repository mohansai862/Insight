package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.LeadDTO;
import com.techtammina.crm.dto.UserDTO;
import com.techtammina.crm.service.LeadService;
import com.techtammina.crm.service.LeadSyncService;
import com.techtammina.crm.service.LeadReassignmentService;
import com.techtammina.crm.service.NotificationService;
import com.techtammina.crm.service.SalesManagerService;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.repository.LeadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import com.techtammina.crm.dto.ExcelUploadResultDTO;
import jakarta.validation.Valid;
import org.springframework.validation.BindingResult;
import java.util.HashMap;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leads")
@Slf4j
public class LeadController {
    private static final Logger log = LoggerFactory.getLogger(LeadController.class);
    private final LeadService leadService;
    private final SalesManagerService salesManagerService;
    private final LeadReassignmentService reassignmentService;
    private final NotificationService notificationService;
    private final UsersRepository usersRepository;
    private final LeadRepository leadRepository;
    private final LeadSyncService leadSyncService;

    public LeadController(LeadService leadService, SalesManagerService salesManagerService,
                         LeadReassignmentService reassignmentService, NotificationService notificationService,
                         UsersRepository usersRepository, LeadRepository leadRepository, LeadSyncService leadSyncService) {
        this.leadService = leadService;
        this.salesManagerService = salesManagerService;
        this.reassignmentService = reassignmentService;
        this.notificationService = notificationService;
        this.usersRepository = usersRepository;
        this.leadRepository = leadRepository;
        this.leadSyncService = leadSyncService;
    }

    @PostMapping
    public ResponseEntity<?> create(@Valid @RequestBody LeadDTO dto, BindingResult bindingResult, HttpServletRequest request) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
            return ResponseEntity.badRequest().body(Map.of("errors", errors));
        }
        log.debug("BACKEND CONTROLLER: POST /api/leads - Request received!");
        log.debug("Email to create: {}", dto.getEmail());
        log.debug("CONTROLLER DEBUG - Received DTO source: '{}'", dto.getSource());
        log.debug("CONTROLLER DEBUG - Special fields received:");
        log.debug("   customerLocation: '{}'", dto.getCustomerLocation());
        log.debug("   prospectValue: {}", dto.getProspectValue());
        log.debug("   decisionAuthority: '{}'", dto.getDecisionAuthority());
        log.debug("CONTROLLER DEBUG - Full DTO: {}", dto.toString());
        
        Integer userId = (Integer) request.getAttribute("userId");
        log.info("Backend: Creating lead for user: {} with email: {}", userId, dto.getEmail());

        dto.setCreatedById(userId);
        LeadDTO result = leadService.create(dto);
        log.info("Backend: Lead created successfully with ID: {} - Email should be sent", result.getId());
        
        log.debug("BACKEND CONTROLLER: Lead creation completed - ID: {}", result.getId());
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(@RequestParam(required = false) String search,
                                              @RequestParam(required = false) String q,
                                              @RequestParam(required = false) Integer manager,
                                              @RequestParam(required = false) Integer executive,
                                              @RequestParam(required = false) String status,
                                              @RequestParam(required = false) String source,
                                              @RequestParam(required = false) String startDate,
                                              @RequestParam(required = false) String endDate,
                                              @RequestParam(defaultValue = "0") int page,
                                              @RequestParam(defaultValue = "10") int size,
                                              @RequestParam(required = false) Integer ownerId,
                                              @RequestParam(required = false) Integer assignedToId,
                                              @RequestParam(required = false) Integer createdById,
                                              @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                              @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Input validation and sanitization
        if (StringUtils.hasText(q) && q.length() > 100) {
            return ResponseEntity.badRequest().build();
        }
        if (StringUtils.hasText(q)) {
            q = q.replaceAll("[^a-zA-Z0-9\\\\s@.-]", "").trim();
        }
        
        // Validate ID parameters
        if (ownerId != null && ownerId <= 0) {
            return ResponseEntity.badRequest().build();
        }
        if (assignedToId != null && assignedToId <= 0) {
            return ResponseEntity.badRequest().build();
        }
        if (createdById != null && createdById <= 0) {
            return ResponseEntity.badRequest().build();
        }
        
        // For testing: if no userId/role provided, use defaults
        if (userId == null) {
            userId = 1; // Default user for testing
            log.warn("No X-User-Id header provided, using default user ID");
        }
        if (userRole == null) {
            userRole = "Sales_Manager"; // Default role for testing
            log.warn("No X-User-Role header provided, using default role");
        }

        try {
            // Use search parameter if provided, otherwise fall back to q for backward compatibility
            String searchQuery = search != null ? search : q;
            
            boolean hasUserFilter = ownerId != null || assignedToId != null || createdById != null;
            if (hasUserFilter) {
                Integer filterUserId = ownerId != null ? ownerId : 
                                     (assignedToId != null ? assignedToId : createdById);
                List<LeadDTO> leads = leadService.listByUserAssociations(searchQuery, filterUserId);
                Map<String, Object> response = new HashMap<>();
                response.put("data", leads);
                response.put("totalElements", leads.size());
                response.put("totalPages", 1);
                response.put("currentPage", 0);
                response.put("size", leads.size());
                return ResponseEntity.ok(response);
            }
            return ResponseEntity.ok(leadService.listFilteredWithPagination(searchQuery, manager, executive, status, source, startDate, endDate, page, size, userId, userRole));
        } catch (Exception e) {
            log.error("Error listing leads", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<LeadDTO> get(@PathVariable Integer id,
                                       @RequestHeader("X-User-Id") Integer userId,
                                       @RequestHeader("X-User-Role") String userRole) {
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            return leadService.get(id, userId, userRole).map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting lead with ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @Valid @RequestBody LeadDTO dto, BindingResult bindingResult,
                                          @RequestHeader("X-User-Id") Integer userId,
                                          @RequestHeader("X-User-Role") String userRole) {
        if (bindingResult.hasErrors()) {
            Map<String, String> errors = new HashMap<>();
            bindingResult.getFieldErrors().forEach(e -> errors.put(e.getField(), e.getDefaultMessage()));
            return ResponseEntity.badRequest().body(Map.of("errors", errors));
        }
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest().build();
        }
        
        log.debug("Received Lead Update - companyLocation: {}", dto.getCompanyLocation());
        
        try {
            return ResponseEntity.ok(leadService.update(id, dto, userId, userRole));
        } catch (Exception e) {
            log.error("Error updating lead with ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id,
                                       @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                       @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest().build();
        }
        
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        try {
            leadService.delete(id, userId, userRole);
            log.info("Lead deleted successfully with ID: {}", id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Business error deleting lead with ID: {}: {}", id, e.getMessage());
            return ResponseEntity.status(403).build(); // Forbidden for access denied
        } catch (Exception e) {
            log.error("Error deleting lead with ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<LeadDTO> updateStatus(@PathVariable Integer id, @RequestParam String status,
                                                @RequestHeader("X-User-Id") Integer userId,
                                                @RequestHeader("X-User-Role") String userRole) {
        // Input validation and sanitization for status parameter
        if (!StringUtils.hasText(status) || status.length() > 50) {
            return ResponseEntity.badRequest().build();
        }
        
        // Validate ID parameter
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest().build();
        }
        
        // Sanitize status parameter - only allow alphanumeric and underscore
        status = status.replaceAll("[^a-zA-Z0-9_]", "").trim();
        if (status.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            return ResponseEntity.ok(leadService.updateStatus(id, status, userId, userRole));
        } catch (Exception e) {
            log.error("Error updating status for lead with ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }



    @PostMapping("/{id}/convert")
    public ResponseEntity<com.techtammina.crm.dto.ConvertLeadResponse> convert(@PathVariable Integer id, @RequestBody Map<String, Object> conversionData,
                                           @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                           @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // For testing: if no userId/role provided, use defaults
        if (userId == null) {
            userId = 1; // Default user for testing
            log.warn("No X-User-Id header provided, using default user ID");
        }
        if (userRole == null) {
            userRole = "Sales_Manager"; // Default role for testing
            log.warn("No X-User-Role header provided, using default role");
        }
        
        log.debug("BACKEND: Convert lead request - ID: {}, User: {}, Role: {}", id, userId, userRole);
        // Validate path variable
        if (id == null || id <= 0) {
            return ResponseEntity.badRequest().build();
        }

        // Validate and sanitize conversion data
        if (conversionData != null) {
            conversionData.entrySet().removeIf(entry -> {
                String key = entry.getKey();
                Object value = entry.getValue();
                // Only allow safe keys and sanitize string values
                if (key == null || !key.matches("^[a-zA-Z0-9_]+$")) {
                    return true;
                }
                if (value instanceof String) {
                    String sanitized = ((String) value).replaceAll("[<>\"'&;]", "");
                    entry.setValue(sanitized);
                }
                return false;
            });
        }

        try {
            log.debug("Converting lead with ID: {}", id);
            com.techtammina.crm.dto.ConvertLeadResponse result = leadService.convert(id, conversionData, userId, userRole);
            log.debug("Lead conversion completed for ID: {}", id);
            log.debug("BACKEND: Lead conversion successful for ID: {}", id);
            return ResponseEntity.status(201).body(result);
        } catch (Exception e) {
            log.error("Error converting lead with ID: {}", id, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/filterByExecutive")
    public ResponseEntity<List<LeadDTO>> filterByExecutive(@RequestParam Integer executiveId,
                                                           @RequestParam(required = false) String q,
                                                           @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                           @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        try {
            List<LeadDTO> result = leadService.filterByExecutive(executiveId, userId, userRole, q);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("Access denied")) {
                return ResponseEntity.status(403).build();
            }
            log.error("Error filtering leads by executive with ID: {}", executiveId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/manager-leads")
    public ResponseEntity<List<LeadDTO>> getManagerLeads(@RequestParam(required = false) String q,
                                                         @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                         @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Input validation and sanitization
        if (StringUtils.hasText(q) && q.length() > 100) {
            return ResponseEntity.badRequest().build();
        }
        if (StringUtils.hasText(q)) {
            q = q.replaceAll("[^a-zA-Z0-9\\\\s@.-]", "").trim();
        }

        // For testing: if no userId/role provided, use defaults
        if (userId == null) {
            userId = 1; // Default user for testing
            log.warn("No X-User-Id header provided, using default user ID");
        }
        if (userRole == null) {
            userRole = "Sales_Manager"; // Default role for testing
            log.warn("No X-User-Role header provided, using default role");
        }

        try {
            List<LeadDTO> result = leadService.getLeadsForManager(userId, userRole, q);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting leads for manager with ID: {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/executives")
    public ResponseEntity<List<UserDTO>> getExecutives(@RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                       @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // For testing: if no userId/role provided, use defaults
        if (userId == null) {
            userId = 1; // Default user for testing
            log.warn("No X-User-Id header provided, using default user ID");
        }
        if (userRole == null) {
            userRole = "Sales_Manager"; // Default role for testing
            log.warn("No X-User-Role header provided, using default role");
        }

        try {
            List<UserDTO> result = salesManagerService.getExecutivesUnderManager(userId);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting executives for manager with ID: {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PostMapping("/{id}/request-reassignment")
    public ResponseEntity<Map<String, Object>> requestReassignment(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> request,
            @RequestHeader(value = "X-User-Id", required = false) Integer executiveId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (!"Sales_Executive".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Only executives can request reassignment"));
        }
        
        String reason = (String) request.get("reason");
        if (reason == null || reason.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Reason is required"));
        }
        
        try {
            var reassignmentRequest = reassignmentService.requestReassignment(id, executiveId, reason);
            
            // Send notification to manager - FIXED LOGIC
            var lead = leadRepository.findById(id).orElse(null);
            var executive = usersRepository.findById(executiveId).orElse(null);
            
            if (lead != null && executive != null) {
                String executiveName = executive.getFirstName() + " " + executive.getLastName();
                String leadName = lead.getFirstName() + " " + lead.getLastName();
                
                // FIXED: Determine the correct manager to notify
                Integer targetManagerId = null;
                
                // Primary: Use executive's manager
                if (executive.getManagerId() != null) {
                    targetManagerId = executive.getManagerId();
                }
                
                // FALLBACK: If executive's manager is null, check lead's "Created By"
                if (targetManagerId == null && lead.getCreatedBy() != null) {
                    String creatorRole = lead.getCreatedBy().getRole();
                    if ("Sales_Manager".equals(creatorRole) || "Sales_VP".equals(creatorRole)) {
                        // If lead was created by a Manager/VP, notify them directly
                        targetManagerId = lead.getCreatedBy().getUserId();
                    } else if (lead.getCreatedBy().getManagerId() != null) {
                        // If lead creator has a manager, notify that manager
                        targetManagerId = lead.getCreatedBy().getManagerId();
                    }
                }
                
                // FINAL FALLBACK: Find any Sales_Manager or Sales_VP in the system
                if (targetManagerId == null) {
                    var managers = usersRepository.findByRole("Sales_Manager");
                    if (managers.isEmpty()) {
                        managers = usersRepository.findByRole("Sales_VP");
                    }
                    if (!managers.isEmpty()) {
                        targetManagerId = managers.get(0).getUserId();
                    }
                }
                
                // Send notification if we have a target manager
                if (targetManagerId != null) {
                    notificationService.createReassignmentRequestNotification(
                        targetManagerId, executiveName, leadName, reason, reassignmentRequest.getId());
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reassignment request submitted successfully",
                "requestId", reassignmentRequest.getId()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PostMapping("/reassignment-requests/{requestId}/approve")
    public ResponseEntity<Map<String, Object>> approveReassignment(
            @PathVariable Integer requestId,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (!"Sales_Manager".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Only managers can approve reassignment"));
        }
        
        try {
            var request = reassignmentService.approveReassignmentRequest(requestId, managerId);
            
            // Send notification to executive
            String managerName = usersRepository.findById(managerId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Manager");
            String leadName = request.getLead().getFirstName() + " " + request.getLead().getLastName();
            notificationService.createReassignmentResponseNotification(
                request.getRequestedBy().getUserId(), managerName, "approved", leadName);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reassignment request approved successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @PostMapping("/reassignment-requests/{requestId}/reject")
    public ResponseEntity<Map<String, Object>> rejectReassignment(
            @PathVariable Integer requestId,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (!"Sales_Manager".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of("success", false, "message", "Only managers can reject reassignment"));
        }
        
        try {
            var request = reassignmentService.rejectReassignmentRequest(requestId, managerId);
            
            // Send notification to executive
            String managerName = usersRepository.findById(managerId)
                .map(u -> u.getFirstName() + " " + u.getLastName())
                .orElse("Manager");
            String leadName = request.getLead().getFirstName() + " " + request.getLead().getLastName();
            notificationService.createReassignmentResponseNotification(
                request.getRequestedBy().getUserId(), managerName, "rejected", leadName);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Reassignment request rejected successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
    
    @GetMapping("/reassignment-requests/pending")
    public ResponseEntity<List<Map<String, Object>>> getPendingReassignmentRequests(
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (!"Sales_Manager".equals(userRole)) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            var requests = reassignmentService.getPendingRequestsForManager(managerId);
            List<Map<String, Object>> response = new ArrayList<>();
            for (var request : requests) {
                var lead = request.getLead();
                var executive = request.getRequestedBy();
                Map<String, Object> requestMap = Map.of(
                    "id", request.getId(),
                    "leadName", lead.getFirstName() + " " + lead.getLastName(),
                    "executiveName", executive.getFirstName() + " " + executive.getLastName(),
                    "reason", request.getReason(),
                    "requestedDate", request.getRequestedDate().toString()
                );
                response.add(requestMap);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/reassignment-requests/my-pending")
    public ResponseEntity<List<Map<String, Object>>> getMyPendingReassignmentRequests(
            @RequestHeader(value = "X-User-Id", required = false) Integer executiveId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (!"Sales_Executive".equals(userRole)) {
            return ResponseEntity.status(403).build();
        }
        
        try {
            var requests = reassignmentService.getPendingRequestsByExecutive(executiveId);
            List<Map<String, Object>> response = new ArrayList<>();
            for (var request : requests) {
                var lead = request.getLead();
                Map<String, Object> requestMap = Map.of(
                    "id", request.getId(),
                    "leadId", lead.getLeadId(),
                    "leadName", lead.getFirstName() + " " + lead.getLastName(),
                    "reason", request.getReason(),
                    "requestedDate", request.getRequestedDate().toString()
                );
                response.add(requestMap);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/upload-excel")
    public ResponseEntity<ExcelUploadResultDTO> uploadExcel(@RequestParam("file") MultipartFile file,
                                                           @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                           @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        log.info("Excel upload request received from user: {}, role: {}", userId, userRole);
        
        // Validate file
        if (file.isEmpty()) {
            ExcelUploadResultDTO errorResult = new ExcelUploadResultDTO();
            errorResult.setTotalRecords(0);
            errorResult.setSuccessfulRecords(0);
            errorResult.setFailedRecords(1);
            errorResult.setSuccess(false);
            errorResult.setMessage("No file selected. Please choose an Excel file to upload.");
            errorResult.setErrors(List.of("No file selected"));
            errorResult.setCreatedLeads(new ArrayList<>());
            return ResponseEntity.badRequest().body(errorResult);
        }
        
        String fileName = file.getOriginalFilename();
        if (fileName == null || (!fileName.toLowerCase().endsWith(".xlsx") && !fileName.toLowerCase().endsWith(".xls"))) {
            ExcelUploadResultDTO errorResult = new ExcelUploadResultDTO();
            errorResult.setTotalRecords(0);
            errorResult.setSuccessfulRecords(0);
            errorResult.setFailedRecords(1);
            errorResult.setSuccess(false);
            errorResult.setMessage("Invalid file format. Please upload an Excel file (.xlsx or .xls).");
            errorResult.setErrors(List.of("Invalid file format: " + (fileName != null ? fileName : "unknown")));
            errorResult.setCreatedLeads(new ArrayList<>());
            return ResponseEntity.badRequest().body(errorResult);
        }
        
        // Ensure userId is available - critical for created_by assignment
        if (userId == null) {
            log.error("No X-User-Id header provided for Excel upload - this will cause created_by to be null");
            ExcelUploadResultDTO errorResult = new ExcelUploadResultDTO();
            errorResult.setTotalRecords(0);
            errorResult.setSuccessfulRecords(0);
            errorResult.setFailedRecords(1);
            errorResult.setSuccess(false);
            errorResult.setMessage("User authentication required. Please log in and try again.");
            errorResult.setErrors(List.of("User ID not provided - authentication required"));
            errorResult.setCreatedLeads(new ArrayList<>());
            return ResponseEntity.badRequest().body(errorResult);
        }
        
        log.info("Processing Excel upload for user ID: {} (role: {})", userId, userRole);
        
        try {
            ExcelUploadResultDTO result = leadService.uploadExcelFile(file, userId);
            
            if (result.isSuccess()) {
                log.info("Excel upload successful. Records: {}", result.getSuccessfulRecords());
                return ResponseEntity.ok(result);
            } else {
                log.warn("Excel upload failed with validation errors: {}", result.getErrors().size());
                return ResponseEntity.badRequest().body(result);
            }
        } catch (Exception e) {
            log.error("Unexpected error uploading Excel file: {}", e.getMessage(), e);
            
            ExcelUploadResultDTO errorResult = new ExcelUploadResultDTO();
            errorResult.setTotalRecords(0);
            errorResult.setSuccessfulRecords(0);
            errorResult.setFailedRecords(1);
            errorResult.setSuccess(false);
            errorResult.setMessage("Unexpected error processing file: " + e.getMessage());
            errorResult.setErrors(List.of("System error: " + e.getMessage()));
            errorResult.setCreatedLeads(new ArrayList<>());
            
            return ResponseEntity.status(500).body(errorResult);
        }
    }

    @PostMapping("/sync-all")
    public ResponseEntity<Map<String, Object>> syncAllConvertedLeads(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        // Only allow IT_Admin or Sales_VP to trigger full sync
        if (!"IT_Admin".equals(userRole) && !"Sales_VP".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of(
                "success", false,
                "message", "Only IT Admin or Sales VP can trigger full synchronization"
            ));
        }
        
        try {
            leadSyncService.syncAllConvertedLeads();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "All converted leads synchronized successfully"
            ));
        } catch (Exception e) {
            log.error("Failed to sync all converted leads", e);
            return ResponseEntity.status(500).body(Map.of(
                "success", false,
                "message", "Synchronization failed: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/debug-reassignment/{managerId}")
    public ResponseEntity<Map<String, Object>> debugReassignment(@PathVariable Integer managerId) {
        Map<String, Object> debug = new HashMap<>();
        
        // Check all pending requests in system
        var allPending = reassignmentService.getAllPendingRequests();
        debug.put("totalPendingInSystem", allPending.size());
        
        // Check requests for this manager
        var managerRequests = reassignmentService.getPendingRequestsForManager(managerId);
        debug.put("pendingForManager", managerRequests.size());
        debug.put("managerId", managerId);
        
        List<Map<String, Object>> allRequestsInfo = new ArrayList<>();
        for (var req : allPending) {
            Map<String, Object> reqMap = new HashMap<>();
            reqMap.put("id", req.getId());
            reqMap.put("requestedById", req.getRequestedBy().getUserId());
            reqMap.put("requestedByManagerId", req.getRequestedBy().getManagerId());
            reqMap.put("leadId", req.getLead().getLeadId());
            reqMap.put("status", req.getStatus().toString());
            reqMap.put("matchesManager", req.getRequestedBy().getManagerId() != null && req.getRequestedBy().getManagerId().equals(managerId));
            allRequestsInfo.add(reqMap);
        }
        debug.put("allPendingRequests", allRequestsInfo);
        
        return ResponseEntity.ok(debug);
    }
    
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportLeads(@RequestParam(required = false) String q,
                                              @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                              @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        log.info("Export request received - userId: {}, userRole: {}, query: {}", userId, userRole, q);
        
        // For testing: if no userId/role provided, use defaults
        if (userId == null) {
            userId = 1; // Default user for testing
            log.warn("No X-User-Id header provided, using default user ID");
        }
        if (userRole == null) {
            userRole = "Sales_Manager"; // Default role for testing
            log.warn("No X-User-Role header provided, using default role");
        }

        try {
            log.info("Calling leadService.exportLeadsToExcel with userId: {}, userRole: {}", userId, userRole);
            byte[] excelData = leadService.exportLeadsToExcel(q, userId, userRole);
            log.info("Export successful, data size: {} bytes", excelData.length);
            
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=leads_export.xlsx")
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(excelData);
        } catch (Exception e) {
            log.error("Error exporting leads: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

}



