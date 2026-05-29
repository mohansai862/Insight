package com.techtammina.crm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "sla")
public class SLA {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "sla_id")
    private Integer slaId;

    @Column(name = "sla_name", nullable = false)
    private String slaName;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", nullable = false)
    private Case.Priority priority;

    @Column(name = "first_response_time")
    private Integer firstResponseTime; // in minutes

    @Column(name = "resolution_time")
    private Integer resolutionTime; // in minutes

    @Column(name = "is_active")
    private Boolean isActive = true;

    // Getters and Setters
    public Integer getSlaId() { return slaId; }
    public void setSlaId(Integer slaId) { this.slaId = slaId; }
    public String getSlaName() { return slaName; }
    public void setSlaName(String slaName) { this.slaName = slaName; }
    public Case.Priority getPriority() { return priority; }
    public void setPriority(Case.Priority priority) { this.priority = priority; }
    public Integer getFirstResponseTime() { return firstResponseTime; }
    public void setFirstResponseTime(Integer firstResponseTime) { this.firstResponseTime = firstResponseTime; }
    public Integer getResolutionTime() { return resolutionTime; }
    public void setResolutionTime(Integer resolutionTime) { this.resolutionTime = resolutionTime; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}

