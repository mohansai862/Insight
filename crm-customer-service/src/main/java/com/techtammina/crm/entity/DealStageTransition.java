package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deal_stage_transitions")
public class DealStageTransition {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "deal_id", nullable = false)
    private Deal deal;
    
    @Column(name = "previous_stage")
    private String previousStage;
    
    @Column(name = "new_stage", nullable = false)
    private String newStage;
    
    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;
    
    @Column(name = "user_id")
    private Integer userId;
    
    @Column(name = "is_direct_jump")
    private Boolean isDirectJump;
    
    // Constructors
    public DealStageTransition() {}
    
    public DealStageTransition(Deal deal, String previousStage, String newStage, Integer userId) {
        this.deal = deal;
        this.previousStage = previousStage;
        this.newStage = newStage;
        this.userId = userId;
        this.changedAt = LocalDateTime.now();
        this.isDirectJump = calculateDirectJump(previousStage, newStage);
    }
    
    private Boolean calculateDirectJump(String from, String to) {
        if (from == null) return false; // Initial stage setting is not a jump
        if (to == null) return false;
        
        String normalizedFrom = normalizeStage(from);
        String normalizedTo = normalizeStage(to);
        
        // Any jump to lost is direct
        if ("lost".equals(normalizedTo)) {
            return true;
        }
        
        // Jump to won is direct unless from negotiation
        if ("won".equals(normalizedTo)) {
            return !"negotiation".equals(normalizedFrom);
        }
        
        // Check if skipping stages
        String[] stages = {"qualified", "proposal", "negotiation", "won", "lost"};
        int fromIndex = -1, toIndex = -1;
        
        for (int i = 0; i < stages.length; i++) {
            if (stages[i].equals(normalizedFrom)) fromIndex = i;
            if (stages[i].equals(normalizedTo)) toIndex = i;
        }
        
        return fromIndex != -1 && toIndex != -1 && Math.abs(toIndex - fromIndex) > 1;
    }
    
    private String normalizeStage(String stage) {
        if (stage == null) return null;
        String normalized = stage.toLowerCase().trim().replace("_", "");
        
        // Handle different stage name formats
        if (normalized.contains("closedwon") || normalized.equals("won")) return "won";
        if (normalized.contains("closedlost") || normalized.equals("lost")) return "lost";
        if (normalized.contains("qualification") || normalized.equals("qualified")) return "qualified";
        if (normalized.equals("proposal")) return "proposal";
        if (normalized.equals("negotiation")) return "negotiation";
        
        return normalized;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public Deal getDeal() { return deal; }
    public void setDeal(Deal deal) { this.deal = deal; }
    
    public String getPreviousStage() { return previousStage; }
    public void setPreviousStage(String previousStage) { this.previousStage = previousStage; }
    
    public String getNewStage() { return newStage; }
    public void setNewStage(String newStage) { this.newStage = newStage; }
    
    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
    
    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }
    
    public Boolean getIsDirectJump() { return isDirectJump; }
    public void setIsDirectJump(Boolean isDirectJump) { this.isDirectJump = isDirectJump; }
}