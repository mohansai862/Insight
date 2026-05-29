package com.techtammina.crm.service;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.Account;
import com.techtammina.crm.entity.Contact;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.AccountRepository;
import com.techtammina.crm.repository.ContactRepository;
import com.techtammina.crm.repository.DealRepository;

import java.math.BigDecimal;
import java.util.List;

@Slf4j
@Service
public class LeadSyncService {
    
    private static final Logger log = LoggerFactory.getLogger(LeadSyncService.class);
    
    private final LeadRepository leadRepository;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;

    public LeadSyncService(LeadRepository leadRepository, AccountRepository accountRepository,
                          ContactRepository contactRepository, DealRepository dealRepository) {
        this.leadRepository = leadRepository;
        this.accountRepository = accountRepository;
        this.contactRepository = contactRepository;
        this.dealRepository = dealRepository;
    }

    @Transactional
    public void syncLeadUpdate(Lead lead) {
        if (lead.getLeadStatus() != Lead.LeadStatus.Converted) {
            return; // Only sync converted leads
        }

        log.debug("Syncing lead update for converted lead: {}", lead.getLeadId());
        
        // Sync to Account
        if (lead.getConvertedAccountId() != null) {
            syncToAccount(lead);
        }
        
        // Sync to Contact
        if (lead.getConvertedContactId() != null) {
            syncToContact(lead);
        }
        
        // Sync to Deal
        if (lead.getConvertedDealId() != null) {
            syncToDeal(lead);
        }
    }

    @Transactional
    public void syncAccountUpdate(Account account) {
        log.debug("Syncing account update: {}", account.getAccountId());
        
        // Find all leads converted to this account
        List<Lead> convertedLeads = leadRepository.findByConvertedAccountId(account.getAccountId());
        
        for (Lead lead : convertedLeads) {
            syncFromAccount(lead, account);
        }
        
        // Sync to related contacts and deals
        syncAccountToRelatedEntities(account);
    }

    @Transactional
    public void syncContactUpdate(Contact contact) {
        log.debug("Syncing contact update: {}", contact.getContactId());
        
        // Find all leads converted to this contact
        List<Lead> convertedLeads = leadRepository.findByConvertedContactId(contact.getContactId());
        
        for (Lead lead : convertedLeads) {
            syncFromContact(lead, contact);
        }
    }

    private void syncToAccount(Lead lead) {
        accountRepository.findById(lead.getConvertedAccountId()).ifPresent(account -> {
            boolean updated = false;
            
            if (!equals(account.getAccountName(), lead.getCompanyName())) {
                account.setAccountName(lead.getCompanyName());
                updated = true;
            }
            if (!equals(account.getIndustry(), lead.getIndustry())) {
                account.setIndustry(lead.getIndustry());
                updated = true;
            }
            if (!equals(account.getCountry(), lead.getCountry())) {
                account.setCountry(lead.getCountry());
                updated = true;
            }
            if (!equals(account.getCompanyLocation(), lead.getCompanyLocation())) {
                account.setCompanyLocation(lead.getCompanyLocation());
                updated = true;
            }
            if (!equals(account.getEmail(), lead.getEmail())) {
                account.setEmail(lead.getEmail());
                updated = true;
            }
            if (!equals(account.getPhoneNumber(), lead.getPhoneNumber())) {
                account.setPhoneNumber(lead.getPhoneNumber());
                updated = true;
            }
            if (!equals(account.getNumberOfEmployees(), lead.getNumberOfEmployees())) {
                account.setNumberOfEmployees(lead.getNumberOfEmployees());
                updated = true;
            }
            
            if (updated) {
                accountRepository.save(account);
                log.debug("Account {} updated from lead {}", account.getAccountId(), lead.getLeadId());
            }
        });
    }

    private void syncToContact(Lead lead) {
        contactRepository.findById(lead.getConvertedContactId()).ifPresent(contact -> {
            boolean updated = false;
            
            if (!equals(contact.getFirstName(), lead.getFirstName())) {
                contact.setFirstName(lead.getFirstName());
                updated = true;
            }
            if (!equals(contact.getLastName(), lead.getLastName())) {
                contact.setLastName(lead.getLastName());
                updated = true;
            }
            if (!equals(contact.getEmail(), lead.getEmail())) {
                contact.setEmail(lead.getEmail());
                updated = true;
            }
            if (!equals(contact.getPhoneNumber(), lead.getPhoneNumber())) {
                contact.setPhoneNumber(lead.getPhoneNumber());
                updated = true;
            }
            if (!equals(contact.getDesignation(), lead.getDesignation())) {
                contact.setDesignation(lead.getDesignation());
                updated = true;
            }
            // Note: Contact doesn't have companyName field, it's linked via Account
            
            if (updated) {
                contactRepository.save(contact);
                log.debug("Contact {} updated from lead {}", contact.getContactId(), lead.getLeadId());
            }
        });
    }

