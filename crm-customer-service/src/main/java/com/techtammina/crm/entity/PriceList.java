package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "price_lists")
public class PriceList {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "price_list_id")
    private Integer priceListId;

    @Column(name = "price_list_name", nullable = false)
    private String priceListName;

    @Column(name = "currency", length = 10)
    private String currency = "INR";

    @Column(name = "is_default")
    private Boolean isDefault = false;

    @Column(name = "effective_date")
    private LocalDate effectiveDate;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @OneToMany(mappedBy = "priceList", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PriceListItem> priceListItems;

    @PrePersist
    public void prePersist() {
        createdDate = LocalDateTime.now();
    }

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
    public List<PriceListItem> getPriceListItems() { return priceListItems; }
    public void setPriceListItems(List<PriceListItem> priceListItems) { this.priceListItems = priceListItems; }
}

