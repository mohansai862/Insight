package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Case;
import com.techtammina.crm.entity.SLA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SLARepository extends JpaRepository<SLA, Integer> {
    
    List<SLA> findByIsActiveTrue();
    
    Optional<SLA> findByPriorityAndIsActiveTrue(Case.Priority priority);
}

