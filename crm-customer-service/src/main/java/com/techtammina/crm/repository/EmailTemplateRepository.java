package com.techtammina.crm.repository;

import com.techtammina.crm.entity.EmailTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EmailTemplateRepository extends JpaRepository<EmailTemplate, Integer> {
    
    @Query("SELECT et FROM EmailTemplate et WHERE et.isActive = true")
    List<EmailTemplate> findActiveTemplates();
    
    @Query("SELECT et FROM EmailTemplate et WHERE et.templateType = :templateType AND et.isActive = true")
    List<EmailTemplate> findByTemplateTypeAndActive(String templateType);
}

