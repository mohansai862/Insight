package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface DealRepository extends JpaRepository<Deal, Integer> {

    @Override
    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.account a LEFT JOIN FETCH d.contact c LEFT JOIN FETCH d.createdBy u")
    List<Deal> findAll();

    @Query("SELECT d FROM Deal d LEFT JOIN FETCH d.account a LEFT JOIN FETCH d.contact c LEFT JOIN FETCH d.createdBy u WHERE d.dealId = :id")
    Optional<Deal> findByIdWithRelations(@Param("id") Integer id);

    // Count deals by stage
    @Query(value = "SELECT COALESCE(NULLIF(stage, ''), 'Unknown') as stage, COUNT(*) FROM deals GROUP BY COALESCE(NULLIF(stage, ''), 'Unknown')", nativeQuery = true)
    List<Object[]> countDealsByStage();

    // Count total deals
    long count();

    // Count won deals
    @Query(value = "SELECT COUNT(*) FROM deals WHERE stage = 'Closed_Won'", nativeQuery = true)
    long countWonDeals();

    // Count lost deals
    @Query(value = "SELECT COUNT(*) FROM deals WHERE stage = 'Closed_Lost'", nativeQuery = true)
    long countLostDeals();

    // Sum total value
    @Query(value = "SELECT SUM(deal_value) FROM deals", nativeQuery = true)
    BigDecimal sumTotalValue();
    
    // Sum only Closed_Won deal values for revenue calculation
    @Query(value = "SELECT SUM(deal_value) FROM deals WHERE stage = 'Closed_Won'", nativeQuery = true)
    BigDecimal sumClosedWonValue();

    // Find by account id
    List<Deal> findByAccount_AccountId(Integer accountId);

    // Find by contact id
    List<Deal> findByContact_ContactId(Integer contactId);

    // Find by deal name containing ignore case
    List<Deal> findByDealNameContainingIgnoreCase(String dealName);

    // Find first by account and contact
    Optional<Deal> findFirstByAccount_AccountIdAndContact_ContactId(Integer accountId, Integer contactId);

    // Find first by account, contact, and deal name
    Optional<Deal> findFirstByAccount_AccountIdAndContact_ContactIdAndDealNameIgnoreCase(Integer accountId, Integer contactId, String dealName);

    // Optional: Filter by date range if needed
    List<Deal> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);
    
    // Manager filtering - deals created by executives under a manager
    @Query("SELECT d FROM Deal d WHERE d.createdBy.managerId = :managerId")
    List<Deal> findByManagerId(@Param("managerId") Integer managerId);
    
    @Query("SELECT d FROM Deal d WHERE d.createdBy.managerId = :managerId AND d.dealName LIKE %:search%")
    List<Deal> findByManagerIdAndSearch(@Param("managerId") Integer managerId, @Param("search") String search);
    
    // Manager analytics queries
    @Query(value = "SELECT COALESCE(NULLIF(stage, ''), 'Unknown') as stage, COUNT(*) FROM deals WHERE created_by IN (SELECT user_id FROM users WHERE manager_id = :managerId) GROUP BY COALESCE(NULLIF(stage, ''), 'Unknown')", nativeQuery = true)
    List<Object[]> countDealsByStageForManager(@Param("managerId") Integer managerId);
    
    @Query(value = "SELECT SUM(deal_value) FROM deals WHERE created_by IN (SELECT user_id FROM users WHERE manager_id = :managerId)", nativeQuery = true)
    BigDecimal sumTotalValueForManager(@Param("managerId") Integer managerId);
    
    @Query(value = "SELECT COUNT(*) FROM deals WHERE stage = 'Closed_Won' AND created_by IN (SELECT user_id FROM users WHERE manager_id = :managerId)", nativeQuery = true)
    long countWonDealsForManager(@Param("managerId") Integer managerId);
    
    @Query(value = "SELECT COUNT(*) FROM deals WHERE created_by IN (SELECT user_id FROM users WHERE manager_id = :managerId)", nativeQuery = true)
    long countTotalDealsForManager(@Param("managerId") Integer managerId);
    
    // Sales Executive specific queries
    List<Deal> findByCreatedBy(com.techtammina.crm.entity.Users createdBy);
    List<Deal> findByReassignTo(com.techtammina.crm.entity.Users reassignTo);
    
    long countByCreatedBy(com.techtammina.crm.entity.Users createdBy);
    
    @Query("SELECT SUM(d.dealValue) FROM Deal d WHERE d.createdBy = :createdBy")
    BigDecimal sumValueByCreatedBy(@Param("createdBy") com.techtammina.crm.entity.Users createdBy);
    
    // VP specific queries - deals created by executives under VP's managers
    // Updated to consider both createdBy and reassignTo fields for proper deal attribution
    @Query("SELECT d FROM Deal d WHERE (d.createdBy.userId IN :executiveIds OR d.reassignTo.userId IN :executiveIds) AND (:q IS NULL OR d.dealName LIKE %:q%)")
    List<Deal> findDealsForExecutives(@Param("q") String q, @Param("executiveIds") List<Integer> executiveIds);
    
    @Query("SELECT COUNT(d) FROM Deal d WHERE (d.createdBy.userId IN :executiveIds OR d.reassignTo.userId IN :executiveIds)")
    long countDealsForExecutives(@Param("executiveIds") List<Integer> executiveIds);
    
    @Query(value = "SELECT COALESCE(NULLIF(stage, ''), 'Unknown') as stage, COUNT(*) FROM deals WHERE (created_by IN :executiveIds OR reassign_to IN :executiveIds) GROUP BY COALESCE(NULLIF(stage, ''), 'Unknown')", nativeQuery = true)
    List<Object[]> countDealsByStageForVP(@Param("executiveIds") List<Integer> executiveIds);
    
    @Query(value = "SELECT SUM(deal_value) FROM deals WHERE (created_by IN :executiveIds OR reassign_to IN :executiveIds)", nativeQuery = true)
    BigDecimal sumTotalValueForVP(@Param("executiveIds") List<Integer> executiveIds);
    
    @Query(value = "SELECT COUNT(*) FROM deals WHERE stage = 'Closed_Won' AND (created_by IN :executiveIds OR reassign_to IN :executiveIds)", nativeQuery = true)
    long countWonDealsForVP(@Param("executiveIds") List<Integer> executiveIds);
    
    // Revenue analytics - find closed won deals by date range using closed_date (fallback to created_at if closed_date is null)
    @Query("SELECT d FROM Deal d WHERE d.stage = com.techtammina.crm.entity.Deal.Stage.Closed_Won AND (d.closedDate BETWEEN :startDate AND :endDate OR (d.closedDate IS NULL AND d.createdAt BETWEEN :startDate AND :endDate))")
    List<Deal> findClosedWonDealsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    // Month-over-month analytics methods
    @Query(value = "SELECT COUNT(*) FROM deals WHERE stage = 'Closed_Won' AND (closed_date BETWEEN :startDate AND :endDate OR (closed_date IS NULL AND created_at BETWEEN :startDate AND :endDate))", nativeQuery = true)
    long countWonDealsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query(value = "SELECT COUNT(*) FROM deals WHERE created_at BETWEEN :startDate AND :endDate", nativeQuery = true)
    long countDealsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    @Query(value = "SELECT SUM(deal_value) FROM deals WHERE stage = 'Closed_Won' AND (closed_date BETWEEN :startDate AND :endDate OR (closed_date IS NULL AND created_at BETWEEN :startDate AND :endDate))", nativeQuery = true)
    BigDecimal sumWonDealsByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
}

