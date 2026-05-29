package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Quote;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuoteRepository extends JpaRepository<Quote, Integer> {
    
    @Query("SELECT q FROM Quote q WHERE q.deal.dealId = :dealId")
    List<Quote> findByDealId(@Param("dealId") Integer dealId);
    
    @Query("SELECT q FROM Quote q WHERE q.createdBy.userId = :userId")
    Page<Quote> findByCreatedByUserId(@Param("userId") Integer userId, Pageable pageable);
    
    @Query("SELECT q FROM Quote q WHERE q.account.accountId = :accountId")
    List<Quote> findByAccountId(@Param("accountId") Integer accountId);
    
    @Query("SELECT q FROM Quote q WHERE q.status = :status")
    List<Quote> findByStatus(@Param("status") Quote.QuoteStatus status);
    
    @Query("SELECT COUNT(q) FROM Quote q WHERE q.quoteNumber LIKE :prefix")
    Long countByQuoteNumberPrefix(@Param("prefix") String prefix);
    
    Optional<Quote> findByQuoteNumber(String quoteNumber);
    
    /**
     * Find the maximum quote number for a given prefix (month)
     * Returns the highest quote number starting with the given prefix
     */
    @Query("SELECT q.quoteNumber FROM Quote q WHERE q.quoteNumber LIKE CONCAT(:prefix, '%') ORDER BY q.quoteNumber DESC")
    String findMaxQuoteNumberForMonth(@Param("prefix") String prefix);
}

