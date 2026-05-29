package com.techtammina.crm.dto;

import java.time.LocalDateTime;
import java.util.List;

public class DocumentDTO {
    private Integer documentId;
    private String documentName;
    private String description;
    private Long fileSize;
    private String fileType;
    private String fileExtension;
    private String storageLocation;
    private Integer uploadedById;
    private String uploadedByName;
    private LocalDateTime uploadedDate;
    private Integer modifiedById;
    private String modifiedByName;
    private LocalDateTime modifiedDate;
    private Integer version;
    private Boolean isLatestVersion;
    private Integer parentDocumentId;
    private String category;
    private String tags;
    private String accessLevel;
    private Boolean isActive;
    private List<DocumentRelationshipDTO> relationships;

    // Getters and Setters
    public Integer getDocumentId() { return documentId; }
    public void setDocumentId(Integer documentId) { this.documentId = documentId; }
    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Long getFileSize() { return fileSize; }
    public void setFileSize(Long fileSize) { this.fileSize = fileSize; }
    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }
    public String getFileExtension() { return fileExtension; }
    public void setFileExtension(String fileExtension) { this.fileExtension = fileExtension; }
    public String getStorageLocation() { return storageLocation; }
    public void setStorageLocation(String storageLocation) { this.storageLocation = storageLocation; }
    public Integer getUploadedById() { return uploadedById; }
    public void setUploadedById(Integer uploadedById) { this.uploadedById = uploadedById; }
    public String getUploadedByName() { return uploadedByName; }
    public void setUploadedByName(String uploadedByName) { this.uploadedByName = uploadedByName; }
    public LocalDateTime getUploadedDate() { return uploadedDate; }
    public void setUploadedDate(LocalDateTime uploadedDate) { this.uploadedDate = uploadedDate; }
    public Integer getModifiedById() { return modifiedById; }
    public void setModifiedById(Integer modifiedById) { this.modifiedById = modifiedById; }
    public String getModifiedByName() { return modifiedByName; }
    public void setModifiedByName(String modifiedByName) { this.modifiedByName = modifiedByName; }
    public LocalDateTime getModifiedDate() { return modifiedDate; }
    public void setModifiedDate(LocalDateTime modifiedDate) { this.modifiedDate = modifiedDate; }
    public Integer getVersion() { return version; }
    public void setVersion(Integer version) { this.version = version; }
    public Boolean getIsLatestVersion() { return isLatestVersion; }
    public void setIsLatestVersion(Boolean isLatestVersion) { this.isLatestVersion = isLatestVersion; }
    public Integer getParentDocumentId() { return parentDocumentId; }
    public void setParentDocumentId(Integer parentDocumentId) { this.parentDocumentId = parentDocumentId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }
    public String getAccessLevel() { return accessLevel; }
    public void setAccessLevel(String accessLevel) { this.accessLevel = accessLevel; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public List<DocumentRelationshipDTO> getRelationships() { return relationships; }
    public void setRelationships(List<DocumentRelationshipDTO> relationships) { this.relationships = relationships; }
}

