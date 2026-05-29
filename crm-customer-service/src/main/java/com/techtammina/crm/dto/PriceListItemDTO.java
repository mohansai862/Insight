package com.techtammina.crm.dto;

import java.math.BigDecimal;

public class PriceListItemDTO {
    private Integer priceListItemId;
    private Integer priceListId;
    private Integer productId;
    private String productName;
    private String productCode;
    private BigDecimal unitPrice;
    private Integer minQuantity;

    // Getters and Setters
    public Integer getPriceListItemId() { return priceListItemId; }
    public void setPriceListItemId(Integer priceListItemId) { this.priceListItemId = priceListItemId; }
    public Integer getPriceListId() { return priceListId; }
    public void setPriceListId(Integer priceListId) { this.priceListId = priceListId; }
    public Integer getProductId() { return productId; }
    public void setProductId(Integer productId) { this.productId = productId; }
    public String getProductName() { return productName; }
    public void setProductName(String productName) { this.productName = productName; }
    public String getProductCode() { return productCode; }
    public void setProductCode(String productCode) { this.productCode = productCode; }
    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
    public Integer getMinQuantity() { return minQuantity; }
    public void setMinQuantity(Integer minQuantity) { this.minQuantity = minQuantity; }
}

