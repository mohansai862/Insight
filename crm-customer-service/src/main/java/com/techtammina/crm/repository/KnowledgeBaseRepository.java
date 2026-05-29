package com.techtammina.crm.repository;

import com.techtammina.crm.entity.KnowledgeBase;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBase, Integer> {
    
    Page<KnowledgeBase> findByStatus(KnowledgeBase.Status status, Pageable pageable);
    
    List<KnowledgeBase> findByCategory(String category);
    
    @Query("SELECT kb FROM KnowledgeBase kb WHERE kb.status = 'Published' AND " +
           "(LOWER(kb.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(kb.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(kb.tags) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<KnowledgeBase> searchPublishedArticles(@Param("keyword") String keyword);
    
    @Query("SELECT DISTINCT kb.category FROM KnowledgeBase kb WHERE kb.category IS NOT NULL AND kb.status = 'Published'")
    List<String> findDistinctCategories();
    
    @Query("SELECT kb FROM KnowledgeBase kb WHERE kb.status = 'Published' ORDER BY kb.viewCount DESC")
    List<KnowledgeBase> findMostViewedArticles(Pageable pageable);
}

