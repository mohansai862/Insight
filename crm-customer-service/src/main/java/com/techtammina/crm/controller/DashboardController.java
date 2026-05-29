package com.techtammina.crm.controller;

import com.techtammina.crm.entity.DashboardLayout;
import com.techtammina.crm.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboards")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    @PostMapping
    public ResponseEntity<DashboardLayout> createDashboard(@RequestBody DashboardLayout dashboard,
                                                          @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        DashboardLayout created = dashboardService.createDashboard(dashboard, userId);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<List<DashboardLayout>> getAllDashboards(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        List<DashboardLayout> dashboards = dashboardService.getUserDashboards(userId, userRole);
        return ResponseEntity.ok(dashboards);
    }

    @GetMapping("/default")
    public ResponseEntity<DashboardLayout> getDefaultDashboard(
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (userRole == null) userRole = "Sales_Manager";
        
        return dashboardService.getDefaultDashboard(userRole)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DashboardLayout> getDashboardById(@PathVariable Integer id) {
        return dashboardService.getDashboardById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<DashboardLayout> updateDashboard(@PathVariable Integer id,
                                                          @RequestBody DashboardLayout dashboard) {
        DashboardLayout updated = dashboardService.updateDashboard(id, dashboard);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDashboard(@PathVariable Integer id) {
        dashboardService.deleteDashboard(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/widgets")
    public ResponseEntity<List<Map<String, Object>>> getAvailableWidgets() {
        List<Map<String, Object>> widgets = dashboardService.getAvailableWidgets();
        return ResponseEntity.ok(widgets);
    }

    @PostMapping("/{id}/clone")
    public ResponseEntity<DashboardLayout> cloneDashboard(@PathVariable Integer id,
                                                         @RequestParam String newName,
                                                         @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        DashboardLayout cloned = dashboardService.cloneDashboard(id, newName, userId);
        return ResponseEntity.ok(cloned);
    }
}

