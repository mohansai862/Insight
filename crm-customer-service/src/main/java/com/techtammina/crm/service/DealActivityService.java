package com.techtammina.crm.service;

import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.repository.DealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class DealActivityService {

    @Autowired
    private DealRepository dealRepository;
    
    // Store stage transitions in memory
    private final Map<Integer, List<StageTransition>> dealTransitions = new ConcurrentHashMap<>();

    public static class ActivityRecord {
        public Integer activityId;
        public String eventType;
        public String title;
        public String description;
        public String previousStage;
        public String newStage;
        public String createdBy;
        public LocalDateTime createdAt;
        
        public ActivityRecord(Integer id, String type, String title, String desc, String prevStage, String newStage, String user, LocalDateTime time) {
            this.activityId = id;
            this.eventType = type;
            this.title = title;
            this.description = desc;
            this.previousStage = prevStage;
            this.newStage = newStage;
            this.createdBy = user;
            this.createdAt = time;
        }
    }
    
    public static class StageTransition {
        public String fromStage;
        public String toStage;
        public LocalDateTime timestamp;
        public String user;
        
        public StageTransition(String from, String to, LocalDateTime time, String user) {
            this.fromStage = from;
            this.toStage = to;
            this.timestamp = time;
            this.user = user;
        }
    }

    public void recordStageTransition(Integer dealId, String fromStage, String toStage, String user) {
        System.out.println("Recording stage transition for deal " + dealId + ": " + fromStage + " -> " + toStage + " by " + user);
        dealTransitions.computeIfAbsent(dealId, k -> new ArrayList<>())
            .add(new StageTransition(fromStage, toStage, LocalDateTime.now(), user));
        System.out.println("Total transitions for deal " + dealId + ": " + dealTransitions.get(dealId).size());
    }

    public List<ActivityRecord> getActivitiesByDealId(Integer dealId) {
        Optional<Deal> dealOpt = dealRepository.findById(dealId);
        if (!dealOpt.isPresent()) {
            return new ArrayList<>();
        }
        
        Deal deal = dealOpt.get();
        List<ActivityRecord> activities = new ArrayList<>();
        
        // Deal creation activity
        activities.add(new ActivityRecord(
            1,
            "CREATION",
            "Deal created",
            "Deal \"" + deal.getDealName() + "\" was created",
            null,
            null,
            deal.getCreatedBy() != null ? deal.getCreatedBy().getUsername() : "System",
            deal.getCreatedAt()
        ));
        
        // Add recorded stage transitions
        List<StageTransition> transitions = dealTransitions.getOrDefault(dealId, new ArrayList<>());
        System.out.println("Getting activities for deal " + dealId + ", found " + transitions.size() + " transitions");
        for (int i = 0; i < transitions.size(); i++) {
            StageTransition transition = transitions.get(i);
            activities.add(new ActivityRecord(
                i + 2,
                "STAGE_CHANGE",
                "Stage updated",
                "Stage changed from " + mapStageToDisplay(transition.fromStage) + " to " + mapStageToDisplay(transition.toStage),
                mapStageToDisplay(transition.fromStage),
                mapStageToDisplay(transition.toStage),
                transition.user,
                transition.timestamp
            ));
        }
        
        // Sort by timestamp (newest first)
        activities.sort((a, b) -> b.createdAt.compareTo(a.createdAt));
        System.out.println("Returning " + activities.size() + " activities for deal " + dealId);
        return activities;
    }
    
    private String mapStageToDisplay(String stage) {
        if (stage == null) return "unknown";
        String normalizedStage = stage.toLowerCase().trim();
        switch (normalizedStage) {
            case "qualification": return "qualified";
            case "proposal": return "proposal";
            case "negotiation": return "negotiation";
            case "closed_won": return "won";
            case "closed_lost": return "lost";
            default: return normalizedStage;
        }
    }
}