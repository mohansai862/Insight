package com.techtammina.crm.controller;

import com.techtammina.crm.service.TaskSchedulerService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/scheduler")
@CrossOrigin(origins = "*")
public class TaskSchedulerController {

    @Autowired
    private TaskSchedulerService taskSchedulerService;

    @PostMapping("/check-overdue")
    public ResponseEntity<String> checkOverdueTasks() {
        try {
            taskSchedulerService.checkOverdueTasks();
            return ResponseEntity.ok("Overdue task check completed successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/debug-tasks")
    public ResponseEntity<String> debugTasks() {
        try {
            String result = taskSchedulerService.debugTasks();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
    
    @GetMapping("/current-tasks")
    public ResponseEntity<String> getCurrentTasks() {
        try {
            String result = taskSchedulerService.getCurrentTasksStatus();
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }
}

