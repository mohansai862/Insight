package com.techtammina.crm.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.extern.slf4j.Slf4j;

import com.techtammina.crm.service.DatabaseHealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/database-health")
@Slf4j
public class DatabaseHealthController {

    private static final Logger log = LoggerFactory.getLogger(DatabaseHealthController.class);
    
    @Autowired
    private DatabaseHealthService databaseHealthService;
    
    /**
     * Get database health status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        try {
            log.info("Ã°Å¸â€œÅ  Database health status requested");
            Map<String, Object> status = databaseHealthService.getDatabaseHealthStatus();
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            log.error("Ã¢ÂÅ’ Failed to get database health status", e);
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Failed to get database health status: " + e.getMessage()));
        }
    }
    
    /**
     * Fix auto-increment sequences
     */
    @PostMapping("/fix-sequences")
    public ResponseEntity<Map<String, Object>> fixAutoIncrementSequences() {
        try {
            log.info("Ã°Å¸â€Â§ Auto-increment sequence fix requested");
            databaseHealthService.checkAndFixAutoIncrementSequences();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Auto-increment sequences fixed successfully"
            ));
        } catch (Exception e) {
            log.error("Ã¢ÂÅ’ Failed to fix auto-increment sequences", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "error", "Failed to fix auto-increment sequences: " + e.getMessage()
                ));
        }
    }
    
    /**
     * Clean up orphaned records
     */
    @PostMapping("/cleanup-orphaned")
    public ResponseEntity<Map<String, Object>> cleanupOrphanedRecords() {
        try {
            log.info("Ã°Å¸Â§Â¹ Orphaned records cleanup requested");
            databaseHealthService.cleanupOrphanedRecords();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Orphaned records cleaned up successfully"
            ));
        } catch (Exception e) {
            log.error("Ã¢ÂÅ’ Failed to cleanup orphaned records", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "error", "Failed to cleanup orphaned records: " + e.getMessage()
                ));
        }
    }
    
    /**
     * Comprehensive database health check and fix
     */
    @PostMapping("/full-health-check")
    public ResponseEntity<Map<String, Object>> fullHealthCheck() {
        try {
            log.info("Ã°Å¸ÂÂ¥ Full database health check requested");
            
            // Get initial status
            Map<String, Object> initialStatus = databaseHealthService.getDatabaseHealthStatus();
            
            // Fix sequences
            databaseHealthService.checkAndFixAutoIncrementSequences();
            
            // Cleanup orphaned records
            databaseHealthService.cleanupOrphanedRecords();
            
            // Get final status
            Map<String, Object> finalStatus = databaseHealthService.getDatabaseHealthStatus();
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Full database health check completed successfully",
                "initialStatus", initialStatus,
                "finalStatus", finalStatus
            ));
        } catch (Exception e) {
            log.error("Ã¢ÂÅ’ Failed to perform full health check", e);
            return ResponseEntity.internalServerError()
                .body(Map.of(
                    "success", false,
                    "error", "Failed to perform full health check: " + e.getMessage()
                ));
        }
    }
}


