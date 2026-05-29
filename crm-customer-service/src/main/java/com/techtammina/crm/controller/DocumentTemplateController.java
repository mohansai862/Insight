package com.techtammina.crm.controller;

import com.techtammina.crm.entity.DocumentTemplate;
import com.techtammina.crm.service.DocumentTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/templates")
public class DocumentTemplateController {

    private final DocumentTemplateService templateService;

    public DocumentTemplateController(DocumentTemplateService templateService) {
        this.templateService = templateService;
    }

    @GetMapping
    public ResponseEntity<List<DocumentTemplate>> getAllTemplates() {
        List<DocumentTemplate> templates = templateService.getAllActiveTemplates();
        return ResponseEntity.ok(templates);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentTemplate> getTemplateById(@PathVariable Integer id) {
        return templateService.getTemplateById(id)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<DocumentTemplate> createTemplate(@RequestBody DocumentTemplate template,
                                                          @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) userId = 1;
        DocumentTemplate created = templateService.createTemplate(template, userId);
        return ResponseEntity.ok(created);
    }

    @GetMapping("/type/{templateType}")
    public ResponseEntity<List<DocumentTemplate>> getTemplatesByType(@PathVariable String templateType) {
        DocumentTemplate.TemplateType type = DocumentTemplate.TemplateType.valueOf(templateType);
        List<DocumentTemplate> templates = templateService.getTemplatesByType(type);
        return ResponseEntity.ok(templates);
    }

    @PostMapping("/{id}/generate")
    public ResponseEntity<String> generateDocumentFromTemplate(@PathVariable Integer id,
                                                              @RequestBody Object templateData) {
        String result = templateService.generateDocumentFromTemplate(id, templateData);
        return ResponseEntity.ok(result);
    }
}

