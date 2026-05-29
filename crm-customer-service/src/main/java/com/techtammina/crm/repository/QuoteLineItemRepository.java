package com.techtammina.crm.repository;

import com.techtammina.crm.entity.QuoteLineItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuoteLineItemRepository extends JpaRepository<QuoteLineItem, Integer> {
    
    @Query("SELECT qli FROM QuoteLineItem qli WHERE qli.quote.quoteId = :quoteId ORDER BY qli.sortOrder")
    List<QuoteLineItem> findByQuoteIdOrderBySortOrder(@Param("quoteId") Integer quoteId);
    
    @Modifying
    @Transactional
    @Query("DELETE FROM QuoteLineItem qli WHERE qli.quote.quoteId = :quoteId")
    void deleteByQuoteId(@Param("quoteId") Integer quoteId);
}

