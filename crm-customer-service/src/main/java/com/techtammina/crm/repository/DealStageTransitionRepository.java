package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DealStageTransition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealStageTransitionRepository extends JpaRepository<DealStageTransition, Long> {
    
    @Query("SELECT dst FROM DealStageTransition dst WHERE dst.deal.dealId = :dealId ORDER BY dst.changedAt DESC")
    List<DealStageTransition> findByDealIdOrderByTimestampDesc(@Param("dealId") Integer dealId);
    
    @Query("SELECT dst FROM DealStageTransition dst WHERE dst.deal.dealId = :dealId AND dst.isDirectJump = true ORDER BY dst.changedAt DESC")
    List<DealStageTransition> findDirectJumpsByDealId(@Param("dealId") Integer dealId);
}