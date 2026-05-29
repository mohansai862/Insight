package com.techtammina.crm.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "leads")
public class Lead {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "lead_id")
    private Integer leadId;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_source", length = 50)
    private LeadSource leadSource;

    @NotBlank(message = "This field is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "First name cannot contain numbers or special characters")
    @Column(name = "first_name", length = 100)
    private String firstName;

    @NotBlank(message = "This field is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Last name cannot contain numbers or special characters")
    @Column(name = "last_name", length = 100)
    private String lastName;

    @NotBlank(message = "This field is required")
    @Pattern(regexp = ".*[a-zA-Z0-9].*", message = "Company name must contain at least one letter or number")
    @Pattern(regexp = "^(?!.*^[0-9\\s]*$).*", message = "Company name cannot contain only numbers")
    @Column(name = "company_name", length = 150)
    private String companyName;

    @NotBlank(message = "This field is required")
    @Pattern(regexp = "^[a-zA-Z0-9\\s]+$", message = "Designation cannot contain special characters")
    @Column(name = "designation", length = 100)
    private String designation;

    @NotBlank(message = "This field is required")
    @jakarta.validation.constraints.Email(message = "Invalid email format")
    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "country_code", length = 10)
    private String countryCode;

    @NotBlank(message = "This field is required")
    @Pattern(regexp = "\\d{10,15}", message = "Phone number must be 10-15 digits")
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "linkedin", length = 200)
    private String linkedin;

    @NotBlank(message = "This field is required")
    @Pattern(regexp = "^[a-zA-Z0-9\\s&\\-.,'\\'()\\[\\]]+$", message = "Industry can only contain letters, numbers, spaces, and special characters: & - . , ' ( ) [ ]")
    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "company_location", length = 255)
    @NotBlank(message = "This field is required")
    private String companyLocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "lead_status", length = 50)
    private LeadStatus leadStatus;

    @ManyToOne
    @JoinColumn(name = "created_by", referencedColumnName = "user_id")
    @JsonIgnoreProperties({"password", "createdAt", "updatedAt", "managerId"})
    private Users createdBy;

    @ManyToOne
    @JoinColumn(name = "assigned_to", referencedColumnName = "user_id")
    @JsonIgnoreProperties({"password", "createdAt", "updatedAt", "managerId"})
    private Users assignedTo;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "converted_account_id")
    private Integer convertedAccountId;

    @Column(name = "converted_contact_id")
    private Integer convertedContactId;

    @Column(name = "converted_deal_id")
    private Integer convertedDealId;

    @NotBlank(message = "This field is required")
    @Column(name = "customer_location", length = 255)
    private String customerLocation;

    @NotBlank(message = "This field is required")
    @Column(name = "technologies", length = 255)
    private String technologies;

    @NotNull(message = "This field is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Prospect value must be 0 or greater")
    @Column(name = "prospect_value", precision = 15, scale = 2)
    private java.math.BigDecimal prospectValue;

    @NotNull(message = "This field is required")
    @Min(value = 1, message = "Number of employees must be at least 1")
    @Column(name = "number_of_employees")
    private Integer numberOfEmployees;

    @Column(name = "decision_authority", length = 100)
    private String decisionAuthority;

    @Column(name = "reassignment_pending", columnDefinition = "BOOLEAN DEFAULT FALSE")
    private Boolean reassignmentPending = false;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        // Do not set updatedAt during creation - it should remain NULL
        if (leadStatus == null) {
            leadStatus = LeadStatus.New;
        }
        if (leadSource == null) {
            leadSource = LeadSource.Other;
        }
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum LeadSource {
        Website, Email, Campaign, Cold_Call, Referral, Event, Other
    }

    public enum LeadStatus {
        New, Contacted, Qualified, Unqualified, Converted
    }

    // Getters and Setters
    public Integer getLeadId() { return leadId; }
    public void setLeadId(Integer leadId) { this.leadId = leadId; }
    public LeadSource getLeadSource() { return leadSource; }
    public void setLeadSource(LeadSource leadSource) { this.leadSource = leadSource; }
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
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public String getCompanyLocation() { return companyLocation; }
    public void setCompanyLocation(String companyLocation) { this.companyLocation = companyLocation; }
    public LeadStatus getLeadStatus() { return leadStatus; }
    public void setLeadStatus(LeadStatus leadStatus) { this.leadStatus = leadStatus; }
    public Users getCreatedBy() { return createdBy; }
    public void setCreatedBy(Users createdBy) { this.createdBy = createdBy; }

    public Users getAssignedTo() { return assignedTo; }
    public void setAssignedTo(Users assignedTo) { this.assignedTo = assignedTo; }

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

    public Boolean getReassignmentPending() { return reassignmentPending; }
    public void setReassignmentPending(Boolean reassignmentPending) { this.reassignmentPending = reassignmentPending; }
}

