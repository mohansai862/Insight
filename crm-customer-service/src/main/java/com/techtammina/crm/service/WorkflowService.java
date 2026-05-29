package com.techtammina.crm.service;

import com.techtammina.crm.entity.WorkflowRule;
import com.techtammina.crm.entity.WorkflowExecutionLog;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.WorkflowRuleRepository;
import com.techtammina.crm.repository.WorkflowExecutionLogRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class WorkflowService {

    private final WorkflowRuleRepository workflowRuleRepository;
    private final WorkflowExecutionLogRepository executionLogRepository;
    private final UsersRepository usersRepository;

    public WorkflowService(WorkflowRuleRepository workflowRuleRepository,
                          WorkflowExecutionLogRepository executionLogRepository,
                          UsersRepository usersRepository) {
        this.workflowRuleRepository = workflowRuleRepository;
        this.executionLogRepository = executionLogRepository;
        this.usersRepository = usersRepository;
    }

    public WorkflowRule createWorkflow(WorkflowRule workflow, Integer userId) {
        Users user = usersRepository.findById(userId).orElseThrow();
        workflow.setCreatedBy(user);
        return workflowRuleRepository.save(workflow);
    }

    public Page<WorkflowRule> getAllWorkflows(Pageable pageable, String entityType) {
        if (entityType != null && !entityType.isEmpty()) {
            WorkflowRule.EntityType type = WorkflowRule.EntityType.valueOf(entityType);
            // For simpliCompanyLocation, return all workflows (in production, implement filtered pagination)
            return workflowRuleRepository.findAll(pageable);
        }
        return workflowRuleRepository.findAll(pageable);
    }

    public Optional<WorkflowRule> getWorkflowById(Integer id) {
        return workflowRuleRepository.findById(id);
    }

    public WorkflowRule updateWorkflow(Integer id, WorkflowRule workflow, Integer userId) {
        WorkflowRule existing = workflowRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Workflow not found"));
        
        existing.setRuleName(workflow.getRuleName());
        existing.setDescription(workflow.getDescription());
        existing.setEntityType(workflow.getEntityType());
        existing.setTriggerType(workflow.getTriggerType());
        existing.setTriggerConditions(workflow.getTriggerConditions());
        existing.setExecutionOrder(workflow.getExecutionOrder());
        
        return workflowRuleRepository.save(existing);
    }

    public void deleteWorkflow(Integer id) {
        workflowRuleRepository.deleteById(id);
    }

    public void activateWorkflow(Integer id) {
        WorkflowRule workflow = workflowRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Workflow not found"));
        workflow.setIsActive(true);
        workflowRuleRepository.save(workflow);
    }

    public void deactivateWorkflow(Integer id) {
        WorkflowRule workflow = workflowRuleRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Workflow not found"));
        workflow.setIsActive(false);
        workflowRuleRepository.save(workflow);
    }

    public Page<WorkflowExecutionLog> getExecutionLogs(Pageable pageable) {
        return executionLogRepository.findAllOrderByExecutedDateDesc(pageable);
    }

    public List<WorkflowRule> getWorkflowsByEntityType(WorkflowRule.EntityType entityType) {
        return workflowRuleRepository.findByEntityType(entityType);
    }

    public List<Map<String, Object>> getWorkflowTemplates() {
        List<Map<String, Object>> templates = new ArrayList<>();
        
        // Lead Auto-Assignment Template
        Map<String, Object> leadAssignment = new HashMap<>();
        leadAssignment.put("name", "Lead Auto-Assignment");
        leadAssignment.put("description", "Automatically assign new leads to sales reps in round-robin fashion");
        leadAssignment.put("entityType", "Lead");
        leadAssignment.put("triggerType", "OnCreate");
        templates.add(leadAssignment);
        
        // Deal Won Notification Template
        Map<String, Object> dealWon = new HashMap<>();
        dealWon.put("name", "Deal Won Notification");
        dealWon.put("description", "Send notification when deal is won");
        dealWon.put("entityType", "Deal");
        dealWon.put("triggerType", "OnUpdate");
        templates.add(dealWon);
        
        // Lead Nurturing Template
        Map<String, Object> leadNurturing = new HashMap<>();
        leadNurturing.put("name", "Lead Nurturing");
        leadNurturing.put("description", "Send follow-up email after 3 days if no contact");
        leadNurturing.put("entityType", "Lead");
        leadNurturing.put("triggerType", "Scheduled");
        templates.add(leadNurturing);
        
        return templates;
    }

    public WorkflowRule createWorkflowFromTemplate(String templateName, Integer userId) {
        Users user = usersRepository.findById(userId).orElseThrow();
        
        WorkflowRule workflow = new WorkflowRule();
        workflow.setCreatedBy(user);
        
        switch (templateName) {
            case "Lead Auto-Assignment":
                workflow.setRuleName("Lead Auto-Assignment");
                workflow.setDescription("Automatically assign new leads to sales reps in round-robin fashion");
                workflow.setEntityType(WorkflowRule.EntityType.Lead);
                workflow.setTriggerType(WorkflowRule.TriggerType.OnCreate);
                workflow.setTriggerConditions("{\"logic\": \"AND\", \"conditions\": [{\"field\": \"status\", \"operator\": \"equals\", \"value\": \"New\"}]}");
                break;
                
            case "Deal Won Notification":
                workflow.setRuleName("Deal Won Notification");
                workflow.setDescription("Send notification when deal is won");
                workflow.setEntityType(WorkflowRule.EntityType.Deal);
                workflow.setTriggerType(WorkflowRule.TriggerType.OnUpdate);
                workflow.setTriggerConditions("{\"logic\": \"AND\", \"conditions\": [{\"field\": \"status\", \"operator\": \"equals\", \"value\": \"Won\"}]}");
                break;
                
            default:
                throw new RuntimeException("Unknown template: " + templateName);
        }
        
        return workflowRuleRepository.save(workflow);
    }
}

