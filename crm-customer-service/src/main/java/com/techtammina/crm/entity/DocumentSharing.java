package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_sharing")
public class DocumentSharing {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "share_id")
    private Integer shareId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shared_with", nullable = false)
    private Users sharedWith;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "shared_by", nullable = false)
    private Users sharedBy;

    @Column(name = "shared_date")
    private LocalDateTime sharedDate;

    @Column(name = "expiration_date")
    private LocalDateTime expirationDate;

    @Column(name = "can_edit")
    private Boolean canEdit = false;

    @Column(name = "can_download")
    private Boolean canDownload = true;

    @Column(name = "access_count")
    private Integer accessCount = 0;

    @PrePersist
    public void prePersist() {
        sharedDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getShareId() { return shareId; }
    public void setShareId(Integer shareId) { this.shareId = shareId; }
    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }
    public Users getSharedWith() { return sharedWith; }
    public void setSharedWith(Users sharedWith) { this.sharedWith = sharedWith; }
    public Users getSharedBy() { return sharedBy; }
    public void setSharedBy(Users sharedBy) { this.sharedBy = sharedBy; }
    public LocalDateTime getSharedDate() { return sharedDate; }
    public void setSharedDate(LocalDateTime sharedDate) { this.sharedDate = sharedDate; }
    public LocalDateTime getExpirationDate() { return expirationDate; }
    public void setExpirationDate(LocalDateTime expirationDate) { this.expirationDate = expirationDate; }
    public Boolean getCanEdit() { return canEdit; }
    public void setCanEdit(Boolean canEdit) { this.canEdit = canEdit; }
    public Boolean getCanDownload() { return canDownload; }
    public void setCanDownload(Boolean canDownload) { this.canDownload = canDownload; }
    public Integer getAccessCount() { return accessCount; }
    public void setAccessCount(Integer accessCount) { this.accessCount = accessCount; }
}

