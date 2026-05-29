package com.techtammina.crm.controller;

import com.techtammina.crm.service.LeadReminderService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/lead-reminders")
public class LeadReminderController {

    private final LeadReminderService leadReminderService;

    public LeadReminderController(LeadReminderService leadReminderService) {
        this.leadReminderService = leadReminderService;
    }

    @PostMapping("/send-now")
    public ResponseEntity<String> sendRemindersNow() {
        try {
            leadReminderService.sendRemindersNow();
            return ResponseEntity.ok("Reminder emails sent successfully");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to send reminders: " + e.getMessage());
        }
    }
}

