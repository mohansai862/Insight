package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deal_documents")
public class DealDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id")
    private Integer documentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id", referencedColumnName = "deal_id", nullable = false)
    private Deal deal;

    @Column(name = "document_name", length = 255, nullable = false)
    private String documentName;

    @Lob
    @Column(name = "document_data", columnDefinition = "LONGBLOB", nullable = false)
    private byte[] documentData;

    @Column(name = "document_size")
    private Long documentSize;

    @Column(name = "uploaded_by")
    private Integer uploadedBy; // user_id of uploader (header X-User-Id)

    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @PrePersist
    public void prePersist() {
        uploadedAt = LocalDateTime.now();
    }

    // Getters and setters
    public Integer getDocumentId() { return documentId; }
    public void setDocumentId(Integer documentId) { this.documentId = documentId; }

    public Deal getDeal() { return deal; }
    public void setDeal(Deal deal) { this.deal = deal; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public byte[] getDocumentData() { return documentData; }
    public void setDocumentData(byte[] documentData) { this.documentData = documentData; }

    public Long getDocumentSize() { return documentSize; }
    public void setDocumentSize(Long documentSize) { this.documentSize = documentSize; }

    public Integer getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(Integer uploadedBy) { this.uploadedBy = uploadedBy; }

    public LocalDateTime getUploadedAt() { return uploadedAt; }
    public void setUploadedAt(LocalDateTime uploadedAt) { this.uploadedAt = uploadedAt; }
}

