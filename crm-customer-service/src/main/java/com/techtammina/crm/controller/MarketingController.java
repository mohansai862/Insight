package com.techtammina.crm.controller;

import com.techtammina.crm.entity.CampaignLead;
import com.techtammina.crm.repository.CampaignLeadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/marketing")
@CrossOrigin(origins = "*")
public class MarketingController {

    @Autowired
    private CampaignLeadRepository campaignLeadRepository;

    @GetMapping("/recent-campaigns")
    public ResponseEntity<Map<String, Object>> getRecentCampaigns() {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        
        List<CampaignLead> recentLeads = campaignLeadRepository.findRecentLeads(thirtyDaysAgo);
        Long totalCount = campaignLeadRepository.countRecentLeads(thirtyDaysAgo);
        List<Object[]> sourceStats = campaignLeadRepository.countBySourceSince(thirtyDaysAgo);
        
        Map<String, Long> sourceBreakdown = new HashMap<>();
        for (Object[] stat : sourceStats) {
            sourceBreakdown.put(stat[0].toString(), (Long) stat[1]);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("totalLeads", totalCount);
        response.put("recentLeads", recentLeads);
        response.put("sourceBreakdown", sourceBreakdown);
        response.put("period", "Last 30 days");
        
        return ResponseEntity.ok(response);
    }
}

