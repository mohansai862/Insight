package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "overdue_notifications", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"task_id", "manager_id"}))
public class OverdueNotification {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    
    @Column(name = "task_id", nullable = false)
    private Integer taskId;
    
    @Column(name = "manager_id", nullable = false)
    private Integer managerId;
    
    @Column(name = "notification_sent_at", nullable = false)
    private LocalDateTime notificationSentAt = LocalDateTime.now();
    
    // Constructors
    public OverdueNotification() {}
    
    public OverdueNotification(Integer taskId, Integer managerId) {
        this.taskId = taskId;
        this.managerId = managerId;
    }
    
    // Getters and Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    
    public Integer getTaskId() { return taskId; }
    public void setTaskId(Integer taskId) { this.taskId = taskId; }
    
    public Integer getManagerId() { return managerId; }
    public void setManagerId(Integer managerId) { this.managerId = managerId; }
    
    public LocalDateTime getNotificationSentAt() { return notificationSentAt; }
    public void setNotificationSentAt(LocalDateTime notificationSentAt) { this.notificationSentAt = notificationSentAt; }
}

