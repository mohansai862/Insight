package com.techtammina.crm.repository;

import com.techtammina.crm.entity.CaseComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CaseCommentRepository extends JpaRepository<CaseComment, Integer> {
    
    @Query("SELECT cc FROM CaseComment cc WHERE cc.caseEntity.caseId = :caseId ORDER BY cc.createdDate ASC")
    List<CaseComment> findByCaseIdOrderByCreatedDate(@Param("caseId") Integer caseId);
    
    @Query("SELECT cc FROM CaseComment cc WHERE cc.caseEntity.caseId = :caseId AND cc.isInternal = false ORDER BY cc.createdDate ASC")
    List<CaseComment> findPublicCommentsByCaseId(@Param("caseId") Integer caseId);
}

