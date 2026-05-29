package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Integer> {
    // Custom query methods can be added here if needed

    // Count activities by executive (created by)
    long countByCreatedBy_UserId(Integer executiveId);

    // Find activities by created by user id
    List<Activity> findByCreatedBy_UserId(Integer userId);

    // Find activities by created by user id and email
    List<Activity> findByCreatedBy_UserIdAndCreatedBy_Email(Integer userId, String email);

    // Find activities by lead id
    List<Activity> findByLead_LeadId(Integer leadId);

    // Find activities by lead id and created by user
    List<Activity> findByLead_LeadIdAndCreatedBy_UserId(Integer leadId, Integer userId);

    // Find activities by team members (for managers)
    List<Activity> findByCreatedBy_ManagerId(Integer managerId);

    // Find activities by lead and team members (for managers)
    List<Activity> findByLead_LeadIdAndCreatedBy_ManagerId(Integer leadId, Integer managerId);
}

