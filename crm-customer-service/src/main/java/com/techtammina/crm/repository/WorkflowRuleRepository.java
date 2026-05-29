package com.techtammina.crm.repository;

import com.techtammina.crm.entity.WorkflowRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WorkflowRuleRepository extends JpaRepository<WorkflowRule, Integer> {
    
    @Query("SELECT wr FROM WorkflowRule wr WHERE wr.isActive = true AND wr.entityType = :entityType AND wr.triggerType = :triggerType ORDER BY wr.executionOrder")
    List<WorkflowRule> findActiveWorkflowsByEntityAndTrigger(WorkflowRule.EntityType entityType, WorkflowRule.TriggerType triggerType);
    
    @Query("SELECT wr FROM WorkflowRule wr WHERE wr.isActive = true")
    List<WorkflowRule> findActiveWorkflows();
    
    @Query("SELECT wr FROM WorkflowRule wr WHERE wr.entityType = :entityType")
    List<WorkflowRule> findByEntityType(WorkflowRule.EntityType entityType);
}