    private void syncToDeal(Lead lead) {
        dealRepository.findById(lead.getConvertedDealId()).ifPresent(deal -> {
            boolean updated = false;
            
            if (!equals(deal.getDealValue(), lead.getProspectValue())) {
                deal.setDealValue(lead.getProspectValue());
                updated = true;
            }
            
            if (updated) {
                dealRepository.save(deal);
                log.debug("Deal {} updated from lead {}", deal.getDealId(), lead.getLeadId());
            }
        });
    }

    private void syncFromAccount(Lead lead, Account account) {
        boolean updated = false;
        
        if (!equals(lead.getCompanyName(), account.getAccountName())) {
            lead.setCompanyName(account.getAccountName());
            updated = true;
        }
        if (!equals(lead.getIndustry(), account.getIndustry())) {
            lead.setIndustry(account.getIndustry());
            updated = true;
        }
        if (!equals(lead.getCountry(), account.getCountry())) {
            lead.setCountry(account.getCountry());
            updated = true;
        }
        if (!equals(lead.getCompanyLocation(), account.getCompanyLocation())) {
            lead.setCompanyLocation(account.getCompanyLocation());
            updated = true;
        }
        if (!equals(lead.getEmail(), account.getEmail())) {
            lead.setEmail(account.getEmail());
            updated = true;
        }
        if (!equals(lead.getPhoneNumber(), account.getPhoneNumber())) {
            lead.setPhoneNumber(account.getPhoneNumber());
            updated = true;
        }
        if (!equals(lead.getNumberOfEmployees(), account.getNumberOfEmployees())) {
            lead.setNumberOfEmployees(account.getNumberOfEmployees());
            updated = true;
        }
        
        if (updated) {
            leadRepository.save(lead);
            log.debug("Lead {} updated from account {}", lead.getLeadId(), account.getAccountId());
        }
    }

    private void syncFromContact(Lead lead, Contact contact) {
        boolean updated = false;
        
        if (!equals(lead.getFirstName(), contact.getFirstName())) {
            lead.setFirstName(contact.getFirstName());
            updated = true;
        }
        if (!equals(lead.getLastName(), contact.getLastName())) {
            lead.setLastName(contact.getLastName());
            updated = true;
        }
        if (!equals(lead.getEmail(), contact.getEmail())) {
            lead.setEmail(contact.getEmail());
            updated = true;
        }
        if (!equals(lead.getPhoneNumber(), extractDigitsOnly(contact.getPhoneNumber()))) {
            lead.setPhoneNumber(extractDigitsOnly(contact.getPhoneNumber()));
            updated = true;
        }
        if (!equals(lead.getDesignation(), contact.getDesignation())) {
            lead.setDesignation(contact.getDesignation());
            updated = true;
        }
        // Company name comes from the account, not directly from contact
        if (contact.getAccount() != null && !equals(lead.getCompanyName(), contact.getAccount().getAccountName())) {
            lead.setCompanyName(contact.getAccount().getAccountName());
            updated = true;
        }
        
        if (updated) {
            leadRepository.save(lead);
            log.debug("Lead {} updated from contact {}", lead.getLeadId(), contact.getContactId());
        }
    }

    private void syncAccountToRelatedEntities(Account account) {
        // Sync account changes to related contacts
        List<Contact> relatedContacts = contactRepository.findByAccount_AccountId(account.getAccountId());
        for (Contact contact : relatedContacts) {
            // Contact's company name is derived from account relationship, no direct update needed
            // But we could sync other fields if needed in the future
        }
        
        // Sync account changes to related deals
        List<Deal> relatedDeals = dealRepository.findByAccount_AccountId(account.getAccountId());
        for (Deal deal : relatedDeals) {
            // Update deal name if it contains the old company name
            if (deal.getDealName() != null && deal.getDealName().contains("from Lead")) {
                // Keep existing deal name logic
                continue;
            }
        }
    }

    @Transactional
    public void syncAllConvertedLeads() {
        log.info("Starting synchronization of all converted leads");
        
        List<Lead> convertedLeads = leadRepository.findAll().stream()
            .filter(lead -> lead.getLeadStatus() == Lead.LeadStatus.Converted)
            .collect(java.util.stream.Collectors.toList());
        
        log.info("Found {} converted leads to sync", convertedLeads.size());
        
        for (Lead lead : convertedLeads) {
            try {
                syncLeadUpdate(lead);
                log.debug("Synced lead {}", lead.getLeadId());
            } catch (Exception e) {
                log.error("Failed to sync lead {}: {}", lead.getLeadId(), e.getMessage());
            }
        }
        
        log.info("Completed synchronization of all converted leads");
    }

    private boolean equals(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }
    
    private String extractDigitsOnly(String phoneNumber) {
        if (phoneNumber == null) return null;
        return phoneNumber.replaceAll("\\D", "");
    }
}