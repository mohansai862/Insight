package com.techtammina.crm.dto;

import java.time.LocalDateTime;
import java.util.List;

public class CaseDTO {
    private Integer caseId;
    private String caseNumber;
    private Integer accountId;
    private String accountName;
    private Integer contactId;
    private String contactName;
    private String subject;
    private String description;
    private String priority;
    private String status;
    private String type;
    private String category;
    private Integer assignedToId;
    private String assignedToName;
    private Integer createdById;
    private String createdByName;
    private LocalDateTime createdDate;
    private LocalDateTime modifiedDate;
    private LocalDateTime resolvedDate;
    private LocalDateTime closedDate;
    private String resolutionDetails;
    private String resolutionType;
    private Integer relatedDealId;
    private String relatedDealName;
    private Integer escalationLevel;
    private List<CaseCommentDTO> comments;

    // Getters and Setters
    public Integer getCaseId() { return caseId; }
    public void setCaseId(Integer caseId) { this.caseId = caseId; }
    public String getCaseNumber() { return caseNumber; }
    public void setCaseNumber(String caseNumber) { this.caseNumber = caseNumber; }
    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }
    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }
    public Integer getContactId() { return contactId; }
    public void setContactId(Integer contactId) { this.contactId = contactId; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public Integer getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Integer assignedToId) { this.assignedToId = assignedToId; }
    public String getAssignedToName() { return assignedToName; }
    public void setAssignedToName(String assignedToName) { this.assignedToName = assignedToName; }
    public Integer getCreatedById() { return createdById; }
    public void setCreatedById(Integer createdById) { this.createdById = createdById; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public LocalDateTime getModifiedDate() { return modifiedDate; }
    public void setModifiedDate(LocalDateTime modifiedDate) { this.modifiedDate = modifiedDate; }
    public LocalDateTime getResolvedDate() { return resolvedDate; }
    public void setResolvedDate(LocalDateTime resolvedDate) { this.resolvedDate = resolvedDate; }
    public LocalDateTime getClosedDate() { return closedDate; }
    public void setClosedDate(LocalDateTime closedDate) { this.closedDate = closedDate; }
    public String getResolutionDetails() { return resolutionDetails; }
    public void setResolutionDetails(String resolutionDetails) { this.resolutionDetails = resolutionDetails; }
    public String getResolutionType() { return resolutionType; }
    public void setResolutionType(String resolutionType) { this.resolutionType = resolutionType; }
    public Integer getRelatedDealId() { return relatedDealId; }
    public void setRelatedDealId(Integer relatedDealId) { this.relatedDealId = relatedDealId; }
    public String getRelatedDealName() { return relatedDealName; }
    public void setRelatedDealName(String relatedDealName) { this.relatedDealName = relatedDealName; }
    public Integer getEscalationLevel() { return escalationLevel; }
    public void setEscalationLevel(Integer escalationLevel) { this.escalationLevel = escalationLevel; }
    public List<CaseCommentDTO> getComments() { return comments; }
    public void setComments(List<CaseCommentDTO> comments) { this.comments = comments; }
}

