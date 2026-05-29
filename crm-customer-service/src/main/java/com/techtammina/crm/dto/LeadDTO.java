package com.techtammina.crm.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;

import java.time.LocalDateTime;

public class LeadDTO {
    private Integer id;
    private Integer leadId; // Add leadId field for frontend compatibility
    private String name; // Full name for frontend compatibility
    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "First name cannot contain numbers or special characters")
    private String firstName;
    
    @NotBlank(message = "Last name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Last name cannot contain numbers or special characters")
    private String lastName;
    
    @NotBlank(message = "Company name is required")
    @Pattern(regexp = ".*[a-zA-Z0-9].*", message = "Company name must contain at least one letter or number")
    @Pattern(regexp = "^(?!.*^[0-9\\s]*$).*", message = "Company name cannot contain only numbers")
    private String companyName;
    
    @NotBlank(message = "Designation is required")
    @Pattern(regexp = "^[a-zA-Z0-9\\s]+$", message = "Designation cannot contain special characters")
    private String designation;
    
    @NotBlank(message = "Email is required")
    @jakarta.validation.constraints.Email(message = "Invalid email format")
    private String email;
    
    private String countryCode;
    
    @NotBlank(message = "Phone number is required")
    @Pattern(regexp = "\\d{10,15}", message = "Phone number must be 10-15 digits")
    private String phoneNumber;
    private String linkedin;
    private String country;
    @NotBlank(message = "Company location is required")
    private String companyLocation;
    private String status;   // enum name
    private String source;  
    @NotBlank(message = "Industry is required")
    @Pattern(regexp = "^[a-zA-Z0-9\\s&\\-.,'\\'()\\[\\]]+$", message = "Industry can only contain letters, numbers, spaces, and special characters: & - . , ' ( ) [ ]")
    private String industry;
    private String notes;

    // legacy: ownerId was mapped from createdBy.userId
    private Integer ownerId;

    // also expose creator id for clarity
    private Integer createdById;

    private Integer assignedToId;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Integer convertedAccountId;
    private Integer convertedContactId;
    private Integer convertedDealId;
    @NotBlank(message = "Customer location is required")
    private String customerLocation;
    
    @NotBlank(message = "Technologies is required")
    private String technologies;
    
    @NotNull(message = "Prospect value is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Prospect value must be 0 or greater")
    private java.math.BigDecimal prospectValue;
    
    @NotNull(message = "Number of employees is required")
    @Min(value = 1, message = "Number of employees must be at least 1")
    private Integer numberOfEmployees;
    private String decisionAuthority;
    
    private Boolean reassignmentPending = false;

    // Add assignedTo and owner names
    private String assignedTo;
    private String owner;
    private String createdByName; // Name of the user who created the lead
    private String createdByEmpid; // Employee ID from Excel for Created_By column

    // getters/setters
    // ...
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public Integer getLeadId() { return leadId; }
    public void setLeadId(Integer leadId) { this.leadId = leadId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getLinkedin() { return linkedin; }
    public void setLinkedin(String linkedin) { this.linkedin = linkedin; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCompanyLocation() { return companyLocation; }
    public void setCompanyLocation(String companyLocation) { this.companyLocation = companyLocation; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Integer getOwnerId() { return ownerId; }
    public void setOwnerId(Integer ownerId) { this.ownerId = ownerId; }

    public Integer getCreatedById() { return createdById; }
    public void setCreatedById(Integer createdById) { this.createdById = createdById; }

    public Integer getAssignedToId() { return assignedToId; }
    public void setAssignedToId(Integer assignedToId) { this.assignedToId = assignedToId; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public Integer getConvertedAccountId() { return convertedAccountId; }
    public void setConvertedAccountId(Integer convertedAccountId) { this.convertedAccountId = convertedAccountId; }

    public Integer getConvertedContactId() { return convertedContactId; }
    public void setConvertedContactId(Integer convertedContactId) { this.convertedContactId = convertedContactId; }

    public Integer getConvertedDealId() { return convertedDealId; }
    public void setConvertedDealId(Integer convertedDealId) { this.convertedDealId = convertedDealId; }

    public String getCustomerLocation() { return customerLocation; }
    public void setCustomerLocation(String customerLocation) { this.customerLocation = customerLocation; }

    public String getTechnologies() { return technologies; }
    public void setTechnologies(String technologies) { this.technologies = technologies; }

    public java.math.BigDecimal getProspectValue() { return prospectValue; }
    public void setProspectValue(java.math.BigDecimal prospectValue) { this.prospectValue = prospectValue; }

    public Integer getNumberOfEmployees() { return numberOfEmployees; }
    public void setNumberOfEmployees(Integer numberOfEmployees) { this.numberOfEmployees = numberOfEmployees; }

    public String getDecisionAuthority() { return decisionAuthority; }
    public void setDecisionAuthority(String decisionAuthority) { this.decisionAuthority = decisionAuthority; }

    public String getAssignedTo() { return assignedTo; }
    public void setAssignedTo(String assignedTo) { this.assignedTo = assignedTo; }

    public String getOwner() { return owner; }
    public void setOwner(String owner) { this.owner = owner; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    
    public String getCreatedByEmpid() { return createdByEmpid; }
    public void setCreatedByEmpid(String createdByEmpid) { this.createdByEmpid = createdByEmpid; }
    
    public Boolean getReassignmentPending() { return reassignmentPending; }
    public void setReassignmentPending(Boolean reassignmentPending) { this.reassignmentPending = reassignmentPending; }

    @Override
    public String toString() {
        return "LeadDTO{" +
                "id=" + id +
                ", firstName='" + firstName + '\'' +
                ", lastName='" + lastName + '\'' +
                ", email='" + email + '\'' +
                ", source='" + source + '\'' +
                ", status='" + status + '\'' +
                ", companyName='" + companyName + '\'' +
                '}';
    }
}

