package com.techtammina.crm.repository;

import com.techtammina.crm.entity.PriceList;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PriceListRepository extends JpaRepository<PriceList, Integer> {
    
    Optional<PriceList> findByIsDefaultTrue();
    
    @Query("SELECT p FROM PriceList p WHERE p.effectiveDate <= :date AND (p.expirationDate IS NULL OR p.expirationDate >= :date)")
    List<PriceList> findActivePriceLists(LocalDate date);
    
    List<PriceList> findByPriceListNameContainingIgnoreCase(String name);
}

