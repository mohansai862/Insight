package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "calls")
public class CallLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "call_id")
    private Integer callId;

    @ManyToOne
    @JoinColumn(name = "sales_executive_id", referencedColumnName = "user_id")
    private Users salesExecutive;

    @Column(name = "contact_phone", nullable = false)
    private String contactPhone;

    @Column(name = "contact_name")
    private String contactName;

    @Column(name = "lead_id")
    private Integer leadId;

    @Column(name = "deal_id")
    private Integer dealId;

    @Column(name = "call_duration_seconds")
    private Integer callDurationSeconds;

    @Enumerated(EnumType.STRING)
    @Column(name = "call_status", nullable = false)
    private CallStatus callStatus;

    @Column(name = "call_notes", columnDefinition = "TEXT")
    private String callNotes;

    @Column(name = "call_start_time", nullable = false)
    private LocalDateTime callStartTime;

    @Column(name = "call_end_time")
    private LocalDateTime callEndTime;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    // Asterisk-specific fields (transient for now)
    @Transient
    private String asteriskCallId;

    @Transient
    private String agentExtension;

    public enum CallStatus {
        COMPLETED, MISSED, BUSY, NO_ANSWER, FAILED
    }

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        if (callStatus == null) {
            callStatus = CallStatus.NO_ANSWER;
        }
    }

    // Getters and Setters
    public Integer getCallId() { return callId; }
    public void setCallId(Integer callId) { this.callId = callId; }

    public Users getSalesExecutive() { return salesExecutive; }
    public void setSalesExecutive(Users salesExecutive) { this.salesExecutive = salesExecutive; }

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

    public String getAsteriskCallId() { return asteriskCallId; }
    public void setAsteriskCallId(String asteriskCallId) { this.asteriskCallId = asteriskCallId; }

    public String getAgentExtension() { return agentExtension; }
    public void setAgentExtension(String agentExtension) { this.agentExtension = agentExtension; }
}

