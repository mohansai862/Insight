package com.techtammina.crm.service;

import com.techtammina.crm.entity.DocumentTemplate;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.DocumentTemplateRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class DocumentTemplateService {

    private final DocumentTemplateRepository templateRepository;
    private final UsersRepository usersRepository;

    public DocumentTemplateService(DocumentTemplateRepository templateRepository, UsersRepository usersRepository) {
        this.templateRepository = templateRepository;
        this.usersRepository = usersRepository;
    }

    public List<DocumentTemplate> getAllActiveTemplates() {
        return templateRepository.findActiveTemplates();
    }

    public Optional<DocumentTemplate> getTemplateById(Integer templateId) {
        return templateRepository.findById(templateId);
    }

    public DocumentTemplate createTemplate(DocumentTemplate template, Integer userId) {
        Users user = usersRepository.findById(userId).orElseThrow();
        template.setCreatedBy(user);
        return templateRepository.save(template);
    }

    public List<DocumentTemplate> getTemplatesByType(DocumentTemplate.TemplateType templateType) {
        return templateRepository.findByTemplateTypeAndActive(templateType);
    }

    public String generateDocumentFromTemplate(Integer templateId, Object templateData) {
        DocumentTemplate template = templateRepository.findById(templateId)
            .orElseThrow(() -> new RuntimeException("Template not found"));
        
        // Placeholder for template generation logic
        // In a real implementation, this would process the template with the provided data
        return "Document generated from template: " + template.getTemplateName();
    }
}

