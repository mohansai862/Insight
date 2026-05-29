package com.techtammina.crm.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import java.time.LocalDate;
import java.time.LocalDateTime;


@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "task_id")
    private Integer taskId;

    @Column(name = "title", length = 200, nullable = false)
    @Pattern(regexp = "^(?!^\\d+$)(?!^[^a-zA-Z0-9\\s]+$).*", message = "Task title cannot contain only numbers or only special characters")
    private String title;

    @Column(name = "description", length = 1000)
    @jakarta.validation.constraints.Size(max = 400, message = "Description cannot exceed 400 characters")
    private String description;



    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 50)
    private Status status;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority", length = 50)
    private Priority priority;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(name = "due_time")
    private java.time.LocalTime dueTime;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", referencedColumnName = "user_id", nullable = true)
    private Users createdBy;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to", referencedColumnName = "user_id", nullable = true)
    private Users owner;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    @Lob
    @Column(name = "documents")
    private byte[] documents;

    @Column(name = "document_name", length = 255)
    private String documentName;

    @Column(name = "document_sizes", length = 1000)
    private String documentSizes;

    @Column(name = "document_uploaded_at")
    private LocalDateTime documentUploadedAt;



    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        // Do not set updatedAt during creation - it should remain NULL
        if (status == null) status = Status.Pending;
        if (priority == null) priority = Priority.Medium;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }



    public enum Status {
        Pending, In_Progress, Completed, Cancelled
    }

    public enum Priority {
        High, Medium, Low, Backlog
    }



    // Getters and Setters
    public Integer getTaskId() { return taskId; }
    public void setTaskId(Integer taskId) { this.taskId = taskId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }





    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public java.time.LocalTime getDueTime() { return dueTime; }
    public void setDueTime(java.time.LocalTime dueTime) { this.dueTime = dueTime; }

    public Users getCreatedBy() { return createdBy; }
    public void setCreatedBy(Users createdBy) { this.createdBy = createdBy; }

    public Users getOwner() { return owner; }
    public void setOwner(Users owner) { this.owner = owner; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public byte[] getDocuments() { return documents; }
    public void setDocuments(byte[] documents) { this.documents = documents; }

    public String getDocumentName() { return documentName; }
    public void setDocumentName(String documentName) { this.documentName = documentName; }

    public String getDocumentSizes() { return documentSizes; }
    public void setDocumentSizes(String documentSizes) { this.documentSizes = documentSizes; }

    public LocalDateTime getDocumentUploadedAt() { return documentUploadedAt; }
    public void setDocumentUploadedAt(LocalDateTime documentUploadedAt) { this.documentUploadedAt = documentUploadedAt; }



}

