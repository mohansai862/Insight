package com.techtammina.crm.repository;

import com.techtammina.crm.entity.CustomerSatisfaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerSatisfactionRepository extends JpaRepository<CustomerSatisfaction, Integer> {
    
    Optional<CustomerSatisfaction> findByCaseEntityCaseId(Integer caseId);
    
    @Query("SELECT AVG(cs.rating) FROM CustomerSatisfaction cs")
    Double findAverageRating();
    
    @Query("SELECT cs FROM CustomerSatisfaction cs ORDER BY cs.submittedDate DESC")
    List<CustomerSatisfaction> findAllOrderBySubmittedDateDesc();
}

