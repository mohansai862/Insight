package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emails")
public class Email {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "email_id")
    private Integer emailId;

    @Column(name = "subject", length = 500)
    private String subject;

    @Column(name = "body", columnDefinition = "TEXT")
    private String body;

    @Column(name = "from_address", nullable = false)
    private String fromAddress;

    @Column(name = "to_addresses", columnDefinition = "TEXT", nullable = false)
    private String toAddresses;

    @Column(name = "cc_addresses", columnDefinition = "TEXT")
    private String ccAddresses;

    @Column(name = "bcc_addresses", columnDefinition = "TEXT")
    private String bccAddresses;

    @Column(name = "sent_date")
    private LocalDateTime sentDate;

    @Column(name = "received_date")
    private LocalDateTime receivedDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "direction", nullable = false)
    private Direction direction;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private Status status = Status.Draft;

    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType;

    @Column(name = "related_entity_id")
    private Integer relatedEntityId;

    @Column(name = "created_by")
    private Integer createdBy;

    @Column(name = "has_attachments")
    private Boolean hasAttachments = false;

    @Column(name = "email_thread_id")
    private String emailThreadId;

    @Column(name = "open_count")
    private Integer openCount = 0;

    @Column(name = "click_count")
    private Integer clickCount = 0;

    @Column(name = "last_opened_date")
    private LocalDateTime lastOpenedDate;

    @Column(name = "created_date")
    private LocalDateTime createdDate = LocalDateTime.now();

    public enum Direction {
        Inbound, Outbound
    }

    public enum Status {
        Draft, Sent, Delivered, Opened, Bounced, Failed
    }

    // Getters and Setters
    public Integer getEmailId() { return emailId; }
    public void setEmailId(Integer emailId) { this.emailId = emailId; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getFromAddress() { return fromAddress; }
    public void setFromAddress(String fromAddress) { this.fromAddress = fromAddress; }

    public String getToAddresses() { return toAddresses; }
    public void setToAddresses(String toAddresses) { this.toAddresses = toAddresses; }

    public String getCcAddresses() { return ccAddresses; }
    public void setCcAddresses(String ccAddresses) { this.ccAddresses = ccAddresses; }

    public String getBccAddresses() { return bccAddresses; }
    public void setBccAddresses(String bccAddresses) { this.bccAddresses = bccAddresses; }

    public LocalDateTime getSentDate() { return sentDate; }
    public void setSentDate(LocalDateTime sentDate) { this.sentDate = sentDate; }

    public LocalDateTime getReceivedDate() { return receivedDate; }
    public void setReceivedDate(LocalDateTime receivedDate) { this.receivedDate = receivedDate; }

    public Direction getDirection() { return direction; }
    public void setDirection(Direction direction) { this.direction = direction; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getRelatedEntityType() { return relatedEntityType; }
    public void setRelatedEntityType(String relatedEntityType) { this.relatedEntityType = relatedEntityType; }

    public Integer getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(Integer relatedEntityId) { this.relatedEntityId = relatedEntityId; }

    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }

    public Boolean getHasAttachments() { return hasAttachments; }
    public void setHasAttachments(Boolean hasAttachments) { this.hasAttachments = hasAttachments; }

    public String getEmailThreadId() { return emailThreadId; }
    public void setEmailThreadId(String emailThreadId) { this.emailThreadId = emailThreadId; }

    public Integer getOpenCount() { return openCount; }
    public void setOpenCount(Integer openCount) { this.openCount = openCount; }

    public Integer getClickCount() { return clickCount; }
    public void setClickCount(Integer clickCount) { this.clickCount = clickCount; }

    public LocalDateTime getLastOpenedDate() { return lastOpenedDate; }
    public void setLastOpenedDate(LocalDateTime lastOpenedDate) { this.lastOpenedDate = lastOpenedDate; }

    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}

