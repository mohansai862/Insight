package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "case_sla")
public class CaseSLA {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "case_sla_id")
    private Integer caseSlaId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "case_id", nullable = false)
    private Case caseEntity;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "sla_id", nullable = false)
    private SLA sla;

    @Column(name = "first_response_due")
    private LocalDateTime firstResponseDue;

    @Column(name = "resolution_due")
    private LocalDateTime resolutionDue;

    @Column(name = "first_response_met")
    private Boolean firstResponseMet = false;

    @Column(name = "resolution_met")
    private Boolean resolutionMet = false;

    @Column(name = "breach_reason", columnDefinition = "TEXT")
    private String breachReason;

    // Getters and Setters
    public Integer getCaseSlaId() { return caseSlaId; }
    public void setCaseSlaId(Integer caseSlaId) { this.caseSlaId = caseSlaId; }
    public Case getCaseEntity() { return caseEntity; }
    public void setCaseEntity(Case caseEntity) { this.caseEntity = caseEntity; }
    public SLA getSla() { return sla; }
    public void setSla(SLA sla) { this.sla = sla; }
    public LocalDateTime getFirstResponseDue() { return firstResponseDue; }
    public void setFirstResponseDue(LocalDateTime firstResponseDue) { this.firstResponseDue = firstResponseDue; }
    public LocalDateTime getResolutionDue() { return resolutionDue; }
    public void setResolutionDue(LocalDateTime resolutionDue) { this.resolutionDue = resolutionDue; }
    public Boolean getFirstResponseMet() { return firstResponseMet; }
    public void setFirstResponseMet(Boolean firstResponseMet) { this.firstResponseMet = firstResponseMet; }
    public Boolean getResolutionMet() { return resolutionMet; }
    public void setResolutionMet(Boolean resolutionMet) { this.resolutionMet = resolutionMet; }
    public String getBreachReason() { return breachReason; }
    public void setBreachReason(String breachReason) { this.breachReason = breachReason; }
}

