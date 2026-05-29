package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Case;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CaseRepository extends JpaRepository<Case, Integer> {
    
    Page<Case> findByStatus(Case.Status status, Pageable pageable);
    
    Page<Case> findByPriority(Case.Priority priority, Pageable pageable);
    
    Page<Case> findByAssignedToUserId(Integer userId, Pageable pageable);
    
    List<Case> findByAccountAccountId(Integer accountId);
    
    @Query("SELECT c FROM Case c WHERE c.assignedTo.userId = :userId AND c.status NOT IN ('Closed', 'Resolved')")
    List<Case> findOpenCasesByAssignee(@Param("userId") Integer userId);
    
    @Query("SELECT COUNT(c) FROM Case c WHERE c.status = :status")
    Long countByStatus(@Param("status") Case.Status status);
    
    @Query("SELECT c FROM Case c WHERE c.caseNumber LIKE :prefix%")
    List<Case> findByCaseNumberPrefix(@Param("prefix") String prefix);
    
    @Query("SELECT COUNT(c) FROM Case c WHERE c.caseNumber LIKE :prefix%")
    Long countByCaseNumberPrefix(@Param("prefix") String prefix);
    
    // ADD THIS NEW METHOD
    /**
     * Find the maximum case number for a given prefix (month)
     * Returns the highest case number starting with the given prefix
     */
    @Query("SELECT c.caseNumber FROM Case c WHERE c.caseNumber LIKE CONCAT(:prefix, '%') ORDER BY c.caseNumber DESC")
    String findMaxCaseNumberForMonth(@Param("prefix") String prefix);
    
    // ADD THIS NEW METHOD TOO
    Optional<Case> findByCaseNumber(String caseNumber);
}

