package com.techtammina.crm.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "queue_members")
public class QueueMember {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "queue_member_id")
    private Integer queueMemberId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "queue_id", nullable = false)
    private ServiceQueue queue;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private Users user;

    // Getters and Setters
    public Integer getQueueMemberId() { return queueMemberId; }
    public void setQueueMemberId(Integer queueMemberId) { this.queueMemberId = queueMemberId; }
    public ServiceQueue getQueue() { return queue; }
    public void setQueue(ServiceQueue queue) { this.queue = queue; }
    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }
}

