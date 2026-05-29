package com.techtammina.crm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.extern.slf4j.Slf4j;

import com.techtammina.crm.dto.DealDTO;
import com.techtammina.crm.dto.StageTransitionDTO;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.mapper.DealMapper;
import com.techtammina.crm.service.DealService;
import com.techtammina.crm.service.DealStageTransitionService;
import com.techtammina.crm.service.DealValueTrackingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/deals")
@Slf4j
public class DealController {

    private static final Logger log = LoggerFactory.getLogger(DealController.class);
    private final DealService dealService;
    private final DealStageTransitionService stageTransitionService;
    private final DealValueTrackingService dealValueTrackingService;

    @Autowired
    public DealController(DealService dealService, DealStageTransitionService stageTransitionService, DealValueTrackingService dealValueTrackingService) {
        this.dealService = dealService;
        this.stageTransitionService = stageTransitionService;
        this.dealValueTrackingService = dealValueTrackingService;
    }

    @GetMapping
    public ResponseEntity<List<DealDTO>> getAllDeals(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer limit,
            @RequestParam(required = false) Integer accountId,
            @RequestParam(required = false) Integer contactId,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        List<Deal> deals;

        // For testing: if no userId/role provided, use defaults
        if (userId == null) {
            userId = 1; // Default user for testing
            log.warn("No X-User-Id header provided, using default user ID: {}", userId);
        }
        if (userRole == null) {
            userRole = "Sales_Manager"; // Default role for testing
            log.warn("No X-User-Role header provided, using default role: {}", userRole);
        }

        // Apply filters
        if (accountId != null) {
            deals = dealService.findByAccountId(accountId);
        } else if (contactId != null) {
            deals = dealService.findByContactId(contactId);
        } else if (q != null && !q.trim().isEmpty()) {
            deals = dealService.findByNameContaining(q.trim());
        } else {
            deals = dealService.findFiltered(q, userId, userRole);
        }

        // Apply pagination if provided
        if (page != null && limit != null) {
            int startIndex = page * limit;
            int endIndex = Math.min(startIndex + limit, deals.size());
            if (startIndex < deals.size()) {
                deals = deals.subList(startIndex, endIndex);
            } else {
                deals = new java.util.ArrayList<>();
            }
        }

        List<DealDTO> dealDTOs = deals.stream()
                .map(DealMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dealDTOs);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DealDTO> getDealById(@PathVariable Integer id) {
        Optional<Deal> deal = dealService.findById(id);
        return deal.map(value -> ResponseEntity.ok(DealMapper.toDTO(value)))
                .orElse(ResponseEntity.notFound().build());

    }

    @PostMapping
    public ResponseEntity<DealDTO> createDeal(@Valid @RequestBody DealDTO dealDTO) {
        Deal deal = DealMapper.toEntity(dealDTO);
        Deal savedDeal = dealService.save(deal);
        
        // Record original value for timeline tracking - ensure this is the first and immutable record
        if (savedDeal.getDealValue() != null) {
            dealValueTrackingService.recordOriginalValue(savedDeal.getDealId(), savedDeal.getDealValue());
        }
        
        return ResponseEntity.ok(DealMapper.toDTO(savedDeal));
    }

    @PutMapping("/{id}")
    public ResponseEntity<DealDTO> updateDeal(@PathVariable Integer id, @Valid @RequestBody DealDTO dealDTO,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        Optional<Deal> existingDealOpt = dealService.findById(id);
        if (existingDealOpt.isPresent()) {
            Deal existingDeal = existingDealOpt.get();
            Deal.Stage oldStage = existingDeal.getStage();
            Deal.Stage newStage = Deal.Stage.valueOf(dealDTO.getStage());
            BigDecimal oldValue = existingDeal.getDealValue();
            BigDecimal newValue = dealDTO.getDealValue();
            
            // Update only the fields that should be changed, preserve relationships
            existingDeal.setDealName(dealDTO.getDealName());
            existingDeal.setDealValue(dealDTO.getDealValue());
            existingDeal.setStage(newStage);
            existingDeal.setProbability(dealDTO.getProbability());
            existingDeal.setExpectedCloseDate(dealDTO.getExpectedCloseDate());
            existingDeal.setRemarks(dealDTO.getRemarks());
            
            // Set closed date to current date when stage changes to Closed_Won
            if (newStage == Deal.Stage.Closed_Won && oldStage != Deal.Stage.Closed_Won) {
                existingDeal.setClosedDate(java.time.LocalDate.now());
            } else if (newStage != Deal.Stage.Closed_Won) {
                existingDeal.setClosedDate(null);
            }
            
            // Record stage transition if stage changed
            if (oldStage != newStage) {
                Integer transitionUserId = userId != null ? userId : 1; // Default user if not provided
                stageTransitionService.recordStageTransition(
                    existingDeal, 
                    oldStage != null ? oldStage.name() : null, 
                    newStage.name(), 
                    transitionUserId
                );
            }
            
            // Record value change if value actually changed
            if (oldValue != null && newValue != null && oldValue.compareTo(newValue) != 0) {
                dealValueTrackingService.recordValueChange(id, oldValue, newValue);
            }
            
            Deal updatedDeal = dealService.save(existingDeal);
            return ResponseEntity.ok(DealMapper.toDTO(updatedDeal));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDeal(@PathVariable Integer id) {
        if (dealService.findById(id).isPresent()) {
            dealService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
    
    @GetMapping("/{id}/activity")
    public ResponseEntity<List<Map<String, Object>>> getDealActivity(@PathVariable Integer id) {
        Optional<Deal> dealOpt = dealService.findById(id);
        if (!dealOpt.isPresent()) {
            return ResponseEntity.notFound().build();
        }
        
        Deal deal = dealOpt.get();
        List<Map<String, Object>> activities = new java.util.ArrayList<>();
        
        // Get original value for creation activity - ensure it's preserved
        BigDecimal originalValue = dealValueTrackingService.getOriginalValue(id);
        if (originalValue == null) {
            // For existing deals without tracking, record current value as original and use it
            originalValue = deal.getDealValue();
            if (originalValue != null) {
                dealValueTrackingService.recordOriginalValue(id, originalValue);
            }
        }
        
        // Add deal creation activity with original value
        Map<String, Object> creationActivity = new HashMap<>();
        creationActivity.put("id", "creation");
        creationActivity.put("type", "CREATION");
        creationActivity.put("title", "Deal created: " + deal.getDealName());
        creationActivity.put("description", "Deal \"" + deal.getDealName() + "\" was created");
        creationActivity.put("value", originalValue);
        creationActivity.put("changedAt", deal.getCreatedAt());
        String creatorName = deal.getCreatedBy() != null ? 
            deal.getCreatedBy().getFirstName() + " " + deal.getCreatedBy().getLastName() : "System";
        creationActivity.put("userName", creatorName);
        activities.add(creationActivity);
        
        // Add value change activities
        List<DealValueTrackingService.ValueChange> valueChanges = dealValueTrackingService.getValueChanges(id);
        for (DealValueTrackingService.ValueChange change : valueChanges) {
            Map<String, Object> valueActivity = new HashMap<>();
            valueActivity.put("id", "value_" + change.timestamp.toString());
            valueActivity.put("type", "VALUE_CHANGE");
            valueActivity.put("title", "Deal updated: Value \"" + change.newValue + "\"");
            valueActivity.put("description", "Deal value updated from $" + change.previousValue + " to $" + change.newValue);
            valueActivity.put("value", change.newValue);
            valueActivity.put("changedAt", change.timestamp);
            valueActivity.put("userName", dealValueTrackingService.getUserNameFromDeal(id, change.timestamp));
            activities.add(valueActivity);
        }
        
        // Add stage transitions
        List<StageTransitionDTO> transitions = stageTransitionService.getDealStageTransitions(id);
        for (StageTransitionDTO transition : transitions) {
            Map<String, Object> activity = new HashMap<>();
            activity.put("id", transition.getId());
            activity.put("type", "STAGE_CHANGE");
            activity.put("title", mapStageToDisplayName(transition.getNewStage()));
            activity.put("description", "Stage changed from " + transition.getPreviousStage() + " to " + transition.getNewStage());
            activity.put("changedAt", transition.getChangedAt());
            activity.put("userName", transition.getUserName());
            activity.put("previousStage", transition.getPreviousStage());
            activity.put("newStage", transition.getNewStage());
            activities.add(activity);
        }
        
        // Sort by timestamp (newest first)
        activities.sort((a, b) -> {
            java.time.LocalDateTime timeA = (java.time.LocalDateTime) a.get("changedAt");
            java.time.LocalDateTime timeB = (java.time.LocalDateTime) b.get("changedAt");
            return timeB.compareTo(timeA);
        });
        
        return ResponseEntity.ok(activities);
    }
    
    private String mapStageToDisplayName(String stage) {
        if (stage == null) return "Unknown";
        switch (stage.toLowerCase()) {
            case "qualification": return "Deal qualified";
            case "proposal": return "Deal proposal";
            case "negotiation": return "Deal negotiation";
            case "closed_won": return "Deal won";
            case "closed_lost": return "Deal lost";
            default: return "Deal " + stage.toLowerCase();
        }
    }
    
    @GetMapping("/debug")
    public ResponseEntity<String> debugDeals() {
        List<Deal> deals = dealService.findAll();
        StringBuilder debug = new StringBuilder();
        debug.append("Total deals: ").append(deals.size()).append("\n\n");
        
        for (Deal deal : deals) {
            debug.append("Deal: ").append(deal.getDealName()).append("\n");
            debug.append("  Account: ").append(deal.getAccount() != null ? deal.getAccount().getAccountName() : "NULL").append("\n");
            debug.append("  Contact: ").append(deal.getContact() != null ? (deal.getContact().getFirstName() + " " + deal.getContact().getLastName()) : "NULL").append("\n");
            debug.append("  Created By: ").append(deal.getCreatedBy() != null ? deal.getCreatedBy().getUsername() : "NULL").append("\n\n");
        }
        
        return ResponseEntity.ok(debug.toString());
    }
}


