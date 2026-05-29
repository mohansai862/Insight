package com.techtammina.crm.dto;

public class ConvertLeadResponse {
    private Integer accountId;
    private Integer contactId;
    private Integer dealId;
    private String message;

    public ConvertLeadResponse() {}

    public ConvertLeadResponse(Integer accountId, Integer contactId, Integer dealId, String message) {
        this.accountId = accountId;
        this.contactId = contactId;
        this.dealId = dealId;
        this.message = message;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public Integer getContactId() {
        return contactId;
    }

    public void setContactId(Integer contactId) {
        this.contactId = contactId;
    }

    public Integer getDealId() {
        return dealId;
    }

    public void setDealId(Integer dealId) {
        this.dealId = dealId;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

