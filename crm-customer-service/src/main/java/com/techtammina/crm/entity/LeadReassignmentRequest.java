package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lead_reassignment_requests")
public class LeadReassignmentRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @ManyToOne
    @JoinColumn(name = "lead_id", nullable = false)
    private Lead lead;
    
    @ManyToOne
    @JoinColumn(name = "requested_by", nullable = false)
    private Users requestedBy;
    
    @ManyToOne
    @JoinColumn(name = "requested_to")
    private Users requestedTo;
    
    private String reason;
    
    @Enumerated(EnumType.STRING)
    private Status status = Status.PENDING;
    
    @Column(name = "requested_date")
    private LocalDateTime requestedDate = LocalDateTime.now();
    
    @Column(name = "approved_date")
    private LocalDateTime approvedDate;
    
    public enum Status {
        PENDING, APPROVED, REJECTED
    }
    
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    
    public Lead getLead() { return lead; }
    public void setLead(Lead lead) { this.lead = lead; }
    
    public Users getRequestedBy() { return requestedBy; }
    public void setRequestedBy(Users requestedBy) { this.requestedBy = requestedBy; }
    
    public Users getRequestedTo() { return requestedTo; }
    public void setRequestedTo(Users requestedTo) { this.requestedTo = requestedTo; }
    
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    
    public LocalDateTime getRequestedDate() { return requestedDate; }
    public void setRequestedDate(LocalDateTime requestedDate) { this.requestedDate = requestedDate; }
    
    public LocalDateTime getApprovedDate() { return approvedDate; }
    public void setApprovedDate(LocalDateTime approvedDate) { this.approvedDate = approvedDate; }
}

