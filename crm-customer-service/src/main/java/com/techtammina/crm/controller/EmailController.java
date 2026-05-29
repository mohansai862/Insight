package com.techtammina.crm.controller;

import com.techtammina.crm.entity.Email;
import com.techtammina.crm.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/emails")
public class EmailController {

    @Autowired
    private EmailService emailService;

    @PostMapping("/send")
    public ResponseEntity<Email> sendEmail(@RequestBody Email email) {
        Email sentEmail = emailService.sendEmail(email);
        return ResponseEntity.ok(sentEmail);
    }

    @GetMapping("/entity/{entityType}/{entityId}")
    public ResponseEntity<List<Email>> getEmailsByEntity(
            @PathVariable String entityType,
            @PathVariable Integer entityId) {
        List<Email> emails = emailService.getEmailsByEntity(entityType, entityId);
        return ResponseEntity.ok(emails);
    }

    @GetMapping("/thread/{threadId}")
    public ResponseEntity<List<Email>> getEmailThread(@PathVariable String threadId) {
        List<Email> emails = emailService.getEmailThread(threadId);
        return ResponseEntity.ok(emails);
    }

    @PostMapping("/track/{trackingCode}")
    public ResponseEntity<Void> trackEmailOpen(@PathVariable String trackingCode) {
        emailService.trackEmailOpen(trackingCode);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/draft")
    public ResponseEntity<Email> saveDraft(@RequestBody Email email) {
        Email savedDraft = emailService.saveDraft(email);
        return ResponseEntity.ok(savedDraft);
    }

    @GetMapping
    public ResponseEntity<java.util.Map<String, Object>> getEmails(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(java.util.Map.of(
            "content", java.util.Collections.emptyList(),
            "totalElements", 0,
            "totalPages", 0,
            "size", size,
            "number", page
        ));
    }
}

