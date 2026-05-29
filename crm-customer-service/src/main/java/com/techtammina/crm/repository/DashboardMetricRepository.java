package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DashboardMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DashboardMetricRepository extends JpaRepository<DashboardMetric, Integer> {
    
    @Query("SELECT dm FROM DashboardMetric dm WHERE dm.metricName = :metricName AND dm.calculatedDate = :date")
    Optional<DashboardMetric> findByMetricNameAndDate(String metricName, LocalDate date);
    
    @Query("SELECT dm FROM DashboardMetric dm WHERE dm.metricType = :metricType AND dm.calculatedDate = :date")
    List<DashboardMetric> findByMetricTypeAndDate(String metricType, LocalDate date);
    
    @Query("SELECT dm FROM DashboardMetric dm WHERE dm.calculatedDate = :date")
    List<DashboardMetric> findByDate(LocalDate date);
}

