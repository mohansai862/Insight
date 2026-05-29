package com.techtammina.crm.mapper;

import com.techtammina.crm.dto.ContactDTO;
import com.techtammina.crm.entity.Contact;

public class ContactMapper {
    public static ContactDTO toDTO(Contact e) {
        ContactDTO d = new ContactDTO();
        d.setContactId(e.getContactId());
        d.setFirstName(e.getFirstName());
        d.setLastName(e.getLastName());
        d.setEmail(e.getEmail());
        d.setCountryCode(e.getCountryCode());
        d.setPhoneNumber(e.getPhoneNumber());
        d.setDesignation(e.getDesignation());
        d.setLinkedin(e.getLinkedin());
        d.setAccountId(e.getAccount() != null ? e.getAccount().getAccountId() : null);
        d.setCompanyName(e.getAccount() != null ? e.getAccount().getAccountName() : null);
        if (e.getAccount() != null) {
            String companyLocation = e.getAccount().getCompanyLocation();
            String country = e.getAccount().getCountry();
            if (companyLocation != null && country != null) {
                d.setLocation(companyLocation + ", " + country);
            } else if (companyLocation != null) {
                d.setLocation(companyLocation);
            } else if (country != null) {
                d.setLocation(country);
            }
        }
        d.setReassignTo(e.getReassignTo() != null ? e.getReassignTo().getUserId() : null);
        d.setCreatedBy(e.getCreatedBy() != null ? e.getCreatedBy().getUserId() : null);
        d.setRemarks(e.getRemarks());
        d.setCreatedAt(e.getCreatedAt());
        d.setUpdatedAt(e.getUpdatedAt());
        d.setType(e.getType() != null ? e.getType().name().toLowerCase() : null);
        d.setStatus(e.getStatus() != null ? e.getStatus().name().toLowerCase() : null);
        
        // Set created by name for owner display
        // If original creator is Sales_Executive and contact is reassigned, show reassigned user as owner
        if (e.getCreatedBy() != null) {
            String createdByName;
            if ("Sales_Executive".equals(e.getCreatedBy().getRole().toString()) && e.getReassignTo() != null) {
                // Show reassigned user as owner when original creator is Sales_Executive
                createdByName = (e.getReassignTo().getFirstName() + " " + e.getReassignTo().getLastName()).trim();
                if (createdByName.isEmpty()) {
                    createdByName = e.getReassignTo().getUsername();
                }
            } else {
                // Show original creator for Sales_Manager/VP or when not reassigned
                createdByName = (e.getCreatedBy().getFirstName() + " " + e.getCreatedBy().getLastName()).trim();
                if (createdByName.isEmpty()) {
                    createdByName = e.getCreatedBy().getUsername();
                }
            }
            d.setCreatedByName(createdByName);
        }
        
        // Set company details from account
        if (e.getAccount() != null) {
            d.setIndustry(e.getAccount().getIndustry());
            d.setCity(e.getAccount().getCompanyLocation());
            d.setCountry(e.getAccount().getCountry());
            d.setNumberOfEmployees(e.getAccount().getNumberOfEmployees());
        }
        
        return d;
    }

    public static Contact toEntity(ContactDTO d) {
        Contact e = new Contact();
        e.setContactId(d.getContactId());
        e.setFirstName(d.getFirstName());
        e.setLastName(d.getLastName());
        e.setEmail(d.getEmail());
        e.setCountryCode(d.getCountryCode());
        e.setPhoneNumber(d.getPhoneNumber());
        e.setDesignation(d.getDesignation());
        e.setLinkedin(d.getLinkedin());
        e.setRemarks(d.getRemarks());
        if (d.getType() != null) {
            try {
                e.setType(Contact.ContactType.valueOf(d.getType().toLowerCase()));
            } catch (IllegalArgumentException ex) {
                e.setType(Contact.ContactType.lead); // Default fallback
            }
        }
        if (d.getStatus() != null) {
            try {
                e.setStatus(Contact.ContactStatus.valueOf(d.getStatus().toLowerCase()));
            } catch (IllegalArgumentException ex) {
                e.setStatus(Contact.ContactStatus.active); // Default fallback
            }
        }
        // Account, reassignTo, and createdBy will be set separately as objects
        return e;
    }
}


