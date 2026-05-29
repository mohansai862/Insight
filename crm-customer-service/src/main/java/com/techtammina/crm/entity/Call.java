package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "calls")
public class Call {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "call_id")
    private Integer callId;
    
    @Column(name = "sales_executive_id")
    private Integer salesExecutiveId;
    
    @Column(name = "contact_phone", length = 20)
    private String contactPhone;
    
    @Column(name = "contact_name", length = 100)
    private String contactName;
    
    @Column(name = "lead_id")
    private Integer leadId;
    
    @Column(name = "deal_id")
    private Integer dealId;
    
    @Column(name = "call_duration_seconds")
    private Integer callDurationSeconds;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "call_status")
    private CallStatus callStatus;
    
    @Column(name = "call_notes", columnDefinition = "TEXT")
    private String callNotes;
    
    @Column(name = "call_start_time")
    private LocalDateTime callStartTime;
    
    @Column(name = "call_end_time")
    private LocalDateTime callEndTime;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public enum CallStatus {
        COMPLETED, MISSED, BUSY, NO_ANSWER, FAILED
    }
    
    // Constructors
    public Call() {
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Integer getCallId() { return callId; }
    public void setCallId(Integer callId) { this.callId = callId; }
    
    public Integer getSalesExecutiveId() { return salesExecutiveId; }
    public void setSalesExecutiveId(Integer salesExecutiveId) { this.salesExecutiveId = salesExecutiveId; }
    
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    
    public Integer getLeadId() { return leadId; }
    public void setLeadId(Integer leadId) { this.leadId = leadId; }
    
    public Integer getDealId() { return dealId; }
    public void setDealId(Integer dealId) { this.dealId = dealId; }
    
    public Integer getCallDurationSeconds() { return callDurationSeconds; }
    public void setCallDurationSeconds(Integer callDurationSeconds) { this.callDurationSeconds = callDurationSeconds; }
    
    public CallStatus getCallStatus() { return callStatus; }
    public void setCallStatus(CallStatus callStatus) { this.callStatus = callStatus; }
    
    public String getCallNotes() { return callNotes; }
    public void setCallNotes(String callNotes) { this.callNotes = callNotes; }
    
    public LocalDateTime getCallStartTime() { return callStartTime; }
    public void setCallStartTime(LocalDateTime callStartTime) { this.callStartTime = callStartTime; }
    
    public LocalDateTime getCallEndTime() { return callEndTime; }
    public void setCallEndTime(LocalDateTime callEndTime) { this.callEndTime = callEndTime; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

