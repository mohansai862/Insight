package com.techtammina.crm.dto;

import com.techtammina.crm.entity.Deal;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class DealDTO {
    private Integer dealId;
    private Integer accountId;
    private Integer contactId;
    @Pattern(regexp = "^(?!.*^[^a-zA-Z0-9\\s]+$).*", message = "Deal name cannot contain only special characters")
    private String dealName;
    private BigDecimal dealValue;
    private String stage;
    private Integer probability;
    private LocalDate expectedCloseDate;
    private LocalDate closedDate;
    private Integer createdBy;
    private String createdByName;
    private String remarks;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Additional account summary fields for deal context
    private String accountName;
    private String accountCompanyLocation;
    private String accountCountry;
    
    // Lead name from original converted lead
    private String leadName;

    // Constructors
    public DealDTO() {}

    public DealDTO(Deal deal) {
        this.dealId = deal.getDealId();
        this.accountId = deal.getAccount() != null ? deal.getAccount().getAccountId() : null;
        this.contactId = deal.getContact() != null ? deal.getContact().getContactId() : null;
        this.dealName = deal.getDealName();
        this.dealValue = deal.getDealValue();
        this.stage = deal.getStage() != null ? deal.getStage().name() : null;
        this.probability = deal.getProbability();
        this.expectedCloseDate = deal.getExpectedCloseDate();
        this.closedDate = deal.getClosedDate();
        this.createdBy = deal.getCreatedBy() != null ? deal.getCreatedBy().getUserId() : null;
        this.createdByName = deal.getCreatedBy() != null ? deal.getCreatedBy().getFirstName() + " " + deal.getCreatedBy().getLastName() : null;
        this.remarks = deal.getRemarks();
        this.createdAt = deal.getCreatedAt();
        this.updatedAt = deal.getUpdatedAt();

        if (deal.getAccount() != null) {
            this.accountName = deal.getAccount().getAccountName();
            this.accountCompanyLocation = deal.getAccount().getCompanyLocation();
            this.accountCountry = deal.getAccount().getCountry();
        }
    }

    // Getters and Setters
    public Integer getDealId() { return dealId; }
    public void setDealId(Integer dealId) { this.dealId = dealId; }

    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }

    public Integer getContactId() { return contactId; }
    public void setContactId(Integer contactId) { this.contactId = contactId; }

    public String getDealName() { return dealName; }
    public void setDealName(String dealName) { this.dealName = dealName; }

    public BigDecimal getDealValue() { return dealValue; }
    public void setDealValue(BigDecimal dealValue) { this.dealValue = dealValue; }

    public String getStage() { return stage; }
    public void setStage(String stage) { this.stage = stage; }

    public Integer getProbability() { return probability; }
    public void setProbability(Integer probability) { this.probability = probability; }

    public LocalDate getExpectedCloseDate() { return expectedCloseDate; }
    public void setExpectedCloseDate(LocalDate expectedCloseDate) { this.expectedCloseDate = expectedCloseDate; }

    public LocalDate getClosedDate() { return closedDate; }
    public void setClosedDate(LocalDate closedDate) { this.closedDate = closedDate; }

    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }

    public String getAccountCompanyLocation() { return accountCompanyLocation; }
    public void setAccountCompanyLocation(String accountCompanyLocation) { this.accountCompanyLocation = accountCompanyLocation; }

    public String getAccountCountry() { return accountCountry; }
    public void setAccountCountry(String accountCountry) { this.accountCountry = accountCountry; }
    
    public String getLeadName() { return leadName; }
    public void setLeadName(String leadName) { this.leadName = leadName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
