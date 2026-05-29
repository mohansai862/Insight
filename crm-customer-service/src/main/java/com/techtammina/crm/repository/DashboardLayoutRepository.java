package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DashboardLayout;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface DashboardLayoutRepository extends JpaRepository<DashboardLayout, Integer> {
    
    @Query("SELECT dl FROM DashboardLayout dl WHERE dl.user.userId = :userId")
    List<DashboardLayout> findByUserId(Integer userId);
    
    @Query("SELECT dl FROM DashboardLayout dl WHERE dl.role = :role AND dl.isDefault = true")
    Optional<DashboardLayout> findDefaultByRole(String role);
    
    @Query("SELECT dl FROM DashboardLayout dl WHERE dl.user.userId = :userId OR dl.role = :role")
    List<DashboardLayout> findByUserIdOrRole(Integer userId, String role);
}

