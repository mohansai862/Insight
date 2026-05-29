package com.techtammina.crm.repository;

import com.techtammina.crm.entity.NotificationQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificationQueueRepository extends JpaRepository<NotificationQueue, Integer> {
    
    @Query("SELECT nq FROM NotificationQueue nq WHERE nq.status = 'Pending' ORDER BY nq.createdDate")
    List<NotificationQueue> findPendingNotifications();
    
    @Query("SELECT nq FROM NotificationQueue nq WHERE nq.user.userId = :userId ORDER BY nq.createdDate DESC")
    List<NotificationQueue> findByUserIdOrderByCreatedDateDesc(Integer userId);
}

