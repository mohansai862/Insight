package com.techtammina.crm.repository;

import com.techtammina.crm.entity.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, Integer> {
    
    List<CallLog> findByLeadIdOrderByCreatedAtDesc(Integer leadId);
    
    List<CallLog> findByDealIdOrderByCreatedAtDesc(Integer dealId);
    
    List<CallLog> findByContactPhoneOrderByCreatedAtDesc(String contactPhone);
    
    @Query("SELECT c FROM CallLog c WHERE c.salesExecutive.userId = :userId ORDER BY c.createdAt DESC")
    List<CallLog> findBySalesExecutiveUserIdOrderByCreatedAtDesc(@Param("userId") Integer userId);
    
    @Query("SELECT c FROM CallLog c WHERE c.callStartTime BETWEEN :startDate AND :endDate ORDER BY c.createdAt DESC")
    List<CallLog> findByDateRangeOrderByCreatedAtDesc(@Param("startDate") LocalDateTime startDate, 
                                                      @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT COUNT(c) FROM CallLog c WHERE c.callStatus = 'COMPLETED' AND c.salesExecutive.userId = :userId")
    Long countSuccessfulCallsByUser(@Param("userId") Integer userId);
}

