package com.techtammina.crm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.entity.Account;
import com.techtammina.crm.entity.Contact;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.repository.AccountRepository;
import com.techtammina.crm.repository.ContactRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * CRM Lifecycle Management Service
 * Handles automatic type and status transitions based on business rules
 */
@Service
public class CrmLifecycleService {

    private static final Logger log = LoggerFactory.getLogger(CrmLifecycleService.class);
    
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    
    public CrmLifecycleService(AccountRepository accountRepository, ContactRepository contactRepository) {
        this.accountRepository = accountRepository;
        this.contactRepository = contactRepository;
    }
    
    /**
     * Update account type based on deal closure
     * Called when a deal status changes to Closed_Won
     */
    @Transactional
    public void onDealClosed(Deal deal) {
        try {
            if (deal.getStage() == Deal.Stage.Closed_Won && deal.getAccount() != null) {
                Account account = deal.getAccount();
                log.info("CRM Lifecycle: Processing deal closure - dealId: {}, accountId: {}, dealValue: {}", 
                        deal.getDealId(), account.getAccountId(), deal.getDealValue());
                
                // CRM Lifecycle: Deal closed → account becomes customer
                if (account.getType() != Account.AccountType.customer) {
                    Account.AccountType previousType = account.getType();
                    account.setType(Account.AccountType.customer);
                    accountRepository.save(account);
                    log.info("CRM Lifecycle: Account {} upgraded from {} to CUSTOMER (deal {} closed)", 
                            account.getAccountId(), previousType, deal.getDealId());
                }
                
                // Update related contacts to customer type as well
                var contacts = contactRepository.findByAccount_AccountId(account.getAccountId());
                int updatedContacts = 0;
                for (Contact contact : contacts) {
                    if (contact.getType() != Contact.ContactType.customer) {
                        Contact.ContactType previousType = contact.getType();
                        contact.setType(Contact.ContactType.customer);
                        contactRepository.save(contact);
                        updatedContacts++;
                        log.debug("CRM Lifecycle: Contact {} upgraded from {} to CUSTOMER", 
                                contact.getContactId(), previousType);
                    }
                }
                
                if (updatedContacts > 0) {
                    log.info("CRM Lifecycle: Updated {} contacts to CUSTOMER type for account {}", 
                            updatedContacts, account.getAccountId());
                }
            }
        } catch (Exception e) {
            log.error("CRM Lifecycle: Failed to process deal closure for dealId: {}", deal.getDealId(), e);
            throw e;
        }
    }
    
    /**
     * Set initial type for lead conversion
     * Called during lead to account conversion
     */
    @Transactional
    public void onLeadConversion(Account account) {
        try {
            // CRM Lifecycle: Lead converts → becomes prospect initially
            Account.AccountType previousType = account.getType();
            account.setType(Account.AccountType.prospect);
            account.setStatus(Account.AccountStatus.active);
            accountRepository.save(account);
            log.info("CRM Lifecycle: Account {} set from {} to PROSPECT (lead conversion)", 
                    account.getAccountId(), previousType);
        } catch (Exception e) {
            log.error("CRM Lifecycle: Failed to process lead conversion for accountId: {}", account.getAccountId(), e);
            throw e;
        }
    }
    
    /**
     * Mark account/contacts as inactive
     * Called when relationship ends
     */
    @Transactional
    public void markAsInactive(Integer accountId) {
        try {
            Account account = accountRepository.findById(accountId).orElse(null);
            if (account != null) {
                Account.AccountStatus previousStatus = account.getStatus();
                account.setStatus(Account.AccountStatus.inactive);
                accountRepository.save(account);
                
                // Mark related contacts as inactive too
                var contacts = contactRepository.findByAccount_AccountId(accountId);
                int updatedContacts = 0;
                for (Contact contact : contacts) {
                    if (contact.getStatus() != Contact.ContactStatus.inactive) {
                        contact.setStatus(Contact.ContactStatus.inactive);
                        contactRepository.save(contact);
                        updatedContacts++;
                    }
                }
                
                log.info("CRM Lifecycle: Account {} marked INACTIVE (was {}), {} contacts updated", 
                        accountId, previousStatus, updatedContacts);
            } else {
                log.warn("CRM Lifecycle: Account {} not found for marking inactive", accountId);
            }
        } catch (Exception e) {
            log.error("CRM Lifecycle: Failed to mark account {} as inactive", accountId, e);
            throw e;
        }
    }
}