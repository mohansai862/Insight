package com.techtammina.crm.controller;

import com.techtammina.crm.dto.CaseDTO;
import com.techtammina.crm.dto.CaseCommentDTO;
import com.techtammina.crm.service.CaseService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseService caseService;

    public CaseController(CaseService caseService) {
        this.caseService = caseService;
    }

    @PostMapping
    public ResponseEntity<CaseDTO> createCase(@RequestBody CaseDTO caseDTO, HttpServletRequest request) {
        Integer userId = (Integer) request.getAttribute("userId");
        if (userId == null) userId = 1; // Default for testing
        CaseDTO result = caseService.createCase(caseDTO, userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<Page<CaseDTO>> getAllCases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) Integer assignedTo,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<CaseDTO> cases = caseService.getAllCases(pageable, status, priority, assignedTo, userId, userRole);
        return ResponseEntity.ok(cases);
    }

    @GetMapping("/{id}")
    public ResponseEntity<CaseDTO> getCaseById(@PathVariable Integer id,
                                              @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                              @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        return caseService.getCaseById(id, userId, userRole)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<CaseDTO> updateCase(@PathVariable Integer id, 
                                             @RequestBody CaseDTO caseDTO,
                                             @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                             @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        CaseDTO result = caseService.updateCase(id, caseDTO, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/assign")
    public ResponseEntity<CaseDTO> assignCase(@PathVariable Integer id,
                                             @RequestParam Integer assigneeId,
                                             @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                             @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        CaseDTO result = caseService.assignCase(id, assigneeId, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/resolve")
    public ResponseEntity<CaseDTO> resolveCase(@PathVariable Integer id,
                                              @RequestBody String resolutionDetails,
                                              @RequestParam(required = false) String resolutionType,
                                              @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                              @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        CaseDTO result = caseService.resolveCase(id, resolutionDetails, resolutionType, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/close")
    public ResponseEntity<CaseDTO> closeCase(@PathVariable Integer id,
                                            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        CaseDTO result = caseService.closeCase(id, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/reopen")
    public ResponseEntity<CaseDTO> reopenCase(@PathVariable Integer id,
                                             @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                             @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        CaseDTO result = caseService.reopenCase(id, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/escalate")
    public ResponseEntity<CaseDTO> escalateCase(@PathVariable Integer id,
                                               @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                               @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        CaseDTO result = caseService.escalateCase(id, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<CaseCommentDTO> addComment(@PathVariable Integer id,
                                                    @RequestBody CaseCommentDTO commentDTO,
                                                    @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                    @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        CaseCommentDTO result = caseService.addComment(id, commentDTO, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/account/{accountId}")
    public ResponseEntity<List<CaseDTO>> getCasesByAccount(@PathVariable Integer accountId) {
        List<CaseDTO> cases = caseService.getCasesByAccountId(accountId);
        return ResponseEntity.ok(cases);
    }

    @GetMapping("/my-cases")
    public ResponseEntity<List<CaseDTO>> getMyCases(@RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        
        List<CaseDTO> cases = caseService.getMyCases(userId);
        return ResponseEntity.ok(cases);
    }
}

