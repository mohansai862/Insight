package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DocumentVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentVersionRepository extends JpaRepository<DocumentVersion, Integer> {
    
    List<DocumentVersion> findByDocumentDocumentIdOrderByVersionNumberDesc(Integer documentId);
    
    DocumentVersion findByDocumentDocumentIdAndVersionNumber(Integer documentId, Integer versionNumber);
}

