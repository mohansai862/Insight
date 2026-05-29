package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "campaign_leads")
public class CampaignLead {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String email;
    
    @Column(columnDefinition = "TEXT")
    private String message;
    
    private String subject;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Source source;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    public enum Source {
        HOMEPAGE_CONTACT,
        CONTACT_PAGE
    }
    
    // Constructors
    public CampaignLead() {
        this.createdAt = LocalDateTime.now();
    }
    
    public CampaignLead(String name, String email, String message, String subject, Source source) {
        this();
        this.name = name;
        this.email = email;
        this.message = message;
        this.subject = subject;
        this.source = source;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    
    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }
    
    public Source getSource() { return source; }
    public void setSource(Source source) { this.source = source; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

