package com.techtammina.crm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "contacts",
       uniqueConstraints = {
           @UniqueConstraint(name = "uk_contact_account_email", columnNames = {"account_id", "email"})
       })
public class Contact {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "contact_id")
    private Integer contactId;

    @NotBlank(message = "First name is required")
    @Pattern(regexp = "^[a-zA-Z\\s]+$", message = "First name cannot contain numbers or special characters")
    @Column(name = "first_name", length = 100, nullable = false)
    private String firstName;

    @Pattern(regexp = "^[a-zA-Z\\s]*$", message = "Last name cannot contain numbers or special characters")
    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "country_code", length = 10)
    private String countryCode;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Pattern(regexp = "^(?!^[^a-zA-Z0-9\\s]*$).*", message = "Designation cannot contain only special characters")
    @Column(name = "designation", length = 100)
    private String designation;

    @Column(name = "linkedin", length = 200)
    private String linkedin;

    @ManyToOne
    @JoinColumn(name = "account_id", referencedColumnName = "account_id", nullable = false)
    private Account account;

    @ManyToOne
    @JoinColumn(name = "reassign_to", referencedColumnName = "user_id")
    private Users reassignTo;

    @ManyToOne
    @JoinColumn(name = "created_by", referencedColumnName = "user_id")
    private Users createdBy;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "type")
    private ContactType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private ContactStatus status;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        // Do not set updatedAt during creation - it should remain NULL
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // getters & setters
    public Integer getContactId() { return contactId; }
    public void setContactId(Integer contactId) { this.contactId = contactId; }
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getDesignation() { return designation; }
    public void setDesignation(String designation) { this.designation = designation; }
    public String getLinkedin() { return linkedin; }
    public void setLinkedin(String linkedin) { this.linkedin = linkedin; }
    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }
    public Users getReassignTo() { return reassignTo; }
    public void setReassignTo(Users reassignTo) { this.reassignTo = reassignTo; }
    public Users getCreatedBy() { return createdBy; }
    public void setCreatedBy(Users createdBy) { this.createdBy = createdBy; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public ContactType getType() { return type; }
    public void setType(ContactType type) { this.type = type; }
    public ContactStatus getStatus() { return status; }
    public void setStatus(ContactStatus status) { this.status = status; }

    // Enum definitions
    public enum ContactType {
        lead, prospect, customer, partner, vendor
    }

    public enum ContactStatus {
        active, inactive, archived
    }
}

