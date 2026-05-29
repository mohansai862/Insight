package com.techtammina.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techtammina.crm.entity.*;
import com.techtammina.crm.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class WorkflowEngineService {

    private final WorkflowRuleRepository workflowRuleRepository;
    private final WorkflowActionRepository workflowActionRepository;
    private final WorkflowExecutionLogRepository executionLogRepository;
    private final WorkflowActionService actionService;
    private final ObjectMapper objectMapper;

    public WorkflowEngineService(WorkflowRuleRepository workflowRuleRepository,
                               WorkflowActionRepository workflowActionRepository,
                               WorkflowExecutionLogRepository executionLogRepository,
                               WorkflowActionService actionService,
                               ObjectMapper objectMapper) {
        this.workflowRuleRepository = workflowRuleRepository;
        this.workflowActionRepository = workflowActionRepository;
        this.executionLogRepository = executionLogRepository;
        this.actionService = actionService;
        this.objectMapper = objectMapper;
    }

    public void triggerWorkflows(WorkflowRule.EntityType entityType, WorkflowRule.TriggerType triggerType, 
                               Integer entityId, Map<String, Object> entityData) {
        List<WorkflowRule> workflows = workflowRuleRepository
            .findActiveWorkflowsByEntityAndTrigger(entityType, triggerType);
        
        for (WorkflowRule workflow : workflows) {
            if (evaluateTriggerConditions(workflow, entityData)) {
                executeWorkflow(workflow, entityId, entityData);
            }
        }
    }

    public boolean evaluateTriggerConditions(WorkflowRule workflow, Map<String, Object> entityData) {
        if (workflow.getTriggerConditions() == null || workflow.getTriggerConditions().isEmpty()) {
            return true;
        }
        
        try {
            JsonNode conditionsNode = objectMapper.readTree(workflow.getTriggerConditions());
            return evaluateConditionGroup(conditionsNode, entityData);
        } catch (Exception e) {
            logWorkflowExecution(workflow, null, WorkflowExecutionLog.ExecutionStatus.Failed, 
                               "Error evaluating conditions: " + e.getMessage());
            return false;
        }
    }

    private boolean evaluateConditionGroup(JsonNode conditionsNode, Map<String, Object> entityData) {
        String logic = conditionsNode.get("logic").asText("AND");
        JsonNode conditions = conditionsNode.get("conditions");
        
        boolean result = logic.equals("AND");
        
        for (JsonNode condition : conditions) {
            boolean conditionResult = evaluateSingleCondition(condition, entityData);
            
            if (logic.equals("AND")) {
                result = result && conditionResult;
            } else if (logic.equals("OR")) {
                result = result || conditionResult;
            }
        }
        
        return result;
    }

    private boolean evaluateSingleCondition(JsonNode condition, Map<String, Object> entityData) {
        String field = condition.get("field").asText();
        String operator = condition.get("operator").asText();
        String value = condition.get("value").asText();
        
        Object fieldValue = entityData.get(field);
        if (fieldValue == null) return false;
        
        String fieldValueStr = fieldValue.toString();
        
        switch (operator) {
            case "equals":
                return fieldValueStr.equals(value);
            case "not equals":
                return !fieldValueStr.equals(value);
            case "contains":
                return fieldValueStr.toLowerCase().contains(value.toLowerCase());
            case "starts with":
                return fieldValueStr.toLowerCase().startsWith(value.toLowerCase());
            case "is empty":
                return fieldValueStr.isEmpty();
            case "is not empty":
                return !fieldValueStr.isEmpty();
            case "greater than":
                try {
                    return Double.parseDouble(fieldValueStr) > Double.parseDouble(value);
                } catch (NumberFormatException e) {
                    return false;
                }
            case "less than":
                try {
                    return Double.parseDouble(fieldValueStr) < Double.parseDouble(value);
                } catch (NumberFormatException e) {
                    return false;
                }
            default:
                return false;
        }
    }

    public void executeWorkflow(WorkflowRule workflow, Integer entityId, Map<String, Object> entityData) {
        try {
            List<WorkflowAction> actions = workflowActionRepository.findByRuleIdOrderBySequence(workflow.getRuleId());
            
            for (WorkflowAction action : actions) {
                if (action.getDelayMinutes() > 0) {
                    // Schedule delayed action (simplified - in production use job scheduler)
                    scheduleDelayedAction(action, entityId, entityData);
                } else {
                    actionService.executeAction(action, entityId, entityData);
                }
            }
            
            // Update workflow execution stats
            workflow.setLastExecuted(LocalDateTime.now());
            workflow.setExecutionCount(workflow.getExecutionCount() + 1);
            workflowRuleRepository.save(workflow);
            
            logWorkflowExecution(workflow, entityId, WorkflowExecutionLog.ExecutionStatus.Success, null);
            
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(WorkflowEngineService.class)
                .error("Workflow execution failed for rule: {}", workflow.getRuleId(), e);
            logWorkflowExecution(workflow, entityId, WorkflowExecutionLog.ExecutionStatus.Failed, "Execution failed");
        }
    }

    private void scheduleDelayedAction(WorkflowAction action, Integer entityId, Map<String, Object> entityData) {
        // In production, this would use a job scheduler like Quartz
        // For now, just log the scheduled action
        org.slf4j.LoggerFactory.getLogger(WorkflowEngineService.class)
            .info("Action scheduled for entity: {} with delay: {} minutes", entityId, action.getDelayMinutes());
    }

    private void logWorkflowExecution(WorkflowRule workflow, Integer entityId, 
                                    WorkflowExecutionLog.ExecutionStatus status, String errorMessage) {
        WorkflowExecutionLog log = new WorkflowExecutionLog();
        log.setWorkflowRule(workflow);
        log.setEntityId(entityId);
        log.setEntityType(workflow.getEntityType().name());
        log.setStatus(status);
        log.setErrorMessage(errorMessage);
        executionLogRepository.save(log);
    }

    public void testWorkflow(Integer ruleId, Map<String, Object> testData) {
        WorkflowRule workflow = workflowRuleRepository.findById(ruleId)
            .orElseThrow(() -> new RuntimeException("Workflow not found"));
        
        if (evaluateTriggerConditions(workflow, testData)) {
            executeWorkflow(workflow, 0, testData); // Use 0 as test entity ID
        }
    }
}

