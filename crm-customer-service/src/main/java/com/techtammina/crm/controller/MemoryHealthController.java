package com.techtammina.crm.controller;

import com.techtammina.crm.service.MemoryMonitoringService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controller for memory health monitoring endpoints
 */
@RestController
@RequestMapping("/api/health/memory")
public class MemoryHealthController {
    
    private static final Logger log = LoggerFactory.getLogger(MemoryHealthController.class);
    
    private final MemoryMonitoringService memoryMonitoringService;
    
    public MemoryHealthController(MemoryMonitoringService memoryMonitoringService) {
        this.memoryMonitoringService = memoryMonitoringService;
    }
    
    /**
     * Get current memory status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getMemoryStatus() {
        try {
            MemoryMonitoringService.MemoryStatus status = memoryMonitoringService.getCurrentMemoryStatus();
            
            Map<String, Object> response = new HashMap<>();
            response.put("heapUsed", status.getHeapUsedMB() + " MB");
            response.put("heapMax", status.getHeapMaxMB() + " MB");
            response.put("heapUsagePercent", String.format("%.1f%%", status.getHeapUsagePercent()));
            response.put("nonHeapUsed", status.getNonHeapUsedMB() + " MB");
            response.put("nonHeapMax", status.getNonHeapMaxMB() + " MB");
            response.put("nonHeapUsagePercent", String.format("%.1f%%", status.getNonHeapUsagePercent()));
            response.put("status", status.isCritical() ? "CRITICAL" : status.isHigh() ? "HIGH" : "NORMAL");
            response.put("timestamp", System.currentTimeMillis());
            
            // Add available processors
            response.put("availableProcessors", Runtime.getRuntime().availableProcessors());
            
            log.debug("Memory status requested - Heap: {:.1f}%, Status: {}", 
                    status.getHeapUsagePercent(), 
                    status.isCritical() ? "CRITICAL" : status.isHigh() ? "HIGH" : "NORMAL");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting memory status", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to get memory status");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * Force garbage collection (use with caution)
     */
    @PostMapping("/gc")
    public ResponseEntity<Map<String, Object>> forceGarbageCollection(@RequestParam(required = false) String reason) {
        try {
            String gcReason = reason != null ? reason : "Manual request via API";
            
            MemoryMonitoringService.MemoryStatus beforeStatus = memoryMonitoringService.getCurrentMemoryStatus();
            
            memoryMonitoringService.forceGarbageCollection(gcReason);
            
            // Wait a moment for GC to complete
            Thread.sleep(2000);
            
            MemoryMonitoringService.MemoryStatus afterStatus = memoryMonitoringService.getCurrentMemoryStatus();
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Garbage collection completed");
            response.put("reason", gcReason);
            response.put("beforeGC", Map.of(
                    "heapUsed", beforeStatus.getHeapUsedMB() + " MB",
                    "heapUsagePercent", String.format("%.1f%%", beforeStatus.getHeapUsagePercent())
            ));
            response.put("afterGC", Map.of(
                    "heapUsed", afterStatus.getHeapUsedMB() + " MB",
                    "heapUsagePercent", String.format("%.1f%%", afterStatus.getHeapUsagePercent())
            ));
            response.put("memoryFreed", (beforeStatus.getHeapUsedMB() - afterStatus.getHeapUsedMB()) + " MB");
            response.put("timestamp", System.currentTimeMillis());
            
            log.info("Manual garbage collection completed - Freed: {} MB", 
                    beforeStatus.getHeapUsedMB() - afterStatus.getHeapUsedMB());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during manual garbage collection", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to perform garbage collection");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
    
    /**
     * Get memory health check
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getMemoryHealth() {
        try {
            MemoryMonitoringService.MemoryStatus status = memoryMonitoringService.getCurrentMemoryStatus();
            
            Map<String, Object> response = new HashMap<>();
            response.put("status", status.isCritical() ? "DOWN" : "UP");
            response.put("heapUsagePercent", status.getHeapUsagePercent());
            response.put("details", Map.of(
                    "heapUsed", status.getHeapUsedMB(),
                    "heapMax", status.getHeapMaxMB(),
                    "heapUsagePercent", status.getHeapUsagePercent(),
                    "isCritical", status.isCritical(),
                    "isHigh", status.isHigh()
            ));
            
            if (status.isCritical()) {
                return ResponseEntity.status(503).body(response); // Service Unavailable
            } else if (status.isHigh()) {
                return ResponseEntity.status(200).body(response); // OK but warning
            } else {
                return ResponseEntity.ok(response);
            }
            
        } catch (Exception e) {
            log.error("Error checking memory health", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "DOWN");
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(503).body(errorResponse);
        }
    }
}