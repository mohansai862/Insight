package com.techtammina.crm.dto;

import java.time.LocalDateTime;

public class DocumentRelationshipDTO {
    private Integer relationshipId;
    private Integer documentId;
    private String relatedEntityType;
    private Integer relatedEntityId;
    private LocalDateTime createdDate;

    // Getters and Setters
    public Integer getRelationshipId() { return relationshipId; }
    public void setRelationshipId(Integer relationshipId) { this.relationshipId = relationshipId; }
    public Integer getDocumentId() { return documentId; }
    public void setDocumentId(Integer documentId) { this.documentId = documentId; }
    public String getRelatedEntityType() { return relatedEntityType; }
    public void setRelatedEntityType(String relatedEntityType) { this.relatedEntityType = relatedEntityType; }
    public Integer getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(Integer relatedEntityId) { this.relatedEntityId = relatedEntityId; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}

