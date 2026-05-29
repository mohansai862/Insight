package com.techtammina.crm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "workflow_actions")
public class WorkflowAction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "action_id")
    private Integer actionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rule_id", nullable = false)
    private WorkflowRule workflowRule;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false)
    private ActionType actionType;

    @Column(name = "action_sequence", nullable = false)
    private Integer actionSequence;

    @Column(name = "action_config", columnDefinition = "JSON", nullable = false)
    private String actionConfig;

    @Column(name = "delay_minutes")
    private Integer delayMinutes = 0;

    public enum ActionType {
        SendEmail, CreateTask, UpdateField, SendNotification, CallWebhook, AssignRecord, CreateRecord
    }

    // Getters and Setters
    public Integer getActionId() { return actionId; }
    public void setActionId(Integer actionId) { this.actionId = actionId; }
    public WorkflowRule getWorkflowRule() { return workflowRule; }
    public void setWorkflowRule(WorkflowRule workflowRule) { this.workflowRule = workflowRule; }
    public ActionType getActionType() { return actionType; }
    public void setActionType(ActionType actionType) { this.actionType = actionType; }
    public Integer getActionSequence() { return actionSequence; }
    public void setActionSequence(Integer actionSequence) { this.actionSequence = actionSequence; }
    public String getActionConfig() { return actionConfig; }
    public void setActionConfig(String actionConfig) { this.actionConfig = actionConfig; }
    public Integer getDelayMinutes() { return delayMinutes; }
    public void setDelayMinutes(Integer delayMinutes) { this.delayMinutes = delayMinutes; }
}

