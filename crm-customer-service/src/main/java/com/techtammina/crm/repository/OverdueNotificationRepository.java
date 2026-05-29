package com.techtammina.crm.repository;

import com.techtammina.crm.entity.OverdueNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OverdueNotificationRepository extends JpaRepository<OverdueNotification, Integer> {
    boolean existsByTaskIdAndManagerId(Integer taskId, Integer managerId);
}

