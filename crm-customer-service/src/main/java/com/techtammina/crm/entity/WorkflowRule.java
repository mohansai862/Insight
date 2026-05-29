package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "workflow_rules")
public class WorkflowRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "rule_id")
    private Integer ruleId;

    @Column(name = "rule_name", nullable = false)
    private String ruleName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    private EntityType entityType;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_type", nullable = false)
    private TriggerType triggerType;

    @Column(name = "trigger_conditions", columnDefinition = "JSON")
    private String triggerConditions;

    @Column(name = "execution_order")
    private Integer executionOrder = 1;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private Users createdBy;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "last_executed")
    private LocalDateTime lastExecuted;

    @Column(name = "execution_count")
    private Integer executionCount = 0;

    @OneToMany(mappedBy = "workflowRule", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<WorkflowAction> actions;

    @PrePersist
    public void prePersist() {
        createdDate = LocalDateTime.now();
    }

    public enum EntityType {
        Lead, Contact, Account, Deal, Case, Task, Activity, Quote
    }

    public enum TriggerType {
        OnCreate, OnUpdate, OnDelete, OnFieldChange, Scheduled, Manual
    }

    // Getters and Setters
    public Integer getRuleId() { return ruleId; }
    public void setRuleId(Integer ruleId) { this.ruleId = ruleId; }
    public String getRuleName() { return ruleName; }
    public void setRuleName(String ruleName) { this.ruleName = ruleName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public EntityType getEntityType() { return entityType; }
    public void setEntityType(EntityType entityType) { this.entityType = entityType; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public TriggerType getTriggerType() { return triggerType; }
    public void setTriggerType(TriggerType triggerType) { this.triggerType = triggerType; }
    public String getTriggerConditions() { return triggerConditions; }
    public void setTriggerConditions(String triggerConditions) { this.triggerConditions = triggerConditions; }
    public Integer getExecutionOrder() { return executionOrder; }
    public void setExecutionOrder(Integer executionOrder) { this.executionOrder = executionOrder; }
    public Users getCreatedBy() { return createdBy; }
    public void setCreatedBy(Users createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public LocalDateTime getLastExecuted() { return lastExecuted; }
    public void setLastExecuted(LocalDateTime lastExecuted) { this.lastExecuted = lastExecuted; }
    public Integer getExecutionCount() { return executionCount; }
    public void setExecutionCount(Integer executionCount) { this.executionCount = executionCount; }
    public List<WorkflowAction> getActions() { return actions; }
    public void setActions(List<WorkflowAction> actions) { this.actions = actions; }
}

