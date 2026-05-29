package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Email;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EmailRepository extends JpaRepository<Email, Integer> {
    List<Email> findByRelatedEntityTypeAndRelatedEntityIdOrderBySentDateDesc(String entityType, Integer entityId);
    List<Email> findByEmailThreadIdOrderBySentDateAsc(String threadId);
}

