package com.techtammina.crm.repository;

import com.techtammina.crm.entity.PriceListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PriceListItemRepository extends JpaRepository<PriceListItem, Integer> {
    
    List<PriceListItem> findByPriceListPriceListId(Integer priceListId);
    
    @Query("SELECT pli FROM PriceListItem pli WHERE pli.priceList.priceListId = :priceListId AND pli.product.productId = :productId")
    Optional<PriceListItem> findByPriceListAndProduct(@Param("priceListId") Integer priceListId, @Param("productId") Integer productId);
    
    List<PriceListItem> findByProductProductId(Integer productId);
}

