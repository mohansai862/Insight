package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DocumentRelationship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRelationshipRepository extends JpaRepository<DocumentRelationship, Integer> {
    
    List<DocumentRelationship> findByRelatedEntityTypeAndRelatedEntityId(
        DocumentRelationship.EntityType entityType, Integer entityId);
    
    List<DocumentRelationship> findByDocumentDocumentId(Integer documentId);
    
    void deleteByDocumentDocumentIdAndRelatedEntityTypeAndRelatedEntityId(
        Integer documentId, DocumentRelationship.EntityType entityType, Integer entityId);
}

