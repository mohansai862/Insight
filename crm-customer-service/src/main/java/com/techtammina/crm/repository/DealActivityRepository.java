package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DealActivity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealActivityRepository extends JpaRepository<DealActivity, Integer> {
    
    @Query("SELECT da FROM DealActivity da WHERE da.deal.dealId = :dealId ORDER BY da.createdAt DESC")
    List<DealActivity> findByDealIdOrderByCreatedAtDesc(@Param("dealId") Integer dealId);
}