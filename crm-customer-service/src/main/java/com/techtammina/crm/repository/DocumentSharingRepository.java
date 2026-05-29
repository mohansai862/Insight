package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DocumentSharing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentSharingRepository extends JpaRepository<DocumentSharing, Integer> {
    
    List<DocumentSharing> findByDocumentDocumentId(Integer documentId);
    
    List<DocumentSharing> findBySharedWithUserId(Integer userId);
    
    List<DocumentSharing> findBySharedByUserId(Integer userId);
}

