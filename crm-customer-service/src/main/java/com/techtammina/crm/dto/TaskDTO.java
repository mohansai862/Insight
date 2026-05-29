package com.techtammina.crm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class TaskDTO {
    private Integer taskId;
    @Pattern(regexp = "^(?!^\\d+$)(?!^[^a-zA-Z0-9\\s]+$).*", message = "Task title cannot contain only numbers or only special characters")
    private String title;
    @jakarta.validation.constraints.Size(max = 400, message = "Description cannot exceed 400 characters")
    private String description;
    private String type;      // call | email | meeting | todo | follow_up
    private String priority;  // low | medium | high | urgent
    private String status;    // pending | in_progress | completed | cancelled
    private LocalDate dueDate;
    private String dueTime;
    private Integer ownerId;
    private String ownerName;   // convenience for UI
    private String ownerEmail;  // convenience for UI (for avatar/gravatar if needed)
    private Integer createdBy;
    private String relatedType; // lead | contact | deal | company
    private Integer relatedId;
    private String remarks;
    private String createdByName;
    private String createdByEmail;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean hasDocumentation;
    @JsonProperty("documentName")
    private String documentName;
    private String documentSizes;
    private LocalDateTime documentUploadedAt;
    private int[] documents;
    private Integer attachmentCount;
    private java.util.List<String> attachmentNames;

    // Getters and Setters
    public Integer getTaskId() { return taskId; }
    public void setTaskId(Integer taskId) { this.taskId = taskId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getDueTime() { return dueTime; }
    public void setDueTime(String dueTime) { this.dueTime = dueTime; }

    public Integer getOwnerId() { return ownerId; }
    public void setOwnerId(Integer ownerId) { this.ownerId = ownerId; }

    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }

    public String getOwnerEmail() { return ownerEmail; }
    public void setOwnerEmail(String ownerEmail) { this.ownerEmail = ownerEmail; }

    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }

    public String getRelatedType() { return relatedType; }
    public void setRelatedType(String relatedType) { this.relatedType = relatedType; }

    public Integer getRelatedId() { return relatedId; }
    public void setRelatedId(Integer relatedId) { this.relatedId = relatedId; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public String getCreatedByEmail() { return createdByEmail; }
    public void setCreatedByEmail(String createdByEmail) { this.createdByEmail = createdByEmail; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isHasDocumentation() { return hasDocumentation; }
    public void setHasDocumentation(boolean hasDocumentation) { this.hasDocumentation = hasDocumentation; }

    public int[] getDocuments() { return documents; }
    public void setDocuments(int[] documents) { this.documents = documents; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public String getDocumentSizes() { return documentSizes; }
    public void setDocumentSizes(String documentSizes) { this.documentSizes = documentSizes; }

    public LocalDateTime getDocumentUploadedAt() { return documentUploadedAt; }
    public void setDocumentUploadedAt(LocalDateTime documentUploadedAt) { this.documentUploadedAt = documentUploadedAt; }

    public Integer getAttachmentCount() { return attachmentCount; }
    public void setAttachmentCount(Integer attachmentCount) { this.attachmentCount = attachmentCount; }

    public java.util.List<String> getAttachmentNames() { return attachmentNames; }
    public void setAttachmentNames(java.util.List<String> attachmentNames) { this.attachmentNames = attachmentNames; }

}

