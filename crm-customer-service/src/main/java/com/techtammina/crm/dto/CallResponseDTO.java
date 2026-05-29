package com.techtammina.crm.dto;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.entity.CallLog;
import java.time.LocalDateTime;

public class CallResponseDTO {

    private static final Logger log = LoggerFactory.getLogger(CallResponseDTO.class);
    
    private String callId;
    private String status;
    private String agentExtension;
    private String customerNumber;
    private LocalDateTime callStartTime;
    private LocalDateTime callEndTime;
    private Integer durationSeconds;
    private Integer contactId;
    private String contactName;
    private String failureReason;
    private LocalDateTime createdAt;

    // Constructors
    public CallResponseDTO() {}

    public CallResponseDTO(CallLog callLog) {
        this.callId = callLog.getAsteriskCallId();
        this.status = callLog.getCallStatus().name();
        this.agentExtension = callLog.getAgentExtension();
        this.customerNumber = callLog.getContactPhone();
        this.callStartTime = callLog.getCallStartTime();
        this.callEndTime = callLog.getCallEndTime();
        this.durationSeconds = callLog.getCallDurationSeconds();
        this.contactId = callLog.getLeadId();
        this.contactName = callLog.getContactName();
        this.failureReason = callLog.getCallNotes();
        this.createdAt = callLog.getCreatedAt();
    }

    // Getters and Setters
    public String getCallId() { return callId; }
    public void setCallId(String callId) { this.callId = callId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAgentExtension() { return agentExtension; }
    public void setAgentExtension(String agentExtension) { this.agentExtension = agentExtension; }

    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }

    public LocalDateTime getCallStartTime() { return callStartTime; }
    public void setCallStartTime(LocalDateTime callStartTime) { this.callStartTime = callStartTime; }

    public LocalDateTime getCallEndTime() { return callEndTime; }
    public void setCallEndTime(LocalDateTime callEndTime) { this.callEndTime = callEndTime; }

    public Integer getDurationSeconds() { return durationSeconds; }
    public void setDurationSeconds(Integer durationSeconds) { this.durationSeconds = durationSeconds; }

    public Integer getContactId() { return contactId; }
    public void setContactId(Integer contactId) { this.contactId = contactId; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}


