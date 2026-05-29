package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "folder_structure")
public class FolderStructure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "folder_id")
    private Integer folderId;

    @Column(name = "folder_name", nullable = false)
    private String folderName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_folder_id")
    private FolderStructure parentFolder;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private Users createdBy;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "access_level")
    private Document.AccessLevel accessLevel = Document.AccessLevel.Private;

    @OneToMany(mappedBy = "parentFolder", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FolderStructure> subFolders;

    @PrePersist
    public void prePersist() {
        createdDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getFolderId() { return folderId; }
    public void setFolderId(Integer folderId) { this.folderId = folderId; }
    public String getFolderName() { return folderName; }
    public void setFolderName(String folderName) { this.folderName = folderName; }
    public FolderStructure getParentFolder() { return parentFolder; }
    public void setParentFolder(FolderStructure parentFolder) { this.parentFolder = parentFolder; }
    public Users getCreatedBy() { return createdBy; }
    public void setCreatedBy(Users createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public Document.AccessLevel getAccessLevel() { return accessLevel; }
    public void setAccessLevel(Document.AccessLevel accessLevel) { this.accessLevel = accessLevel; }
    public List<FolderStructure> getSubFolders() { return subFolders; }
    public void setSubFolders(List<FolderStructure> subFolders) { this.subFolders = subFolders; }
}

