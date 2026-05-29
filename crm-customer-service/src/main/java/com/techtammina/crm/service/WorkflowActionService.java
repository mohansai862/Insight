package com.techtammina.crm.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techtammina.crm.entity.*;
import com.techtammina.crm.repository.*;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class WorkflowActionService {

    private final EmailService emailService;
    private final NotificationService notificationService;
    private final TaskRepository taskRepository;
    private final UsersRepository usersRepository;
    private final ObjectMapper objectMapper;

    public WorkflowActionService(EmailService emailService,
                               NotificationService notificationService,
                               TaskRepository taskRepository,
                               UsersRepository usersRepository,
                               ObjectMapper objectMapper) {
        this.emailService = emailService;
        this.notificationService = notificationService;
        this.taskRepository = taskRepository;
        this.usersRepository = usersRepository;
        this.objectMapper = objectMapper;
    }

    public void executeAction(WorkflowAction action, Integer entityId, Map<String, Object> entityData) {
        try {
            JsonNode config = objectMapper.readTree(action.getActionConfig());
            
            switch (action.getActionType()) {
                case SendEmail:
                    executeSendEmail(config, entityData);
                    break;
                case CreateTask:
                    executeCreateTask(config, entityId, entityData);
                    break;
                case UpdateField:
                    executeUpdateField(config, entityId, entityData);
                    break;
                case SendNotification:
                    executeSendNotification(config, entityData);
                    break;
                case AssignRecord:
                    executeAssignRecord(config, entityId, entityData);
                    break;
                case CallWebhook:
                    executeCallWebhook(config, entityData);
                    break;
                case CreateRecord:
                    executeCreateRecord(config, entityData);
                    break;
            }
        } catch (Exception e) {
            org.slf4j.LoggerFactory.getLogger(WorkflowActionService.class)
                .error("Action execution failed", e);
            throw new RuntimeException("Action execution failed", e);
        }
    }

    private void executeSendEmail(JsonNode config, Map<String, Object> entityData) {
        Integer templateId = config.get("templateId").asInt();
        String to = replacePlaceholders(config.get("to").asText(), entityData);
        String cc = config.has("cc") ? replacePlaceholders(config.get("cc").asText(), entityData) : null;
        
        emailService.sendEmailFromTemplate(templateId, to, cc, entityData);
    }

    private void executeCreateTask(JsonNode config, Integer entityId, Map<String, Object> entityData) {
        String subject = replacePlaceholders(config.get("subject").asText(), entityData);
        String assignToStr = replacePlaceholders(config.get("assignTo").asText(), entityData);
        String priority = config.get("priority").asText();
        
        // Parse assignTo - could be user ID or email
        Integer assignToUserId = parseUserId(assignToStr);
        
        Task task = new Task();
        task.setTitle(subject);
        task.setPriority(Task.Priority.valueOf(priority));
        task.setStatus(Task.Status.Pending);
        
        if (assignToUserId != null) {
            Users assignedUser = usersRepository.findById(assignToUserId).orElse(null);
            task.setOwner(assignedUser);
        }
        
        // Set due date based on config
        if (config.has("dueDate")) {
            String dueDateStr = config.get("dueDate").asText();
            LocalDateTime dueDate = parseDueDate(dueDateStr);
            task.setDueDate(dueDate.toLocalDate());
        }
        
        taskRepository.save(task);
    }

    private void executeUpdateField(JsonNode config, Integer entityId, Map<String, Object> entityData) {
        String field = config.get("field").asText();
        String value = replacePlaceholders(config.get("value").asText(), entityData);
        
        // In production, this would use reflection or entity-specific services
        // to update the field value
        // Field update logic would be implemented here
        // Logging field updates for audit purposes
        org.slf4j.LoggerFactory.getLogger(WorkflowActionService.class)
            .info("Field update requested for entity: {}", entityId);
    }

    private void executeSendNotification(JsonNode config, Map<String, Object> entityData) {
        String message = replacePlaceholders(config.get("message").asText(), entityData);
        String userIdStr = replacePlaceholders(config.get("userId").asText(), entityData);
        
        Integer userId = parseUserId(userIdStr);
        if (userId != null) {
            notificationService.sendInAppNotification(userId, message);
        }
    }

    private void executeAssignRecord(JsonNode config, Integer entityId, Map<String, Object> entityData) {
        String assignToStr = replacePlaceholders(config.get("assignTo").asText(), entityData);
        Integer assignToUserId = parseUserId(assignToStr);
        
        // In production, this would update the record owner
        // Record assignment logic would be implemented here
        org.slf4j.LoggerFactory.getLogger(WorkflowActionService.class)
            .info("Record assignment requested for entity: {}", entityId);
    }

    private void executeCallWebhook(JsonNode config, Map<String, Object> entityData) {
        String url = config.get("url").asText();
        String method = config.get("method").asText("POST");
        
        // In production, this would make HTTP call to webhook URL
        // Webhook call logic would be implemented here
        org.slf4j.LoggerFactory.getLogger(WorkflowActionService.class)
            .info("Webhook call requested: {} {}", method, "[URL_REDACTED]");
    }

    private void executeCreateRecord(JsonNode config, Map<String, Object> entityData) {
        String entityType = config.get("entityType").asText();
        JsonNode fields = config.get("fields");
        
        // In production, this would create a new record of the specified type
        // Record creation logic would be implemented here
        org.slf4j.LoggerFactory.getLogger(WorkflowActionService.class)
            .info("Record creation requested for type: {}", entityType);
    }

    private String replacePlaceholders(String template, Map<String, Object> entityData) {
        if (template == null) return null;
        
        Pattern pattern = Pattern.compile("\\{\\{(\\w+)\\}\\}");
        Matcher matcher = pattern.matcher(template);
        
        StringBuffer result = new StringBuffer();
        while (matcher.find()) {
            String fieldName = matcher.group(1);
            Object value = entityData.get(fieldName);
            String replacement = value != null ? value.toString() : "";
            matcher.appendReplacement(result, replacement);
        }
        matcher.appendTail(result);
        
        return result.toString();
    }

    private Integer parseUserId(String userStr) {
        if (userStr == null || userStr.isEmpty()) return null;
        
        try {
            return Integer.parseInt(userStr);
        } catch (NumberFormatException e) {
            // Could be email - look up user by email
            return null; // Simplified for demo
        }
    }

    private LocalDateTime parseDueDate(String dueDateStr) {
        LocalDateTime now = LocalDateTime.now();
        
        if (dueDateStr.endsWith("days")) {
            int days = Integer.parseInt(dueDateStr.replace("days", ""));
            return now.plusDays(days);
        } else if (dueDateStr.endsWith("hours")) {
            int hours = Integer.parseInt(dueDateStr.replace("hours", ""));
            return now.plusHours(hours);
        }
        
        return now.plusDays(1); // Default to 1 day
    }
}

