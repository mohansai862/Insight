package com.techtammina.crm.repository;

import com.techtammina.crm.entity.DealDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DealDocumentRepository extends JpaRepository<DealDocument, Integer> {
    List<DealDocument> findByDeal_DealId(Integer dealId);
}

