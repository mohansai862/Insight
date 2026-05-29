package com.techtammina.crm.controller;

import com.techtammina.crm.entity.Activity;
import com.techtammina.crm.entity.Email;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.service.ActivityService;
import com.techtammina.crm.service.EmailService;
import com.techtammina.crm.service.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/communication")
@CrossOrigin(origins = "*")
public class CommunicationController {

    @Autowired
    private ActivityService activityService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private UsersService usersService;

    @GetMapping("/manager-team")
    public ResponseEntity<Map<String, Object>> getManagerTeamCommunications(@RequestHeader("X-User-Id") Integer userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get executives under this manager
            List<Users> executives = usersService.findByManagerIdAndRole(userId, "Sales_Executive");
            
            // Get activities from executives
            List<Activity> teamActivities = new ArrayList<>();
            for (Users executive : executives) {
                teamActivities.addAll(activityService.findByCreatedBy(executive.getUserId()));
            }
            
            // Format activities
            List<Map<String, Object>> activities = teamActivities.stream().map(activity -> {
                Map<String, Object> activityMap = new HashMap<>();
                activityMap.put("id", activity.getActivityId());
                activityMap.put("type", activity.getActivityType() != null ? activity.getActivityType().name().toLowerCase() : "call");
                activityMap.put("subject", activity.getSubject());
                activityMap.put("description", activity.getDescription());
                activityMap.put("activityDate", activity.getActivityDate());
                activityMap.put("status", "completed");
                
                // Add creator info
                Users creator = activity.getCreatedBy();
                if (creator != null) {
                    activityMap.put("createdBy", creator.getFirstName() + " " + creator.getLastName());
                    activityMap.put("createdByRole", creator.getRole());
                    activityMap.put("createdByEmail", creator.getEmail());
                }
                
                return activityMap;
            }).collect(Collectors.toList());
            
            response.put("activities", activities);
            response.put("emails", new ArrayList<>());
            response.put("executivesCount", executives.size());
            response.put("totalActivities", activities.size());
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vp-team")
    public ResponseEntity<Map<String, Object>> getVPTeamCommunications(@RequestHeader("X-User-Id") Integer userId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Get managers under VP
            List<Users> managers = usersService.findByManagerIdAndRole(userId, "Sales_Manager");
            
            // Get executives under those managers
            List<Users> executives = new ArrayList<>();
            for (Users manager : managers) {
                executives.addAll(usersService.findByManagerIdAndRole(manager.getUserId(), "Sales_Executive"));
            }
            
            // Get activities from entire hierarchy (managers + executives)
            List<Activity> teamActivities = new ArrayList<>();
            for (Users manager : managers) {
                teamActivities.addAll(activityService.findByCreatedBy(manager.getUserId()));
            }
            for (Users executive : executives) {
                teamActivities.addAll(activityService.findByCreatedBy(executive.getUserId()));
            }
            
            // Format activities
            List<Map<String, Object>> activities = teamActivities.stream().map(activity -> {
                Map<String, Object> activityMap = new HashMap<>();
                activityMap.put("id", activity.getActivityId());
                activityMap.put("type", activity.getActivityType() != null ? activity.getActivityType().name().toLowerCase() : "call");
                activityMap.put("subject", activity.getSubject());
                activityMap.put("description", activity.getDescription());
                activityMap.put("activityDate", activity.getActivityDate());
                activityMap.put("status", "completed");
                
                // Add creator info
                Users creator = activity.getCreatedBy();
                if (creator != null) {
                    activityMap.put("createdBy", creator.getFirstName() + " " + creator.getLastName());
                    activityMap.put("createdByRole", creator.getRole());
                    activityMap.put("createdByEmail", creator.getEmail());
                }
                
                return activityMap;
            }).collect(Collectors.toList());
            
            response.put("activities", activities);
            response.put("emails", new ArrayList<>());
            
            // Debug info
            response.put("managersCount", managers.size());
            response.put("executivesCount", executives.size());
            response.put("totalActivities", activities.size());
            
        } catch (Exception e) {
            e.printStackTrace();
        }
        
        return ResponseEntity.ok(response);
    }
    

    

}