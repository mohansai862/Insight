package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notes")
public class Note {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "note_id")
    private Integer noteId;

    @Enumerated(EnumType.STRING)
    @Column(name = "related_entity_type", nullable = false)
    private EntityType relatedEntityType;

    @Column(name = "related_entity_id", nullable = false)
    private Integer relatedEntityId;

    @Column(name = "note_title")
    private String noteTitle;

    @Column(name = "note_content", columnDefinition = "TEXT", nullable = false)
    private String noteContent;

    @Column(name = "created_by", nullable = false)
    private Integer createdBy;

    @Column(name = "created_date")
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "modified_by")
    private Integer modifiedBy;

    @Column(name = "modified_date")
    private LocalDateTime modifiedDate;

    @Column(name = "is_pinned")
    private Boolean isPinned = false;

    @Column(name = "is_private")
    private Boolean isPrivate = false;

    @Column(name = "mentions", columnDefinition = "JSON")
    private String mentions;

    public enum EntityType {
        Account, Contact, Lead, Deal, Case, Task, Quote
    }

    // Getters and Setters
    public Integer getNoteId() { return noteId; }
    public void setNoteId(Integer noteId) { this.noteId = noteId; }

    public EntityType getRelatedEntityType() { return relatedEntityType; }
    public void setRelatedEntityType(EntityType relatedEntityType) { this.relatedEntityType = relatedEntityType; }

    public Integer getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(Integer relatedEntityId) { this.relatedEntityId = relatedEntityId; }

    public String getNoteTitle() { return noteTitle; }
    public void setNoteTitle(String noteTitle) { this.noteTitle = noteTitle; }

    public String getNoteContent() { return noteContent; }
    public void setNoteContent(String noteContent) { this.noteContent = noteContent; }

    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }

    public Integer getModifiedBy() { return modifiedBy; }
    public void setModifiedBy(Integer modifiedBy) { this.modifiedBy = modifiedBy; }

    public LocalDateTime getModifiedDate() { return modifiedDate; }
    public void setModifiedDate(LocalDateTime modifiedDate) { this.modifiedDate = modifiedDate; }

    public Boolean getIsPinned() { return isPinned; }
    public void setIsPinned(Boolean isPinned) { this.isPinned = isPinned; }

    public Boolean getIsPrivate() { return isPrivate; }
    public void setIsPrivate(Boolean isPrivate) { this.isPrivate = isPrivate; }

    public String getMentions() { return mentions; }
    public void setMentions(String mentions) { this.mentions = mentions; }
}

