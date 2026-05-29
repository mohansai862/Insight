package com.techtammina.crm.service;

import com.techtammina.crm.entity.EmailTemplate;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.EmailTemplateRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class EmailTemplateService {

    private final EmailTemplateRepository emailTemplateRepository;
    private final UsersRepository usersRepository;

    public EmailTemplateService(EmailTemplateRepository emailTemplateRepository, UsersRepository usersRepository) {
        this.emailTemplateRepository = emailTemplateRepository;
        this.usersRepository = usersRepository;
    }

    public List<EmailTemplate> getAllActiveTemplates() {
        return emailTemplateRepository.findActiveTemplates();
    }

    public Optional<EmailTemplate> getTemplateById(Integer id) {
        return emailTemplateRepository.findById(id);
    }

    public EmailTemplate createTemplate(EmailTemplate template, Integer userId) {
        Users user = usersRepository.findById(userId).orElseThrow();
        template.setCreatedBy(user);
        return emailTemplateRepository.save(template);
    }

    public EmailTemplate updateTemplate(Integer id, EmailTemplate template) {
        EmailTemplate existing = emailTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Template not found"));
        
        existing.setTemplateName(template.getTemplateName());
        existing.setSubject(template.getSubject());
        existing.setBody(template.getBody());
        existing.setPlaceholders(template.getPlaceholders());
        existing.setTemplateType(template.getTemplateType());
        
        return emailTemplateRepository.save(existing);
    }

    public void deleteTemplate(Integer id) {
        EmailTemplate template = emailTemplateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Template not found"));
        template.setIsActive(false);
        emailTemplateRepository.save(template);
    }

    public List<EmailTemplate> getTemplatesByType(String templateType) {
        return emailTemplateRepository.findByTemplateTypeAndActive(templateType);
    }

    public List<String> getPlaceholdersForEntity(String entityType) {
        List<String> placeholders = new ArrayList<>();
        
        switch (entityType.toLowerCase()) {
            case "lead":
                placeholders.addAll(Arrays.asList(
                    "{{firstName}}", "{{lastName}}", "{{email}}", "{{phone}}", 
                    "{{company}}", "{{status}}", "{{source}}", "{{assignedTo}}"
                ));
                break;
            case "contact":
                placeholders.addAll(Arrays.asList(
                    "{{firstName}}", "{{lastName}}", "{{email}}", "{{phone}}", 
                    "{{title}}", "{{department}}", "{{accountName}}"
                ));
                break;
            case "deal":
                placeholders.addAll(Arrays.asList(
                    "{{dealName}}", "{{dealValue}}", "{{stage}}", "{{closeDate}}", 
                    "{{probability}}", "{{accountName}}", "{{ownerName}}"
                ));
                break;
            case "case":
                placeholders.addAll(Arrays.asList(
                    "{{caseNumber}}", "{{subject}}", "{{status}}", "{{priority}}", 
                    "{{customerName}}", "{{assignedTo}}", "{{createdDate}}"
                ));
                break;
            case "task":
                placeholders.addAll(Arrays.asList(
                    "{{subject}}", "{{description}}", "{{status}}", "{{priority}}", 
                    "{{dueDate}}", "{{assignedTo}}", "{{relatedTo}}"
                ));
                break;
            default:
                placeholders.addAll(Arrays.asList(
                    "{{id}}", "{{name}}", "{{createdDate}}", "{{modifiedDate}}"
                ));
        }
        
        return placeholders;
    }
}

