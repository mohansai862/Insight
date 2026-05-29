package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.service.OverdueTaskNotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/overdue")
@CrossOrigin(origins = "*")
@Slf4j
public class OverdueTaskController {
    private static final Logger log = LoggerFactory.getLogger(OverdueTaskController.class);

    @Autowired
    private OverdueTaskNotificationService overdueTaskNotificationService;

    @PostMapping("/check")
    public ResponseEntity<String> checkOverdueTasks() {
        try {
            log.debug("Manual overdue task check triggered");
            overdueTaskNotificationService.checkOverdueTasks();
            return ResponseEntity.ok("Overdue task check completed successfully");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}