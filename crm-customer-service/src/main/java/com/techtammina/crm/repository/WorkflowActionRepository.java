package com.techtammina.crm.repository;

import com.techtammina.crm.entity.WorkflowAction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WorkflowActionRepository extends JpaRepository<WorkflowAction, Integer> {
    
    @Query("SELECT wa FROM WorkflowAction wa WHERE wa.workflowRule.ruleId = :ruleId ORDER BY wa.actionSequence")
    List<WorkflowAction> findByRuleIdOrderBySequence(Integer ruleId);
}

