package com.techtammina.crm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts")
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Integer accountId;

    @NotBlank(message = "Account name is required")
    @Pattern(regexp = "^(?=.*[a-zA-Z]).*$", message = "Account name must contain at least one letter")
    @Pattern(regexp = "^(?!^[0-9\\s]*$).*", message = "Account name cannot contain only numbers")
    @Column(name = "account_name", length = 150, nullable = false)
    private String accountName;

    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Industry cannot contain numbers or special characters")
    @Column(name = "industry", length = 100)
    private String industry;

    @Column(name = "country", length = 100)
    private String country;

    @Pattern(regexp = "^(?=.*[a-zA-Z]).*$", message = "Company location must contain at least one letter")
    @Pattern(regexp = "^(?!^[0-9\\s]*$).*", message = "Company location cannot contain only numbers")
    @Column(name = "company_location", length = 100)
    private String companyLocation;

    @ManyToOne
    @JoinColumn(name = "reassign_to", referencedColumnName = "user_id")
    private Users reassignTo;

    @Column(name = "contact_name", length = 200)
    private String contactName;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "Job title cannot contain numbers or special characters")
    @Column(name = "job_title", length = 100)
    private String jobTitle;

    @Column(name = "website", length = 255)
    private String website;

    @Column(name = "number_of_employees")
    private Integer numberOfEmployees;

    @ManyToOne
    @JoinColumn(name = "created_by", referencedColumnName = "user_id")
    private Users createdBy;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private AccountType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private AccountStatus status;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        // Do not set updatedAt during creation - it should remain NULL
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

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
    public Users getReassignTo() { return reassignTo; }
    public void setReassignTo(Users reassignTo) { this.reassignTo = reassignTo; }
    public String getContactName() { return contactName; }
    public void setContactName(String contactName) { this.contactName = contactName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }
    public String getWebsite() { return website; }
    public void setWebsite(String website) { this.website = website; }
    public Integer getNumberOfEmployees() { return numberOfEmployees; }
    public void setNumberOfEmployees(Integer numberOfEmployees) { this.numberOfEmployees = numberOfEmployees; }

    public Users getCreatedBy() { return createdBy; }
    public void setCreatedBy(Users createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public AccountType getType() { return type; }
    public void setType(AccountType type) { this.type = type; }
    public AccountStatus getStatus() { return status; }
    public void setStatus(AccountStatus status) { this.status = status; }

    // Enum definitions
    public enum AccountType {
        lead, prospect, customer, partner, vendor
    }

    public enum AccountStatus {
        active, inactive, archived
    }
}

