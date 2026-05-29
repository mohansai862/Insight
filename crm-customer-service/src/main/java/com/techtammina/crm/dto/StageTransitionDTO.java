package com.techtammina.crm.dto;

import java.time.LocalDateTime;

public class StageTransitionDTO {
    private Long id;
    private String previousStage;
    private String newStage;
    private LocalDateTime changedAt;
    private String userName;
    private Boolean isDirectJump;
    
    public StageTransitionDTO() {}
    
    public StageTransitionDTO(Long id, String previousStage, String newStage, 
                             LocalDateTime changedAt, String userName, Boolean isDirectJump) {
        this.id = id;
        this.previousStage = previousStage;
        this.newStage = newStage;
        this.changedAt = changedAt;
        this.userName = userName;
        this.isDirectJump = isDirectJump;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getPreviousStage() { return previousStage; }
    public void setPreviousStage(String previousStage) { this.previousStage = previousStage; }
    
    public String getNewStage() { return newStage; }
    public void setNewStage(String newStage) { this.newStage = newStage; }
    
    public LocalDateTime getChangedAt() { return changedAt; }
    public void setChangedAt(LocalDateTime changedAt) { this.changedAt = changedAt; }
    
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    
    public Boolean getIsDirectJump() { return isDirectJump; }
    public void setIsDirectJump(Boolean isDirectJump) { this.isDirectJump = isDirectJump; }
}