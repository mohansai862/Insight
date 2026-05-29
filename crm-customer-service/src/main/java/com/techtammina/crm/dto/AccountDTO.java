package com.techtammina.crm.dto;

import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

public class AccountDTO {
    private Integer accountId;
    @NotBlank(message = "Account name is required")
    @Pattern(regexp = "^(?=.*[a-zA-Z]).*$", message = "Account name must contain at least one letter")
    @Pattern(regexp = "^(?!^[0-9\\s]*$).*", message = "Account name cannot contain only numbers")
    private String accountName;
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Industry cannot contain numbers or special characters")
    private String industry;
    private String country;
    @Pattern(regexp = "^(?=.*[a-zA-Z]).*$", message = "Company location must contain at least one letter")
    @Pattern(regexp = "^(?!^[0-9\\s]*$).*", message = "Company location cannot contain only numbers")
    private String companyLocation;
    private Integer reassignTo;
    private String leadName;
    private String contactName;
    private String email;
    private String phoneNumber;
    private String mobile;
    @NotBlank(message = "Job title is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Job title cannot contain numbers or special characters")
    private String jobTitle;
    private String website;
    private Integer numberOfEmployees;
    private Integer createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String type;
    private String status;

    // getters/setters
    public Integer getAccountId() { return accountId; }
    public void setAccountId(Integer accountId) { this.accountId = accountId; }
    public String getAccountName() { return accountName; }
    public void setAccountName(String accountName) { this.accountName = accountName; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCompanyLocation() { return companyLocation; }
    public void setCompanyLocation(String companyLocation) { this.companyLocation = companyLocation; }
    public Integer getReassignTo() { return reassignTo; }
    public void setReassignTo(Integer reassignTo) { this.reassignTo = reassignTo; }
    public String getLeadName() { return leadName; }
    public void setLeadName(String leadName) { this.leadName = leadName; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getMobile() { return mobile; }
    public void setMobile(String mobile) { this.mobile = mobile; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public Integer getNumberOfEmployees() { return numberOfEmployees; }
    public void setNumberOfEmployees(Integer numberOfEmployees) { this.numberOfEmployees = numberOfEmployees; }
    public Integer getCreatedBy() { return createdBy; }
    public void setCreatedBy(Integer createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}


