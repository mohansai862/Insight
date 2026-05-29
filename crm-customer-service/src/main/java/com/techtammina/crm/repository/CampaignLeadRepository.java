package com.techtammina.crm.repository;

import com.techtammina.crm.entity.CampaignLead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CampaignLeadRepository extends JpaRepository<CampaignLead, Long> {
    
    @Query("SELECT c FROM CampaignLead c WHERE c.createdAt >= :startDate ORDER BY c.createdAt DESC")
    List<CampaignLead> findRecentLeads(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT COUNT(c) FROM CampaignLead c WHERE c.createdAt >= :startDate")
    Long countRecentLeads(@Param("startDate") LocalDateTime startDate);
    
    @Query("SELECT c.source, COUNT(c) FROM CampaignLead c WHERE c.createdAt >= :startDate GROUP BY c.source")
    List<Object[]> countBySourceSince(@Param("startDate") LocalDateTime startDate);
}

