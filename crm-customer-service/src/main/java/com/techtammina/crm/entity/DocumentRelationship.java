package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_relationships")
public class DocumentRelationship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "relationship_id")
    private Integer relationshipId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Enumerated(EnumType.STRING)
    @Column(name = "related_entity_type", nullable = false)
    private EntityType relatedEntityType;

    @Column(name = "related_entity_id", nullable = false)
    private Integer relatedEntityId;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @PrePersist
    public void prePersist() {
        createdDate = LocalDateTime.now();
    }

    public enum EntityType {
        Account, Contact, Lead, Deal, Quote, Case, Task, Activity
    }

    // Getters and Setters
    public Integer getRelationshipId() { return relationshipId; }
    public void setRelationshipId(Integer relationshipId) { this.relationshipId = relationshipId; }
    public Document getDocument() { return document; }
    public void setDocument(Document document) { this.document = document; }
    public EntityType getRelatedEntityType() { return relatedEntityType; }
    public void setRelatedEntityType(EntityType relatedEntityType) { this.relatedEntityType = relatedEntityType; }
    public Integer getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(Integer relatedEntityId) { this.relatedEntityId = relatedEntityId; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}

