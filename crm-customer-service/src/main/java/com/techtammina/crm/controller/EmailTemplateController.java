package com.techtammina.crm.controller;

import com.techtammina.crm.entity.EmailTemplate;
import com.techtammina.crm.service.EmailService;
import com.techtammina.crm.service.EmailTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/email-templates")
public class EmailTemplateController {

    private final EmailTemplateService emailTemplateService;
    private final EmailService emailService;

    public EmailTemplateController(EmailTemplateService emailTemplateService, EmailService emailService) {
        this.emailTemplateService = emailTemplateService;
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<List<EmailTemplate>> getAllTemplates() {
        List<EmailTemplate> templates = emailTemplateService.getAllActiveTemplates();
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/{id}")
    public ResponseEntity<EmailTemplate> getTemplateById(@PathVariable Integer id) {
        return emailTemplateService.getTemplateById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<EmailTemplate> createTemplate(@RequestBody EmailTemplate template,
                                                       @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        EmailTemplate created = emailTemplateService.createTemplate(template, userId);
        return ResponseEntity.ok(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<EmailTemplate> updateTemplate(@PathVariable Integer id,
                                                       @RequestBody EmailTemplate template) {
        EmailTemplate updated = emailTemplateService.updateTemplate(id, template);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTemplate(@PathVariable Integer id) {
        emailTemplateService.deleteTemplate(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/preview")
    public ResponseEntity<String> previewTemplate(@PathVariable Integer id,
                                                 @RequestBody Map<String, Object> mergeFields) {
        String preview = emailService.previewTemplate(id, mergeFields);
        return ResponseEntity.ok(preview);
    }

    @GetMapping("/placeholders/{entityType}")
    public ResponseEntity<List<String>> getPlaceholders(@PathVariable String entityType) {
        List<String> placeholders = emailTemplateService.getPlaceholdersForEntity(entityType);
        return ResponseEntity.ok(placeholders);
    }

    @GetMapping("/types/{templateType}")
    public ResponseEntity<List<EmailTemplate>> getTemplatesByType(@PathVariable String templateType) {
        List<EmailTemplate> templates = emailTemplateService.getTemplatesByType(templateType);
        return ResponseEntity.ok(templates);
    }
}

