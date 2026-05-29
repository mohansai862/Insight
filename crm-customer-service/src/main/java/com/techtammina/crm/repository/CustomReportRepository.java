package com.techtammina.crm.repository;

import com.techtammina.crm.entity.CustomReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CustomReportRepository extends JpaRepository<CustomReport, Integer> {
    
    @Query("SELECT cr FROM CustomReport cr WHERE cr.isPublic = true OR cr.createdBy.userId = :userId")
    List<CustomReport> findAccessibleReports(Integer userId);
    
    @Query("SELECT cr FROM CustomReport cr WHERE cr.entityType = :entityType AND (cr.isPublic = true OR cr.createdBy.userId = :userId)")
    List<CustomReport> findByEntityTypeAndAccessible(String entityType, Integer userId);
    
    @Query("SELECT cr FROM CustomReport cr WHERE cr.createdBy.userId = :userId")
    List<CustomReport> findByCreatedBy(Integer userId);
}

