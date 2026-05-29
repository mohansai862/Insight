package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Document;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Integer> {
    
    Page<Document> findByIsActiveTrueAndIsLatestVersionTrue(Pageable pageable);
    
    List<Document> findByUploadedByUserIdAndIsActiveTrueAndIsLatestVersionTrue(Integer userId);
    
    List<Document> findByCategoryAndIsActiveTrueAndIsLatestVersionTrue(String category);
    
    Page<Document> findByCategoryAndIsActiveTrueAndIsLatestVersionTrue(String category, Pageable pageable);
    
    @Query("SELECT d FROM Document d WHERE d.isActive = true AND d.isLatestVersion = true AND " +
           "(LOWER(d.documentName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(d.tags) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Document> searchDocuments(@Param("keyword") String keyword);
    
    @Query("SELECT d FROM Document d JOIN d.relationships r WHERE r.relatedEntityType = :entityType AND r.relatedEntityId = :entityId AND d.isActive = true")
    List<Document> findByRelatedEntity(@Param("entityType") String entityType, @Param("entityId") Integer entityId);
    
    List<Document> findByParentDocumentDocumentIdOrderByVersionDesc(Integer parentDocumentId);
    
    @Query("SELECT DISTINCT d.category FROM Document d WHERE d.category IS NOT NULL AND d.isActive = true")
    List<String> findDistinctCategories();
}

