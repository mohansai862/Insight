package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "timeline")
public class Timeline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "timeline_id")
    private Integer timelineId;

    @Column(name = "related_entity_type", nullable = false, length = 50)
    private String relatedEntityType;

    @Column(name = "related_entity_id", nullable = false)
    private Integer relatedEntityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false)
    private EventType eventType;

    @Column(name = "event_description", columnDefinition = "TEXT", nullable = false)
    private String eventDescription;

    @Column(name = "event_data", columnDefinition = "JSON")
    private String eventData;

    @Column(name = "performed_by")
    private Integer performedBy;

    @Column(name = "performed_date")
    private LocalDateTime performedDate = LocalDateTime.now();

    @Column(name = "icon", length = 50)
    private String icon = "activity";

    @Column(name = "color", length = 20)
    private String color = "#6B7280";

    public enum EventType {
        Note, Activity, StatusChange, Email, Call, Meeting, SystemEvent, Assignment, Creation, Update, Deletion
    }

    // Getters and Setters
    public Integer getTimelineId() { return timelineId; }
    public void setTimelineId(Integer timelineId) { this.timelineId = timelineId; }

    public String getRelatedEntityType() { return relatedEntityType; }
    public void setRelatedEntityType(String relatedEntityType) { this.relatedEntityType = relatedEntityType; }

    public Integer getRelatedEntityId() { return relatedEntityId; }
    public void setRelatedEntityId(Integer relatedEntityId) { this.relatedEntityId = relatedEntityId; }

    public EventType getEventType() { return eventType; }
    public void setEventType(EventType eventType) { this.eventType = eventType; }

    public String getEventDescription() { return eventDescription; }
    public void setEventDescription(String eventDescription) { this.eventDescription = eventDescription; }

    public String getEventData() { return eventData; }
    public void setEventData(String eventData) { this.eventData = eventData; }

    public Integer getPerformedBy() { return performedBy; }
    public void setPerformedBy(Integer performedBy) { this.performedBy = performedBy; }

    public LocalDateTime getPerformedDate() { return performedDate; }
    public void setPerformedDate(LocalDateTime performedDate) { this.performedDate = performedDate; }

    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}

