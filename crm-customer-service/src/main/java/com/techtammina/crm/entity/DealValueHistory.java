package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "deal_value_history")
public class DealValueHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "deal_id", nullable = false)
    private Integer dealId;
    
    @Column(name = "original_value", precision = 19, scale = 2)
    private BigDecimal originalValue;
    
    @Column(name = "previous_value", precision = 19, scale = 2)
    private BigDecimal previousValue;
    
    @Column(name = "new_value", precision = 19, scale = 2)
    private BigDecimal newValue;
    
    @Column(name = "change_type", length = 20)
    private String changeType; // 'CREATION' or 'UPDATE'
    
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
    
    // Constructors
    public DealValueHistory() {}
    
    public DealValueHistory(Integer dealId, BigDecimal originalValue, String changeType) {
        this.dealId = dealId;
        this.originalValue = originalValue;
        this.changeType = changeType;
        this.changedAt = LocalDateTime.now();
    }
    
    public DealValueHistory(Integer dealId, BigDecimal originalValue, BigDecimal previousValue, BigDecimal newValue) {
        this.dealId = dealId;
        this.originalValue = originalValue;
        this.previousValue = previousValue;
        this.newValue = newValue;
        this.changeType = "UPDATE";
        this.changedAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Integer getDealId() { return dealId; }
    public void setDealId(Integer dealId) { this.dealId = dealId; }
    
    public BigDecimal getOriginalValue() { return originalValue; }
    public void setOriginalValue(BigDecimal originalValue) { this.originalValue = originalValue; }
    
    public BigDecimal getPreviousValue() { return previousValue; }
    public void setPreviousValue(BigDecimal previousValue) { this.previousValue = previousValue; }
    
    public BigDecimal getNewValue() { return newValue; }
    public void setNewValue(BigDecimal newValue) { this.newValue = newValue; }
    
    public String getChangeType() { return changeType; }
    public void setChangeType(String changeType) { this.changeType = changeType; }
    
    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
}