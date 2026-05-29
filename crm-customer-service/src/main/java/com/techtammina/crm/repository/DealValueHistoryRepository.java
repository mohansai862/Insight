package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DealValueHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface DealValueHistoryRepository extends JpaRepository<DealValueHistory, Long> {
    
    List<DealValueHistory> findByDealIdOrderByChangedAtAsc(Integer dealId);
    
    @Query("SELECT dvh FROM DealValueHistory dvh WHERE dvh.dealId = :dealId AND dvh.changeType = 'CREATION'")
    Optional<DealValueHistory> findOriginalValueByDealId(@Param("dealId") Integer dealId);
    
    @Query("SELECT dvh FROM DealValueHistory dvh WHERE dvh.dealId = :dealId AND dvh.changeType = 'UPDATE' ORDER BY dvh.changedAt DESC")
    List<DealValueHistory> findValueUpdatesByDealId(@Param("dealId") Integer dealId);
}