package com.techtammina.crm.controller;

import com.techtammina.crm.entity.Timeline;
import com.techtammina.crm.service.TimelineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/timeline")
public class TimelineController {

    @Autowired
    private TimelineService timelineService;

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<Timeline>> getTimelineByEntity(
            @PathVariable String entityType,
            @PathVariable Integer entityId) {
        List<Timeline> timeline = timelineService.getTimelineByEntity(entityType, entityId);
        return ResponseEntity.ok(timeline);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Timeline>> getRecentTimeline(@RequestParam(defaultValue = "50") int limit) {
        List<Timeline> timeline = timelineService.getRecentTimeline(limit);
        return ResponseEntity.ok(timeline);
    }

    @PostMapping
    public ResponseEntity<Timeline> createTimelineEvent(@RequestBody Timeline timeline) {
        Timeline createdEvent = timelineService.createTimelineEvent(timeline);
        return ResponseEntity.ok(createdEvent);
    }
    
    @PostMapping("/test")
    public ResponseEntity<String> testTimelineCreation() {
        try {
            Timeline testEvent = new Timeline();
            testEvent.setRelatedEntityType("contact");
            testEvent.setRelatedEntityId(1);
            testEvent.setEventType(Timeline.EventType.Email);
            testEvent.setEventDescription("Test email event");
            testEvent.setEventData("{\"test\": \"data\"}");
            testEvent.setPerformedBy(1);
            testEvent.setIcon("mail");
            testEvent.setColor("#3B82F6");
            
            Timeline created = timelineService.createTimelineEvent(testEvent);
            return ResponseEntity.ok("Test timeline event created with ID: " + created.getTimelineId());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error creating test timeline event: " + e.getMessage());
        }
    }
}

