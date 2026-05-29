package com.techtammina.crm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import com.techtammina.crm.dto.ActivityDTO;
import com.techtammina.crm.entity.Activity;
import com.techtammina.crm.mapper.ActivityMapper;
import com.techtammina.crm.service.ActivityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/activity")
@CrossOrigin(origins = "*")
public class ActivityController {

    private static final Logger log = LoggerFactory.getLogger(ActivityController.class);

    private final ActivityService activityService;
    private final ActivityMapper activityMapper;

    @Autowired
    public ActivityController(ActivityService activityService, ActivityMapper activityMapper) {
        this.activityService = activityService;
        this.activityMapper = activityMapper;
    }

    @GetMapping
    public ResponseEntity<List<ActivityDTO>> getAllActivities(@RequestHeader("X-User-Id") Integer userId) {
        try {
            List<Activity> activities = activityService.findByCreatedBy(userId);
            List<ActivityDTO> activityDTOs = activities.stream()
                    .map(activityMapper::toDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(activityDTOs);
        } catch (Exception e) {
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivityDTO> getActivityById(@PathVariable Integer id) {
        try {
            Optional<Activity> activity = activityService.findById(id);
            return activity.map(value -> ResponseEntity.ok(activityMapper.toDTO(value)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<ActivityDTO> createActivity(@RequestBody ActivityDTO activityDTO) {
        try {
            log.debug("{}", "Creating activity: " + activityDTO);
            if (activityDTO.getLeadId() == null) {
                log.debug("Lead ID is null");
                return ResponseEntity.badRequest().build();
            }
            if (activityDTO.getSubject() == null || activityDTO.getSubject().trim().isEmpty()) {
                log.debug("Subject is null or empty");
                return ResponseEntity.badRequest().build();
            }
            if (activityDTO.getActivityDate() == null) {
                log.debug("Activity date is null");
                return ResponseEntity.badRequest().build();
            }
            
            Activity activity = activityMapper.toEntity(activityDTO);
            Activity savedActivity = activityService.save(activity);
            return ResponseEntity.ok(activityMapper.toDTO(savedActivity));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActivityDTO> updateActivity(@PathVariable Integer id, @RequestBody ActivityDTO activityDTO) {
        try {
            if (activityDTO.getLeadId() == null) {
                return ResponseEntity.badRequest().build();
            }
            if (activityDTO.getSubject() == null || activityDTO.getSubject().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (activityDTO.getActivityDate() == null) {
                return ResponseEntity.badRequest().build();
            }
            
            Optional<Activity> existingActivity = activityService.findById(id);
            if (existingActivity.isPresent()) {
                Activity activity = activityMapper.toEntity(activityDTO);
                activity.setActivityId(id);
                Activity updatedActivity = activityService.save(activity);
                return ResponseEntity.ok(activityMapper.toDTO(updatedActivity));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteActivity(@PathVariable Integer id) {
        try {
            if (activityService.findById(id).isPresent()) {
                activityService.deleteById(id);
                return ResponseEntity.noContent().build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/lead/{leadId}")
    public ResponseEntity<List<ActivityDTO>> getActivitiesByLeadId(@PathVariable Integer leadId, @RequestHeader("X-User-Id") Integer userId) {
        try {
            // Get all activities for the lead, not just those created by current user
            List<Activity> activities = activityService.findByLeadId(leadId);
            List<ActivityDTO> activityDTOs = activities.stream()
                    .map(activityMapper::toDTO)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(activityDTOs);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(java.util.Collections.emptyList());
        }
    }
}



