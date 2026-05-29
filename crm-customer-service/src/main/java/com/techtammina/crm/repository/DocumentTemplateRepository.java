package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DocumentTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DocumentTemplateRepository extends JpaRepository<DocumentTemplate, Integer> {
    
    @Query("SELECT dt FROM DocumentTemplate dt WHERE dt.isActive = true")
    List<DocumentTemplate> findActiveTemplates();
    
    @Query("SELECT dt FROM DocumentTemplate dt WHERE dt.templateType = :templateType AND dt.isActive = true")
    List<DocumentTemplate> findByTemplateTypeAndActive(DocumentTemplate.TemplateType templateType);
}

