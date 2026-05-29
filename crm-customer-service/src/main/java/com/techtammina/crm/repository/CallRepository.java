package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Call;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CallRepository extends JpaRepository<Call, Integer> {
    
    @Query("SELECT c FROM Call c ORDER BY c.createdAt DESC")
    List<Call> findAllOrderByCreatedAtDesc();
    
    List<Call> findBySalesExecutiveIdOrderByCreatedAtDesc(Integer salesExecutiveId);
    
    List<Call> findByLeadIdOrderByCreatedAtDesc(Integer leadId);
    
    List<Call> findByDealIdOrderByCreatedAtDesc(Integer dealId);
}

