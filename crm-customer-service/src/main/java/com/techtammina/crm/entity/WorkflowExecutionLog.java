package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "workflow_execution_log")
public class WorkflowExecutionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Integer logId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private WorkflowRule workflowRule;

    @Column(name = "entity_id", nullable = false)
    private Integer entityId;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "executed_date")
    private LocalDateTime executedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ExecutionStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "executed_by")
    private String executedBy = "System";

    @PrePersist
    public void prePersist() {
        executedDate = LocalDateTime.now();
    }

    public enum ExecutionStatus {
        Success, Failed, Pending
    }

    // Getters and Setters
    public Integer getLogId() { return logId; }
    public void setLogId(Integer logId) { this.logId = logId; }
    public WorkflowRule getWorkflowRule() { return workflowRule; }
    public void setWorkflowRule(WorkflowRule workflowRule) { this.workflowRule = workflowRule; }
    public Integer getEntityId() { return entityId; }
    public void setEntityId(Integer entityId) { this.entityId = entityId; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public LocalDateTime getExecutedDate() { return executedDate; }
    public void setExecutedDate(LocalDateTime executedDate) { this.executedDate = executedDate; }
    public ExecutionStatus getStatus() { return status; }
    public void setStatus(ExecutionStatus status) { this.status = status; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public String getExecutedBy() { return executedBy; }
    public void setExecutedBy(String executedBy) { this.executedBy = executedBy; }
}

