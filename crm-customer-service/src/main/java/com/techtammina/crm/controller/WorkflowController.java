package com.techtammina.crm.controller;

import com.techtammina.crm.entity.WorkflowRule;
import com.techtammina.crm.entity.WorkflowExecutionLog;
import com.techtammina.crm.service.WorkflowEngineService;
import com.techtammina.crm.service.WorkflowService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflows")
public class WorkflowController {

    private final WorkflowService workflowService;
    private final WorkflowEngineService workflowEngineService;

    public WorkflowController(WorkflowService workflowService, WorkflowEngineService workflowEngineService) {
        this.workflowService = workflowService;
        this.workflowEngineService = workflowEngineService;
    }

    @PostMapping
    public ResponseEntity<WorkflowRule> createWorkflow(@RequestBody WorkflowRule workflow,
                                                      @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        WorkflowRule created = workflowService.createWorkflow(workflow, userId);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<Page<WorkflowRule>> getAllWorkflows(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String entityType) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<WorkflowRule> workflows = workflowService.getAllWorkflows(pageable, entityType);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/{id}")
    public ResponseEntity<WorkflowRule> getWorkflowById(@PathVariable Integer id) {
        return workflowService.getWorkflowById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<WorkflowRule> updateWorkflow(@PathVariable Integer id,
                                                      @RequestBody WorkflowRule workflow,
                                                      @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        WorkflowRule updated = workflowService.updateWorkflow(id, workflow, userId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkflow(@PathVariable Integer id) {
        workflowService.deleteWorkflow(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/activate")
    public ResponseEntity<String> activateWorkflow(@PathVariable Integer id) {
        workflowService.activateWorkflow(id);
        return ResponseEntity.ok("Workflow activated successfully");
    }

    @PostMapping("/{id}/deactivate")
    public ResponseEntity<String> deactivateWorkflow(@PathVariable Integer id) {
        workflowService.deactivateWorkflow(id);
        return ResponseEntity.ok("Workflow deactivated successfully");
    }

    @PostMapping("/{id}/test")
    public ResponseEntity<String> testWorkflow(@PathVariable Integer id,
                                              @RequestBody Map<String, Object> testData) {
        workflowEngineService.testWorkflow(id, testData);
        return ResponseEntity.ok("Workflow test executed successfully");
    }

    @GetMapping("/logs")
    public ResponseEntity<Page<WorkflowExecutionLog>> getExecutionLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        
        Pageable pageable = PageRequest.of(page, size);
        Page<WorkflowExecutionLog> logs = workflowService.getExecutionLogs(pageable);
        return ResponseEntity.ok(logs);
    }

    @GetMapping("/entity/{entityType}")
    public ResponseEntity<List<WorkflowRule>> getWorkflowsByEntity(@PathVariable String entityType) {
        WorkflowRule.EntityType type = WorkflowRule.EntityType.valueOf(entityType);
        List<WorkflowRule> workflows = workflowService.getWorkflowsByEntityType(type);
        return ResponseEntity.ok(workflows);
    }

    @GetMapping("/templates")
    public ResponseEntity<List<Map<String, Object>>> getWorkflowTemplates() {
        List<Map<String, Object>> templates = workflowService.getWorkflowTemplates();
        return ResponseEntity.ok(templates);
    }

    @PostMapping("/templates/{templateName}")
    public ResponseEntity<WorkflowRule> createFromTemplate(@PathVariable String templateName,
                                                          @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        WorkflowRule workflow = workflowService.createWorkflowFromTemplate(templateName, userId);
        return ResponseEntity.ok(workflow);
    }
}

