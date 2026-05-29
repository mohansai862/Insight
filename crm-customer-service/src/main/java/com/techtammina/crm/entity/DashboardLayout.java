package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "dashboard_layouts")
public class DashboardLayout {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "layout_id")
    private Integer layoutId;

    @Column(name = "layout_name", nullable = false)
    private String layoutName;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private Users user;

    @Column(name = "role")
    private String role;

    @Column(name = "widgets", columnDefinition = "JSON", nullable = false)
    private String widgets;

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @PrePersist
    public void prePersist() {
        createdDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Integer getLayoutId() { return layoutId; }
    public void setLayoutId(Integer layoutId) { this.layoutId = layoutId; }
    public String getLayoutName() { return layoutName; }
    public void setLayoutName(String layoutName) { this.layoutName = layoutName; }
    public Users getUser() { return user; }
    public void setUser(Users user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getWidgets() { return widgets; }
    public void setWidgets(String widgets) { this.widgets = widgets; }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
}

