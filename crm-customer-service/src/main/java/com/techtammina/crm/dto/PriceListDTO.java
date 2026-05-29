package com.techtammina.crm.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PriceListDTO {
    private Integer priceListId;
    private String priceListName;
    private String currency;
    private Boolean isDefault;
    private LocalDate effectiveDate;
    private LocalDate expirationDate;
    private LocalDateTime createdDate;
    private List<PriceListItemDTO> priceListItems;

    // Getters and Setters
    public Integer getPriceListId() { return priceListId; }
    public void setPriceListId(Integer priceListId) { this.priceListId = priceListId; }
    public String getPriceListName() { return priceListName; }
    public void setPriceListName(String priceListName) { this.priceListName = priceListName; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    public LocalDate getEffectiveDate() { return effectiveDate; }
    public void setEffectiveDate(LocalDate effectiveDate) { this.effectiveDate = effectiveDate; }
    public LocalDate getExpirationDate() { return expirationDate; }
    public void setExpirationDate(LocalDate expirationDate) { this.expirationDate = expirationDate; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public List<PriceListItemDTO> getPriceListItems() { return priceListItems; }
    public void setPriceListItems(List<PriceListItemDTO> priceListItems) { this.priceListItems = priceListItems; }
}

