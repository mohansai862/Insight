package com.techtammina.crm.service;

import com.techtammina.crm.entity.DashboardLayout;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.DashboardLayoutRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class DashboardService {

    private final DashboardLayoutRepository dashboardLayoutRepository;
    private final UsersRepository usersRepository;

    public DashboardService(DashboardLayoutRepository dashboardLayoutRepository, UsersRepository usersRepository) {
        this.dashboardLayoutRepository = dashboardLayoutRepository;
        this.usersRepository = usersRepository;
    }

    public DashboardLayout createDashboard(DashboardLayout dashboard, Integer userId) {
        Users user = usersRepository.findById(userId).orElseThrow();
        dashboard.setUser(user);
        return dashboardLayoutRepository.save(dashboard);
    }

    public List<DashboardLayout> getUserDashboards(Integer userId, String userRole) {
        return dashboardLayoutRepository.findByUserIdOrRole(userId, userRole);
    }

    public Optional<DashboardLayout> getDefaultDashboard(String userRole) {
        return dashboardLayoutRepository.findDefaultByRole(userRole);
    }

    public Optional<DashboardLayout> getDashboardById(Integer id) {
        return dashboardLayoutRepository.findById(id);
    }

    public DashboardLayout updateDashboard(Integer id, DashboardLayout dashboard) {
        DashboardLayout existing = dashboardLayoutRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Dashboard not found"));
        
        existing.setLayoutName(dashboard.getLayoutName());
        existing.setWidgets(dashboard.getWidgets());
        
        return dashboardLayoutRepository.save(existing);
    }

    public void deleteDashboard(Integer id) {
        dashboardLayoutRepository.deleteById(id);
    }

    public List<Map<String, Object>> getAvailableWidgets() {
        List<Map<String, Object>> widgets = new ArrayList<>();
        
        // Sales Performance Widgets
        widgets.add(createWidgetInfo("SalesFunnelWidget", "Sales Funnel", "Visual funnel showing lead to deal conversion", "sales"));
        widgets.add(createWidgetInfo("PipelineValueWidget", "Pipeline Value", "Total pipeline value by stage", "sales"));
        widgets.add(createWidgetInfo("MonthlyRevenueWidget", "Monthly Revenue", "Revenue trends over time", "sales"));
        widgets.add(createWidgetInfo("QuotaAttainmentWidget", "Quota Attainment", "Progress bars for team quotas", "sales"));
        widgets.add(createWidgetInfo("WinRateWidget", "Win Rate", "Win rate percentage with trend", "sales"));
        widgets.add(createWidgetInfo("TopDealsWidget", "Top Deals", "List of largest open deals", "sales"));
        
        // Activity Widgets
        widgets.add(createWidgetInfo("UpcomingTasksWidget", "Upcoming Tasks", "Task list with due dates", "activity"));
        widgets.add(createWidgetInfo("TodaysActivitiesWidget", "Today's Activities", "Calls, emails, meetings today", "activity"));
        widgets.add(createWidgetInfo("ActivityLeaderboardWidget", "Activity Leaderboard", "Top performers by activity count", "activity"));
        
        // Lead Management Widgets
        widgets.add(createWidgetInfo("LeadsBySourceWidget", "Leads by Source", "Pie chart of lead sources", "leads"));
        widgets.add(createWidgetInfo("LeadConversionWidget", "Lead Conversion", "Conversion rate by source", "leads"));
        widgets.add(createWidgetInfo("NewLeadsWidget", "New Leads", "Count of new leads this week/month", "leads"));
        
        // Customer Service Widgets
        widgets.add(createWidgetInfo("OpenCasesWidget", "Open Cases", "Cases by status", "service"));
        widgets.add(createWidgetInfo("SLAComplianceWidget", "SLA Compliance", "Gauge chart of SLA adherence", "service"));
        widgets.add(createWidgetInfo("CustomerSatisfactionWidget", "Customer Satisfaction", "Average CSAT score", "service"));
        
        // Team Performance Widgets
        widgets.add(createWidgetInfo("TeamLeaderboardWidget", "Team Leaderboard", "Sales by rep", "team"));
        widgets.add(createWidgetInfo("MyTeamPipelineWidget", "My Team Pipeline", "Pipeline for manager's team", "team"));
        
        return widgets;
    }

    private Map<String, Object> createWidgetInfo(String type, String name, String description, String category) {
        Map<String, Object> widget = new HashMap<>();
        widget.put("type", type);
        widget.put("name", name);
        widget.put("description", description);
        widget.put("category", category);
        widget.put("defaultSize", Map.of("w", 6, "h", 4));
        return widget;
    }

    public DashboardLayout cloneDashboard(Integer id, String newName, Integer userId) {
        DashboardLayout original = dashboardLayoutRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Dashboard not found"));
        
        Users user = usersRepository.findById(userId).orElseThrow();
        
        DashboardLayout cloned = new DashboardLayout();
        cloned.setLayoutName(newName);
        cloned.setUser(user);
        cloned.setWidgets(original.getWidgets());
        cloned.setIsDefault(false);
        
        return dashboardLayoutRepository.save(cloned);
    }
}

