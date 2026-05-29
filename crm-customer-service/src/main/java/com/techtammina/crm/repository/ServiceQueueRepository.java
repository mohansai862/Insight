package com.techtammina.crm.repository;

import com.techtammina.crm.entity.ServiceQueue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ServiceQueueRepository extends JpaRepository<ServiceQueue, Integer> {
    
    List<ServiceQueue> findByIsActiveTrue();
    
    List<ServiceQueue> findByQueueType(String queueType);
}

