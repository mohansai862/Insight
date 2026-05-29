package com.techtammina.crm.repository;

import com.techtammina.crm.entity.WorkflowExecutionLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WorkflowExecutionLogRepository extends JpaRepository<WorkflowExecutionLog, Integer> {
    
    @Query("SELECT wel FROM WorkflowExecutionLog wel ORDER BY wel.executedDate DESC")
    Page<WorkflowExecutionLog> findAllOrderByExecutedDateDesc(Pageable pageable);
    
    @Query("SELECT wel FROM WorkflowExecutionLog wel WHERE wel.workflowRule.ruleId = :ruleId ORDER BY wel.executedDate DESC")
    List<WorkflowExecutionLog> findByRuleIdOrderByExecutedDateDesc(Integer ruleId);
    
    @Query("SELECT wel FROM WorkflowExecutionLog wel WHERE wel.entityType = :entityType AND wel.entityId = :entityId")
    List<WorkflowExecutionLog> findByEntityTypeAndEntityId(String entityType, Integer entityId);
}

