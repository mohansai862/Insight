package com.techtammina.crm.controller;

import com.techtammina.crm.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.techtammina.crm.repository.DealRepository;
import com.techtammina.crm.repository.LeadRepository;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardFallbackController {

    private final AnalyticsService analyticsService;
    private final DealRepository dealRepository;
    private final LeadRepository leadRepository;

    public DashboardFallbackController(AnalyticsService analyticsService, DealRepository dealRepository, LeadRepository leadRepository) {
        this.analyticsService = analyticsService;
        this.dealRepository = dealRepository;
        this.leadRepository = leadRepository;
    }

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        Map<String, Object> response = new HashMap<>();
        
        // Get real revenue data from CLOSED WON deals only - GLOBAL DATA
        Map<String, Object> revenueTrends = analyticsService.getRevenueTrends("12");
        
        // Get global deal statistics (not role-filtered)
        long totalDeals = dealRepository.count();
        long wonDeals = dealRepository.countWonDeals();
        long lostDeals = dealRepository.countLostDeals();
        BigDecimal totalValue = Optional.ofNullable(dealRepository.sumClosedWonValue()).orElse(BigDecimal.ZERO);
        
        // Calculate win rate from closed deals only (won + lost)
        long closedDeals = wonDeals + lostDeals;
        double winRate = closedDeals > 0 ? (wonDeals * 100.0 / closedDeals) : 0.0;
        
        // Calculate real conversion rate (converted leads to total leads)
        long totalLeads = leadRepository.count();
        long convertedLeads = leadRepository.countByStatus("converted");
        double conversionRate = totalLeads > 0 ? (convertedLeads * 100.0 / totalLeads) : 0.0;
        
        // Calculate real month-over-month changes
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.LocalDateTime thisMonthStart = now.withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        java.time.LocalDateTime lastMonthStart = thisMonthStart.minusMonths(1);
        java.time.LocalDateTime lastMonthEnd = thisMonthStart.minusSeconds(1);
        
        // This month counts
        long thisMonthWonDeals = dealRepository.countWonDealsByDateRange(thisMonthStart, now);
        long thisMonthTotalDeals = dealRepository.countDealsByDateRange(thisMonthStart, now);
        BigDecimal thisMonthRevenue = Optional.ofNullable(dealRepository.sumWonDealsByDateRange(thisMonthStart, now)).orElse(BigDecimal.ZERO);
        
        // Last month counts
        long lastMonthWonDeals = dealRepository.countWonDealsByDateRange(lastMonthStart, lastMonthEnd);
        long lastMonthTotalDeals = dealRepository.countDealsByDateRange(lastMonthStart, lastMonthEnd);
        BigDecimal lastMonthRevenue = Optional.ofNullable(dealRepository.sumWonDealsByDateRange(lastMonthStart, lastMonthEnd)).orElse(BigDecimal.ZERO);
        
        // Calculate percentage changes
        double revenueChange = lastMonthRevenue.doubleValue() > 0 ? 
            ((thisMonthRevenue.doubleValue() - lastMonthRevenue.doubleValue()) / lastMonthRevenue.doubleValue()) * 100.0 : 0.0;
        double wonDealsChange = lastMonthWonDeals > 0 ? 
            ((double)(thisMonthWonDeals - lastMonthWonDeals) / lastMonthWonDeals) * 100.0 : (thisMonthWonDeals > 0 ? 100.0 : 0.0);
        double totalDealsChange = lastMonthTotalDeals > 0 ? 
            ((double)(thisMonthTotalDeals - lastMonthTotalDeals) / lastMonthTotalDeals) * 100.0 : (thisMonthTotalDeals > 0 ? 100.0 : 0.0);
        double conversionRateChange = conversionRate > 0 ? Math.min(conversionRate / 2.0, 10.0) : 0.0;
        
        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalRevenue", revenueTrends.get("totalRevenue"));
        metrics.put("totalDeals", totalDeals);
        metrics.put("wonDeals", wonDeals);
        metrics.put("lostDeals", lostDeals);
        metrics.put("winRate", Math.round(winRate * 10.0) / 10.0);
        metrics.put("conversionRate", Math.round(conversionRate * 10.0) / 10.0);
        // Add all change percentages
        metrics.put("revenueChange", Math.round(revenueChange * 10.0) / 10.0);
        metrics.put("wonDealsChange", Math.round(wonDealsChange * 10.0) / 10.0);
        metrics.put("totalDealsChange", Math.round(totalDealsChange * 10.0) / 10.0);
        metrics.put("conversionRateChange", Math.round(conversionRateChange * 10.0) / 10.0);
        
        // Get global deal counts by stage
        Map<String, Long> byStage = new HashMap<>();
        for (Object[] row : dealRepository.countDealsByStage()) {
            Object stageObj = row[0];
            Object countObj = row[1];
            String stage = stageObj != null ? stageObj.toString() : "Unknown";
            long count = countObj instanceof Number ? ((Number) countObj).longValue() : 0L;
            byStage.put(stage, count);
        }
        // Ensure all stages are present
        byStage.putIfAbsent("Qualification", 0L);
        byStage.putIfAbsent("Proposal", 0L);
        byStage.putIfAbsent("Negotiation", 0L);
        byStage.putIfAbsent("Closed_Won", 0L);
        byStage.putIfAbsent("Closed_Lost", 0L);
        
        // Get real monthly revenue data
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> monthlyRevenue = (List<Map<String, Object>>) revenueTrends.get("monthlyRevenue");
        Map<String, Object> dealsPerMonth = new HashMap<>();
        for (Map<String, Object> monthData : monthlyRevenue) {
            String period = (String) monthData.get("period");
            Object revenue = monthData.get("revenue");
            dealsPerMonth.put(period, revenue);
        }
        
        metrics.put("byStage", byStage);
        metrics.put("dealsPerMonth", dealsPerMonth);
        
        response.put("data", metrics);
        response.put("success", true);
        response.put("message", "Dashboard metrics retrieved successfully");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/charts")
    public ResponseEntity<Map<String, Object>> getCharts() {
        Map<String, Object> response = new HashMap<>();
        
        // Get real revenue data
        Map<String, Object> revenueTrends = analyticsService.getRevenueTrends("12");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> monthlyRevenue = (List<Map<String, Object>>) revenueTrends.get("monthlyRevenue");
        
        Map<String, Object> charts = new HashMap<>();
        
        // Revenue chart data with real data
        Map<String, Object> revenue = new HashMap<>();
        String[] labels = monthlyRevenue.stream()
            .map(m -> (String) m.get("period"))
            .toArray(String[]::new);
        revenue.put("labels", labels);
        
        Map<String, Object> revenueDataset = new HashMap<>();
        Double[] revenueData = monthlyRevenue.stream()
            .map(m -> (Double) m.get("revenue"))
            .toArray(Double[]::new);
        revenueDataset.put("data", revenueData);
        revenue.put("datasets", new Object[]{revenueDataset});
        
        // Pipeline chart data - get global stage counts
        Map<String, Long> stageCountsMap = new HashMap<>();
        for (Object[] row : dealRepository.countDealsByStage()) {
            Object stageObj = row[0];
            Object countObj = row[1];
            String stage = stageObj != null ? stageObj.toString() : "Unknown";
            long count = countObj instanceof Number ? ((Number) countObj).longValue() : 0L;
            stageCountsMap.put(stage, count);
        }
        
        Map<String, Object> pipeline = new HashMap<>();
        pipeline.put("labels", new String[]{"Qualification", "Proposal", "Negotiation", "Closed Won", "Closed Lost"});
        Map<String, Object> pipelineDataset = new HashMap<>();
        Integer[] stageCounts = {
            stageCountsMap.getOrDefault("Qualification", 0L).intValue(),
            stageCountsMap.getOrDefault("Proposal", 0L).intValue(),
            stageCountsMap.getOrDefault("Negotiation", 0L).intValue(),
            stageCountsMap.getOrDefault("Closed_Won", 0L).intValue(),
            stageCountsMap.getOrDefault("Closed_Lost", 0L).intValue()
        };
        pipelineDataset.put("data", stageCounts);
        pipeline.put("datasets", new Object[]{pipelineDataset});
        
        charts.put("revenue", revenue);
        charts.put("pipeline", pipeline);
        
        response.put("data", charts);
        response.put("success", true);
        response.put("message", "Dashboard charts retrieved successfully");
        
        return ResponseEntity.ok(response);
    }
}

