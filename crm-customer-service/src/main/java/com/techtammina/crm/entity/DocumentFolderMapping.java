package com.techtammina.crm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "document_folder_mapping")
public class DocumentFolderMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mapping_id")
    private Integer mappingId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "folder_id", nullable = false)
    private FolderStructure folder;

    // Getters and Setters
    public Integer getMappingId() { return mappingId; }
    public void setMappingId(Integer mappingId) { this.mappingId = mappingId; }
    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }
    public FolderStructure getFolder() { return folder; }
    public void setFolder(FolderStructure folder) { this.folder = folder; }
}

