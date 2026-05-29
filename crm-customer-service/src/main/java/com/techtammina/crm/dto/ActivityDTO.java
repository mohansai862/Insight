package com.techtammina.crm.dto;

import com.techtammina.crm.entity.Activity;
import java.time.LocalDateTime;

public class ActivityDTO {
    private Integer activityId;
    private Integer leadId;
    private String activityType;
    private String subject;
    private String description;
    private LocalDateTime activityDate;
    private Integer createdBy;
    private LocalDateTime createdAt;

    // Constructors
    public ActivityDTO() {}

    public ActivityDTO(Activity activity) {
        this.activityId = activity.getActivityId();
        this.leadId = activity.getLead() != null ? activity.getLead().getLeadId() : null;
        this.activityType = activity.getActivityType() != null ? activity.getActivityType().name() : null;
        this.subject = activity.getSubject();
        this.description = activity.getDescription();
        this.activityDate = activity.getActivityDate();
        this.createdBy = activity.getCreatedBy() != null ? activity.getCreatedBy().getUserId() : null;
        this.createdAt = activity.getCreatedAt();
    }

    // Getters and Setters
    public Integer getActivityId() { return activityId; }
    public void setActivityId(Integer activityId) { this.activityId = activityId; }

    public Integer getLeadId() { return leadId; }
    public void setLeadId(Integer leadId) { this.leadId = leadId; }

    public String getActivityType() { return activityType; }
    public void setActivityType(String activityType) { this.activityType = activityType; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getActivityDate() { return activityDate; }
    public void setActivityDate(LocalDateTime activityDate) { this.activityDate = activityDate; }

    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @Override
    public String toString() {
        return "ActivityDTO{" +
                "activityId=" + activityId +
                ", leadId=" + leadId +
                ", activityType='" + activityType + '\'' +
                ", subject='" + subject + '\'' +
                ", description='" + description + '\'' +
                ", activityDate=" + activityDate +
                ", createdBy=" + createdBy +
                ", createdAt=" + createdAt +
                '}';
    }
}

