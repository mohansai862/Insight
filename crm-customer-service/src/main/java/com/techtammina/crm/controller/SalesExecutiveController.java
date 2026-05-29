package com.techtammina.crm.controller;

import com.techtammina.crm.dto.SalesExecutiveResponse;
import com.techtammina.crm.service.SalesExecutiveService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/executives")
public class SalesExecutiveController {
    private final SalesExecutiveService salesExecutiveService;

    public SalesExecutiveController(SalesExecutiveService salesExecutiveService) {
        this.salesExecutiveService = salesExecutiveService;
    }

    @GetMapping
    public List<SalesExecutiveResponse> getAllExecutives() {
        return salesExecutiveService.getAllExecutivesWithCounts();
    }

    @GetMapping("/{executiveId}/tasks")
    public ResponseEntity<?> getExecutiveTasks(@PathVariable Long executiveId, @RequestParam(required = false) String createdBy, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String filterBy = createdBy != null && !createdBy.isEmpty() ? createdBy : userEmail;
        return ResponseEntity.ok(salesExecutiveService.getExecutiveTasks(executiveId, filterBy));
    }

    @GetMapping("/{executiveId}/communications")
    public ResponseEntity<?> getExecutiveCommunications(@PathVariable Long executiveId, @RequestParam(required = false) String createdBy, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        String filterBy = createdBy != null && !createdBy.isEmpty() ? createdBy : userEmail;
        return ResponseEntity.ok(salesExecutiveService.getExecutiveCommunications(executiveId, filterBy));
    }
}

