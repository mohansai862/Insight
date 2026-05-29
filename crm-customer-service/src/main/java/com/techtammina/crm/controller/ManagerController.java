package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.LeadDTO;
import com.techtammina.crm.service.LeadService;
import com.techtammina.crm.service.SalesManagerService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manager")
@Slf4j
public class ManagerController {
    private static final Logger log = LoggerFactory.getLogger(ManagerController.class);
    private final LeadService leadService;
    private final SalesManagerService salesManagerService;

    public ManagerController(LeadService leadService, SalesManagerService salesManagerService) {
        this.leadService = leadService;
        this.salesManagerService = salesManagerService;
    }

    @GetMapping("/executives/{execId}/leads")
    public ResponseEntity<Map<String, Object>> getExecutiveLeads(
            @PathVariable Integer execId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String q,
            @RequestHeader("X-User-Id") Integer managerId,
            @RequestHeader("X-User-Role") String userRole) {
        
        log.info("Manager {} requesting leads for executive {}, page={}, size={}, q={}", 
                   managerId, execId, page, size, q);

        // Validate user is Sales_Manager
        if (!"Sales_Manager".equals(userRole)) {
            log.warn("Access denied: User {} with role {} attempted to access executive leads", managerId, userRole);
            return ResponseEntity.status(403).build();
        }

        try {
            // Validate executive belongs to manager
            if (!salesManagerService.isExecutiveUnderManager(execId, managerId)) {
                log.warn("Access denied: Executive {} does not belong to manager {}", execId, managerId);
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "executive_not_under_manager");
                errorResponse.put("message", "Selected executive does not belong to this manager");
                return ResponseEntity.status(403).body(errorResponse);
            }

            // Get leads for executive with pagination
            List<LeadDTO> leads = leadService.filterByExecutive(execId, managerId, userRole, q);
            
            // Apply pagination
            int start = page * size;
            int end = Math.min(start + size, leads.size());
            List<LeadDTO> pagedLeads = leads.subList(start, end);
            
            Map<String, Object> response = new HashMap<>();
            response.put("data", pagedLeads);
            
            Map<String, Object> meta = new HashMap<>();
            meta.put("total", leads.size());
            meta.put("page", page);
            meta.put("size", size);
            meta.put("totalPages", (int) Math.ceil((double) leads.size() / size));
            response.put("meta", meta);
            
            log.info("Returned {} leads for executive {} (total: {})", pagedLeads.size(), execId, leads.size());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Database error filtering leads for executive {}: {}", execId, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "db_error");
            errorResponse.put("message", "Database error occurred while filtering leads");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }
}