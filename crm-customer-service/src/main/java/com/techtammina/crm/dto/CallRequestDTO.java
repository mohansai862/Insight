package com.techtammina.crm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class CallRequestDTO {
    
    @NotBlank(message = "Agent extension is required")
    private String agentExtension;
    
    @NotBlank(message = "Customer number is required")
    @Pattern(regexp = "^\\+?[1-9]\\d{1,14}$", message = "Invalid phone number format")
    private String customerNumber;
    
    private Integer contactId;
    
    private String contactName;

    // Constructors
    public CallRequestDTO() {}

    public CallRequestDTO(String agentExtension, String customerNumber, Integer contactId, String contactName) {
        this.agentExtension = agentExtension;
        this.customerNumber = customerNumber;
        this.contactId = contactId;
        this.contactName = contactName;
    }

    // Getters and Setters
    public String getAgentExtension() { return agentExtension; }
    public void setAgentExtension(String agentExtension) { this.agentExtension = agentExtension; }

    public String getCustomerNumber() { return customerNumber; }
    public void setCustomerNumber(String customerNumber) { this.customerNumber = customerNumber; }

    public Integer getContactId() { return contactId; }
    public void setContactId(Integer contactId) { this.contactId = contactId; }

    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
}

