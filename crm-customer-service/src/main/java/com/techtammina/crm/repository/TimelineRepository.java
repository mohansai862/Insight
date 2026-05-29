package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Timeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimelineRepository extends JpaRepository<Timeline, Integer> {
    List<Timeline> findByRelatedEntityTypeAndRelatedEntityIdOrderByPerformedDateDesc(String entityType, Integer entityId);
    
    @Query("SELECT t FROM Timeline t ORDER BY t.performedDate DESC LIMIT :limit")
    List<Timeline> findTopByOrderByPerformedDateDesc(int limit);
}

