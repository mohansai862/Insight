package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "service_queue")
public class ServiceQueue {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "queue_id")
    private Integer queueId;

    @Column(name = "queue_name", nullable = false)
    private String queueName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "queue_type")
    private String queueType;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @OneToMany(mappedBy = "queue", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<QueueMember> members;

    // Getters and Setters
    public Integer getQueueId() { return queueId; }
    public void setQueueId(Integer queueId) { this.queueId = queueId; }
    public String getQueueName() { return queueName; }
    public void setQueueName(String queueName) { this.queueName = queueName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getQueueType() { return queueType; }
    public void setQueueType(String queueType) { this.queueType = queueType; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public List<QueueMember> getMembers() { return members; }
    public void setMembers(List<QueueMember> members) { this.members = members; }
}

