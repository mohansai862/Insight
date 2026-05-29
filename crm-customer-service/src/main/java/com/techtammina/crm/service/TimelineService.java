package com.techtammina.crm.service;

import com.techtammina.crm.entity.Timeline;
import com.techtammina.crm.repository.TimelineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class TimelineService {

    private static final Logger logger = LoggerFactory.getLogger(TimelineService.class);

    @Autowired
    private TimelineRepository timelineRepository;

    public List<Timeline> getTimelineByEntity(String entityType, Integer entityId) {
        logger.info("Getting timeline for entity: {} with ID: {}", entityType, entityId);
        List<Timeline> timeline = timelineRepository.findByRelatedEntityTypeAndRelatedEntityIdOrderByPerformedDateDesc(entityType, entityId);
        logger.info("Found {} timeline events for entity: {} with ID: {}", timeline.size(), entityType, entityId);
        return timeline;
    }

    public List<Timeline> getRecentTimeline(int limit) {
        logger.info("Getting recent timeline events with limit: {}", limit);
        List<Timeline> timeline = timelineRepository.findTopByOrderByPerformedDateDesc(limit);
        logger.info("Found {} recent timeline events", timeline.size());
        return timeline;
    }

    public Timeline createTimelineEvent(Timeline timeline) {
        try {
            logger.info("Creating timeline event: {} for entity: {} with ID: {}", 
                timeline.getEventType(), timeline.getRelatedEntityType(), timeline.getRelatedEntityId());
            
            timeline.setPerformedDate(LocalDateTime.now());
            Timeline savedTimeline = timelineRepository.save(timeline);
            
            logger.info("Timeline event created successfully with ID: {}", savedTimeline.getTimelineId());
            return savedTimeline;
        } catch (Exception e) {
            logger.error("Failed to create timeline event: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create timeline event: " + e.getMessage(), e);
        }
    }
}

