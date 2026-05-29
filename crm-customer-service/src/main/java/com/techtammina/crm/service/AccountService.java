package com.techtammina.crm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


import com.techtammina.crm.dto.AccountDTO;
import com.techtammina.crm.entity.Account;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.entity.Contact;
import com.techtammina.crm.mapper.AccountMapper;
import com.techtammina.crm.repository.AccountRepository;
import com.techtammina.crm.repository.DealRepository;
import com.techtammina.crm.repository.ContactRepository;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AccountService {

    private static final Logger log = LoggerFactory.getLogger(AccountService.class);
    private final AccountRepository accountRepository;
    private final DealRepository dealRepository;
    private final ContactRepository contactRepository;
    private final LeadRepository leadRepository;
    private final UsersRepository usersRepository;
    private final CrmLifecycleService crmLifecycleService;
    private final LeadSyncService leadSyncService;
    private final SalesManagerService salesManagerService;

    
    public AccountService(AccountRepository accountRepository, DealRepository dealRepository, ContactRepository contactRepository, LeadRepository leadRepository, UsersRepository usersRepository, CrmLifecycleService crmLifecycleService, LeadSyncService leadSyncService, SalesManagerService salesManagerService) {
        this.accountRepository = accountRepository;
        this.dealRepository = dealRepository;
        this.contactRepository = contactRepository;
        this.leadRepository = leadRepository;
        this.usersRepository = usersRepository;
        this.crmLifecycleService = crmLifecycleService;
        this.leadSyncService = leadSyncService;
        this.salesManagerService = salesManagerService;
    }

    @Transactional
    public AccountDTO create(AccountDTO dto) {
        log.debug("\nÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â¢ ACCOUNT CREATION TRIGGERED!");
        log.debug("{}", "ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Â¹ Account Name: " + dto.getAccountName());
        log.debug("{}", "ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â§ Email: " + dto.getEmail());
        log.debug("{}", "ÃƒÂ°Ã…Â¸Ã¢â‚¬ËœÃ‚Â¤ Contact Name: " + dto.getContactName());
        log.debug("{}", "ÃƒÂ°Ã…Â¸Ã…â€™Ã‚Â Country: " + dto.getCountry());
        
        try {
            // Validate required fields
            if (dto.getAccountName() == null || dto.getAccountName().trim().isEmpty()) {
                throw new RuntimeException("Account name is required");
            }
            if (dto.getContactName() == null || dto.getContactName().trim().isEmpty()) {
                throw new RuntimeException("Contact name is required");
            }
            if (dto.getEmail() == null || dto.getEmail().trim().isEmpty()) {
                throw new RuntimeException("Email is required");
            }
            if (dto.getCountry() == null || dto.getCountry().trim().isEmpty()) {
                throw new RuntimeException("Country is required");
            }
            if (dto.getJobTitle() == null || dto.getJobTitle().trim().isEmpty()) {
                throw new RuntimeException("Job title is required");
            }
            
            // Check for duplicate email
            if (dto.getEmail() != null && accountRepository.existsByEmail(dto.getEmail().trim())) {
                throw new RuntimeException("Email already exists");
            }
            
            // Check for duplicate account name within the same executive's accounts
            if (dto.getCreatedBy() != null) {
                Users createdByUser = usersRepository.findById(dto.getCreatedBy()).orElse(null);
                if (createdByUser != null) {
                    List<Account> userAccounts = accountRepository.findByCreatedBy(createdByUser);
                    for (Account acc : userAccounts) {
                        if (acc.getAccountName().equalsIgnoreCase(dto.getAccountName().trim())) {
                            throw new RuntimeException("Account with name '" + dto.getAccountName() + "' already exists for this user");
                        }
                    }
                }
            }
            
            Account entity = AccountMapper.toEntity(dto);
            
            // Set defaults for type and status if not provided
            if (entity.getType() == null) entity.setType(Account.AccountType.lead);
            if (entity.getStatus() == null) entity.setStatus(Account.AccountStatus.active);
            
            // Set createdBy if not already set
            if (entity.getCreatedBy() == null && dto.getCreatedBy() != null) {
                Users createdByUser = usersRepository.findById(dto.getCreatedBy())
                    .orElse(null);
                if (createdByUser != null) {
                    entity.setCreatedBy(createdByUser);
                }
            }
            
            log.debug("ÃƒÂ°Ã…Â¸Ã¢â‚¬â„¢Ã‚Â¾ Saving account to database...");
            Account saved = accountRepository.save(entity);
            
            // Verify the account was saved with a valid ID
            if (saved.getAccountId() == null || saved.getAccountId() <= 0) {
                throw new RuntimeException("Failed to generate valid account ID. Database auto-increment may be corrupted.");
            }
            
            log.debug("{}", "ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ ACCOUNT CREATED SUCCESSFULLY - ID: " + saved.getAccountId() + ", Name: " + saved.getAccountName());
            AccountDTO result = AccountMapper.toDTO(saved);
            log.debug("{}", "ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã‚Â¤ Returning DTO with ID: " + result.getAccountId());
            return result;
            
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Account creation failed: " + e.getMessage(), e);
        }
    }

    public List<AccountDTO> list() {
        List<AccountDTO> allAccounts = accountRepository.findAll().stream().map(AccountMapper::toDTO).collect(Collectors.toList());
        log.debug("{}", "   Total accounts in system: " + allAccounts.size());
        return allAccounts;
    }

    public List<AccountDTO> listFiltered(String search, Integer userId, String userRole) {
        String role = (userRole == null ? "" : userRole).trim();
        String normalized = role.toUpperCase().replace(' ', '_');

        log.debug("\nÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ‚Â ACCOUNT FILTERING DEBUG:");
        log.debug("{}", "   User ID: " + userId);
        log.debug("{}", "   User Role: " + userRole);
        log.debug("{}", "   Normalized Role: " + normalized);
        log.debug("{}", "   Search: " + search);

        if ("IT_ADMIN".equals(normalized)) {
            List<AccountDTO> allAccounts = list();
            log.debug("{}", "   IT_ADMIN: Returning " + allAccounts.size() + " accounts");
            return allAccounts;
        }
        if ("SALES_VP".equals(normalized)) {
            // VP sees: accounts belonging to their hierarchy (executives under their managers)
            List<Integer> hierarchyUserIds = salesManagerService.findHierarchyUserIdsByVpId(userId);
            List<AccountDTO> vpAccounts = getAccountsForHierarchy(hierarchyUserIds, search);
            log.debug("{}", "   SALES_VP: Returning " + vpAccounts.size() + " accounts");
            return vpAccounts;
        }
        if ("SALES_MANAGER".equals(normalized)) {
            // Manager sees: accounts belonging to their executives
            List<Integer> executiveIds = salesManagerService.getExecutivesUnderManager(userId)
                .stream()
                .map(dto -> dto.getUserId())
                .collect(Collectors.toList());
            if (executiveIds.isEmpty()) {
                return List.of();
            }
            List<AccountDTO> managerAccounts = getAccountsForHierarchy(executiveIds, search);
            log.debug("{}", "   SALES_MANAGER: Returning " + managerAccounts.size() + " accounts");
            return managerAccounts;
        }
        if ("SALES_EXECUTIVE".equals(normalized)) {
            // Executive sees: accounts assigned to them (reassignTo) OR accounts created by them (only if not assigned to someone else)
            List<AccountDTO> execAccounts = accountRepository.findAll().stream()
                .filter(account -> {
                    boolean isAssigned = account.getReassignTo() != null && account.getReassignTo().getUserId().equals(userId);
                    boolean isCreatedBy = account.getCreatedBy() != null && account.getCreatedBy().getUserId().equals(userId);
                    
                    // If account is created by sales executive and assigned to someone else, only show to assigned user
                    if (account.getCreatedBy() != null && "Sales_Executive".equals(account.getCreatedBy().getRole()) && 
                        account.getReassignTo() != null && !account.getReassignTo().getUserId().equals(userId)) {
                        return false; // Don't show to creator if assigned to someone else
                    }
                    
                    return isAssigned || isCreatedBy;
                })
                .map(AccountMapper::toDTO)
                .collect(Collectors.toList());
            log.debug("{}", "   SALES_EXECUTIVE: Returning " + execAccounts.size() + " accounts");
            return execAccounts;
        }
        log.debug("   UNKNOWN ROLE: Returning empty list");
        return List.of();
    }

    public AccountDTO get(Integer id) {
        return accountRepository.findById(id).map(AccountMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Account not found"));
    }

    public AccountDTO update(Integer id, AccountDTO dto) {
        Account existing = accountRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Account not found"));
        // Update fields only if they have meaningful values
        if (dto.getAccountName() != null && !dto.getAccountName().trim().isEmpty()) {
            existing.setAccountName(dto.getAccountName());
        }
        if (dto.getIndustry() != null && !dto.getIndustry().trim().isEmpty()) {
            existing.setIndustry(dto.getIndustry());
        }
        if (dto.getCountry() != null && !dto.getCountry().trim().isEmpty()) {
            existing.setCountry(dto.getCountry());
        }
        if (dto.getCompanyLocation() != null && !dto.getCompanyLocation().trim().isEmpty()) {
            existing.setCompanyLocation(dto.getCompanyLocation());
        }
        if (dto.getReassignTo() != null) {
            Users reassignToUser = new Users();
            reassignToUser.setUserId(dto.getReassignTo());
            existing.setReassignTo(reassignToUser);
        }
        if (dto.getContactName() != null && !dto.getContactName().trim().isEmpty()) {
            existing.setContactName(dto.getContactName());
        }
        if (dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
            // Check for duplicate email (excluding current account)
            if (accountRepository.existsByEmail(dto.getEmail().trim()) && 
                !dto.getEmail().trim().equals(existing.getEmail())) {
                throw new RuntimeException("Email already exists");
            }
            existing.setEmail(dto.getEmail());
        }
        if (dto.getPhoneNumber() != null && !dto.getPhoneNumber().trim().isEmpty() && !dto.getPhoneNumber().equals("+91 ")) {
            existing.setPhoneNumber(dto.getPhoneNumber());
        }
        if (dto.getJobTitle() != null && !dto.getJobTitle().trim().isEmpty()) {
            existing.setJobTitle(dto.getJobTitle());
        }
        if (dto.getWebsite() != null && !dto.getWebsite().trim().isEmpty()) {
            existing.setWebsite(dto.getWebsite());
        }
        if (dto.getNumberOfEmployees() != null) {
            existing.setNumberOfEmployees(dto.getNumberOfEmployees());
        }
        if (dto.getCreatedBy() != null) {
            Users createdByUser = new Users();
            createdByUser.setUserId(dto.getCreatedBy());
            existing.setCreatedBy(createdByUser);
        }
        Account saved = accountRepository.save(existing);
        
        // Update related contacts with new job title if provided
        if (dto.getJobTitle() != null && !dto.getJobTitle().trim().isEmpty() && 
            dto.getContactName() != null && !dto.getContactName().trim().isEmpty() && 
            dto.getEmail() != null && !dto.getEmail().trim().isEmpty()) {
            List<Contact> relatedContacts = contactRepository.findByAccount_AccountId(id);
            for (Contact contact : relatedContacts) {
                String contactFullName = (contact.getFirstName() != null ? contact.getFirstName() : "") + " " + (contact.getLastName() != null ? contact.getLastName() : "");
                contactFullName = contactFullName.trim();
                
                if (dto.getEmail().equals(contact.getEmail()) || dto.getContactName().equals(contactFullName)) {
                    contact.setDesignation(dto.getJobTitle());
                    contactRepository.save(contact);
                }
            }
        }
        
        // Sync changes to related entities
        leadSyncService.syncAccountUpdate(saved);
        
        return AccountMapper.toDTO(saved);
    }

    public void delete(Integer id) {
        // Backward-compat: default behavior remains non-destructive
        delete(id, false);
    }

    public void delete(Integer id, boolean force) {
        // Check associated deals
        List<Deal> associatedDeals = dealRepository.findByAccount_AccountId(id);
        var contacts = contactRepository.findByAccount_AccountId(id);

        if (!force) {
            if (!associatedDeals.isEmpty()) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete account with " + associatedDeals.size() + " associated deal(s). Please remove or reassign the deals first."
                );
            }
            if (!contacts.isEmpty()) {
                throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Cannot delete account with " + contacts.size() + " associated contact(s). Please remove or reassign the contacts first."
                );
            }
        } else {
            // Force delete: remove children first in safe order
            // 1) Delete deals
            for (Deal d : associatedDeals) {
                dealRepository.deleteById(d.getDealId());
            }
            // 2) Delete contacts
            for (Contact c : contacts) {
                contactRepository.deleteById(c.getContactId());
            }
        }

        try {
            accountRepository.deleteById(id);
        } catch (DataIntegrityViolationException ex) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Cannot delete account due to existing related records.",
                ex
            );
        }
    }

    /**
     * Reassign all data from source account to target account.
     * - Moves or merges contacts into target (by email when available)
     * - Reassigns deals to target and maps their contact to the moved/merged contact
     * - Optionally deletes the source account after reassignment
     */
    public void reassign(Integer sourceAccountId, Integer targetAccountId, boolean moveContacts, boolean deleteSource) {
        if (sourceAccountId == null || targetAccountId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "sourceAccountId and targetAccountId are required");
        }
        if (sourceAccountId.equals(targetAccountId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "source and target account must be different");
        }
        var source = accountRepository.findById(sourceAccountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Source account not found"));
        var target = accountRepository.findById(targetAccountId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target account not found"));

        // Map from old contactId -> new/mapped contact under target
        java.util.Map<Integer, Contact> contactMap = new java.util.HashMap<>();

        var sourceContacts = contactRepository.findByAccount_AccountId(source.getAccountId());

        if (moveContacts) {
            for (Contact c : sourceContacts) {
                String email = c.getEmail();
                if (email != null && !email.isBlank()) {
                    var existingInTarget = contactRepository.findByAccount_AccountIdAndEmail(target.getAccountId(), email);
                    if (existingInTarget.isPresent()) {
                        // Merge: map old contact to the existing target contact
                        contactMap.put(c.getContactId(), existingInTarget.get());
                    } else {
                        // Move: reassign contact to target
                        c.setAccount(target);
                        Contact saved = contactRepository.save(c);
                        contactMap.put(c.getContactId(), saved);
                    }
                } else {
                    // No email -> move as-is
                    c.setAccount(target);
                    Contact saved = contactRepository.save(c);
                    contactMap.put(c.getContactId(), saved);
                }
            }
        } else {
            // Contacts not moved: map only when an equivalent exists in target; otherwise leave unmapped
            for (Contact c : sourceContacts) {
                String email = c.getEmail();
                if (email != null && !email.isBlank()) {
                    var existingInTarget = contactRepository.findByAccount_AccountIdAndEmail(target.getAccountId(), email);
                    existingInTarget.ifPresent(targetContact -> contactMap.put(c.getContactId(), targetContact));
                }
            }
        }

        // Reassign deals
        var sourceDeals = dealRepository.findByAccount_AccountId(source.getAccountId());
        for (Deal d : sourceDeals) {
            d.setAccount(target);
            Contact oldContact = d.getContact();
            if (oldContact != null) {
                Contact mapped = contactMap.get(oldContact.getContactId());
                if (mapped != null) {
                    d.setContact(mapped);
                } else if (moveContacts) {
                    // If moveContacts is true but no mapping found (shouldn't happen), try refreshing
                    // Ensure deal points to a contact under target to keep data consistent
                    var fallback = (oldContact.getAccount() != null && oldContact.getAccount().getAccountId().equals(target.getAccountId()))
                        ? oldContact : null;
                    if (fallback != null) d.setContact(fallback);
                }
            }
            dealRepository.save(d);
        }

        if (deleteSource) {
            // After reassigning deals, delete any remaining contacts under source (should be none if moved)
            if (moveContacts) {
                var remainingContacts = contactRepository.findByAccount_AccountId(source.getAccountId());
                for (Contact c : remainingContacts) {
                    contactRepository.deleteById(c.getContactId());
                }
            }
            try {
                accountRepository.deleteById(source.getAccountId());
            } catch (DataIntegrityViolationException ex) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Could not delete source account after reassignment", ex);
            }
        }
    }

    /** Build an Account from a converted Lead. Enhanced with better deduplication. */
    @Transactional
    public AccountDTO createFromLeadIfMissing(Lead lead, Integer userId) {
        log.debug("\nÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â ACCOUNT CREATION FROM LEAD TRIGGERED!");
        log.debug("{}", "ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Lead ID: " + lead.getLeadId() + ", Status: " + lead.getLeadStatus());
        log.debug("ÃƒÂ¢Ã…Â¡Ã‚Â ÃƒÂ¯Ã‚Â¸Ã‚Â Stack trace:");
        Thread.dumpStack();
        // First, try to find existing account by email
        String email = lead.getEmail();
        if (email != null && !email.trim().isEmpty()) {
            Optional<Account> existingByEmail = accountRepository.findByEmail(email);
            if (existingByEmail.isPresent()) {
                Account existing = existingByEmail.get();
                // Update existing account with lead data if fields are missing
                updateAccountFromLead(existing, lead, userId);
                Account saved = accountRepository.save(existing);
                return AccountMapper.toDTO(saved);
            }
        }

        // Second, try to find existing account by company name
        String companyName = lead.getCompanyName();
        if (companyName != null && !companyName.trim().isEmpty()) {
            Optional<Account> existingByName = accountRepository.findByAccountNameIgnoreCase(companyName.trim());
            if (existingByName.isPresent()) {
                Account existing = existingByName.get();
                // Update existing account with lead data if fields are missing
                updateAccountFromLead(existing, lead, userId);
                Account saved = accountRepository.save(existing);
                return AccountMapper.toDTO(saved);
            }
        }

        // Third, try to find by domain if email is available
        if (email != null && email.contains("@")) {
            String domain = email.substring(email.indexOf("@") + 1);
            List<Account> accountsByDomain = accountRepository.findByEmailContainingIgnoreCase("@" + domain);
            if (!accountsByDomain.isEmpty()) {
                Account existing = accountsByDomain.get(0);
                // Update existing account with lead data if fields are missing
                updateAccountFromLead(existing, lead, userId);
                Account saved = accountRepository.save(existing);
                return AccountMapper.toDTO(saved);
            }
        }

        Account acc = new Account();

        // Map fields with proper null handling
        String leadFullName = (lead.getFirstName() == null ? "" : lead.getFirstName().trim()) +
                              (lead.getLastName() == null ? "" : " " + lead.getLastName().trim());
        leadFullName = leadFullName.trim();
        
        // Ensure contact name is not empty
        if (leadFullName.isEmpty()) {
            leadFullName = "Contact";
        }

        // Ensure accountName is never null or empty
        String accountName = companyName;
        if (accountName == null || accountName.trim().isEmpty()) {
            accountName = leadFullName.isEmpty() ? "Unknown Company" : leadFullName;
        }

        acc.setAccountName(accountName.trim());
        acc.setIndustry(lead.getIndustry());
        acc.setCountry(lead.getCountry());
        acc.setCompanyLocation(lead.getCompanyLocation());
        acc.setNumberOfEmployees(lead.getNumberOfEmployees());
        Users convertingUser = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        acc.setContactName(leadFullName.trim());
        acc.setEmail(lead.getEmail());
        acc.setPhoneNumber(lead.getPhoneNumber()); // map lead phone to mobile
        acc.setCreatedBy(convertingUser);
        
        // Apply ownership rules: if lead was created by Manager/VP, they become the account owner
        Users leadCreator = lead.getCreatedBy();
        if (leadCreator != null && ("Sales_Manager".equals(leadCreator.getRole()) || "Sales_VP".equals(leadCreator.getRole()))) {
            acc.setReassignTo(leadCreator); // Manager/VP becomes permanent owner
        } else if (lead.getAssignedTo() != null) {
            acc.setReassignTo(lead.getAssignedTo()); // Use current lead assignment
        } else {
            acc.setReassignTo(convertingUser); // Fallback to converting user
        }
        
        // Set type to prospect for lead conversion
        acc.setType(Account.AccountType.prospect);
        acc.setStatus(Account.AccountStatus.active);

        Account saved = accountRepository.save(acc);
        
        // Verify the account was saved with a valid ID
        if (saved.getAccountId() == null || saved.getAccountId() <= 0) {
            throw new RuntimeException("Failed to generate valid account ID during lead conversion. Database auto-increment may be corrupted.");
        }
        
        log.debug("{}", "ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â¢ ACCOUNT CREATED FROM LEAD - ID: " + saved.getAccountId() + ", Name: " + saved.getAccountName());
        log.debug("{}", "   Reassign To: " + (saved.getReassignTo() != null ? saved.getReassignTo().getUserId() : "null"));
        log.debug("{}", "   Contact Name: " + saved.getContactName());
        log.debug("{}", "   Email: " + saved.getEmail());
        log.debug("{}", "   Phone Number: " + saved.getPhoneNumber());
        log.debug("{}", "   Created By: " + (saved.getCreatedBy() != null ? saved.getCreatedBy().getUserId() : "null"));
        return AccountMapper.toDTO(saved);
    }

    /** Enhanced method to create account from conversion data - always creates new account */
    @Transactional
    public AccountDTO createFromConversionData(Lead lead, java.util.Map<String, Object> conversionData, Integer userId) {
        // Always create a new account for each lead conversion
        String companyName = (String) conversionData.get("companyName");
        String contactEmail = (String) conversionData.get("contactEmail");

        Account acc = new Account();

        // Use conversion data with fallbacks to lead data
        if (companyName == null || companyName.trim().isEmpty()) {
            companyName = lead.getCompanyName();
            if (companyName == null || companyName.trim().isEmpty()) {
                // Final fallback: use lead name as company name
                String leadName = (lead.getFirstName() != null ? lead.getFirstName() : "") + 
                                 (lead.getLastName() != null ? " " + lead.getLastName() : "");
                companyName = leadName.trim().isEmpty() ? "Unknown Company" : leadName.trim();
            }
        }

        acc.setAccountName(companyName.trim());
        acc.setIndustry((String) conversionData.get("industry"));
        if (acc.getIndustry() == null) {
            acc.setIndustry(lead.getIndustry());
        }

        acc.setCountry((String) conversionData.get("country"));
        if (acc.getCountry() == null) {
            acc.setCountry(lead.getCountry());
        }

        acc.setCompanyLocation((String) conversionData.get("companyLocation"));
        if (acc.getCompanyLocation() == null) {
            acc.setCompanyLocation(lead.getCompanyLocation());
        }

        // Set createdBy to the converting user
        Users convertingUser = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
    
        acc.setContactName((String) conversionData.get("contactName"));
        if (acc.getContactName() == null || acc.getContactName().trim().isEmpty()) {
            acc.setContactName(lead.getFirstName() + " " + lead.getLastName());
        }
        acc.setEmail(contactEmail);
        if (acc.getEmail() == null) {
            acc.setEmail(lead.getEmail());
        }
        acc.setPhoneNumber((String) conversionData.get("contactPhone"));
        if (acc.getPhoneNumber() == null) {
            acc.setPhoneNumber(lead.getPhoneNumber());
        }
        acc.setWebsite((String) conversionData.get("website"));
        acc.setNumberOfEmployees(lead.getNumberOfEmployees());
        
        // Apply ownership rules: if lead was created by Manager/VP, they become the account owner
        Users leadCreator = lead.getCreatedBy();
        if (leadCreator != null && ("Sales_Manager".equals(leadCreator.getRole()) || "Sales_VP".equals(leadCreator.getRole()))) {
            acc.setCreatedBy(leadCreator); // Manager/VP becomes the creator (owner)
            acc.setReassignTo(lead.getAssignedTo() != null ? lead.getAssignedTo() : convertingUser); // Executive who uploaded gets assignment
        } else {
            acc.setCreatedBy(convertingUser);
            if (lead.getAssignedTo() != null) {
                acc.setReassignTo(lead.getAssignedTo()); // Use current lead assignment
            } else {
                acc.setReassignTo(convertingUser); // Fallback to converting user
            }
        }
        
        // Set type to prospect for lead conversion
        acc.setType(Account.AccountType.prospect);
        acc.setStatus(Account.AccountStatus.active);

        Account saved = accountRepository.save(acc);
        
        // Verify the account was saved with a valid ID
        if (saved.getAccountId() == null || saved.getAccountId() <= 0) {
            throw new RuntimeException("Failed to generate valid account ID during conversion. Database auto-increment may be corrupted.");
        }
        
        log.debug("{}", "ÃƒÂ°Ã…Â¸Ã‚ÂÃ‚Â¢ ACCOUNT CREATED FROM CONVERSION DATA - ID: " + saved.getAccountId() + ", Name: " + saved.getAccountName());
        log.debug("{}", "   Reassign To: " + (saved.getReassignTo() != null ? saved.getReassignTo().getUserId() : "null"));
        log.debug("{}", "   Contact Name: " + saved.getContactName());
        log.debug("{}", "   Email: " + saved.getEmail());
        log.debug("{}", "   Phone Number: " + saved.getPhoneNumber());
        log.debug("{}", "   Created By: " + (saved.getCreatedBy() != null ? saved.getCreatedBy().getUserId() : "null"));
        return AccountMapper.toDTO(saved);
    }

    /** Update existing account with conversion data if fields are missing */
    private void updateAccountFromConversionData(Account account, Lead lead, java.util.Map<String, Object> conversionData, Integer userId) {
        Users convertingUser = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Apply ownership rules for account updates
        Users leadCreator = lead.getCreatedBy();
        if (leadCreator != null && ("Sales_Manager".equals(leadCreator.getRole()) || "Sales_VP".equals(leadCreator.getRole()))) {
            account.setReassignTo(leadCreator); // Manager/VP becomes permanent owner
        } else if (account.getReassignTo() == null) {
            if (lead.getAssignedTo() != null) {
                account.setReassignTo(lead.getAssignedTo());
            } else {
                account.setReassignTo(convertingUser);
            }
        }

        String contactName = (String) conversionData.get("contactName");
        if (account.getContactName() == null || account.getContactName().trim().isEmpty()) {
            if (contactName != null && !contactName.trim().isEmpty()) {
                account.setContactName(contactName);
            } else {
                account.setContactName(lead.getFirstName() + " " + lead.getLastName());
            }
        }

        String contactEmail = (String) conversionData.get("contactEmail");
        if (account.getEmail() == null || account.getEmail().trim().isEmpty()) {
            if (contactEmail != null && !contactEmail.trim().isEmpty()) {
                account.setEmail(contactEmail);
            } else {
                account.setEmail(lead.getEmail());
            }
        }

        String contactPhone = (String) conversionData.get("contactPhone");
        if (account.getPhoneNumber() == null || account.getPhoneNumber().trim().isEmpty()) {
            if (contactPhone != null && !contactPhone.trim().isEmpty()) {
                account.setPhoneNumber(contactPhone);
            } else {
                account.setPhoneNumber(lead.getPhoneNumber());
            }
        }

        if (account.getCreatedBy() == null) {
            account.setCreatedBy(convertingUser);
        }

        // Update other fields if missing
        String industry = (String) conversionData.get("industry");
        if (account.getIndustry() == null || account.getIndustry().trim().isEmpty()) {
            if (industry != null && !industry.trim().isEmpty()) {
                account.setIndustry(industry);
            } else {
                account.setIndustry(lead.getIndustry());
            }
        }

        String country = (String) conversionData.get("country");
        if (account.getCountry() == null || account.getCountry().trim().isEmpty()) {
            if (country != null && !country.trim().isEmpty()) {
                account.setCountry(country);
            } else {
                account.setCountry(lead.getCountry());
            }
        }

        String companyLocation = (String) conversionData.get("companyLocation");
        if (account.getCompanyLocation() == null || account.getCompanyLocation().trim().isEmpty()) {
            if (companyLocation != null && !companyLocation.trim().isEmpty()) {
                account.setCompanyLocation(companyLocation);
            } else {
                account.setCompanyLocation(lead.getCompanyLocation());
            }
        }

        if (account.getNumberOfEmployees() == null) {
            account.setNumberOfEmployees(lead.getNumberOfEmployees());
        }

        log.debug("{}", "ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬Å¾ UPDATING EXISTING ACCOUNT FROM CONVERSION DATA - ID: " + account.getAccountId());
    }

    /** Find existing account by various criteria for deduplication */
    public Optional<AccountDTO> findExistingAccount(String companyName, String email, String domain) {
        // Try by email first
        if (email != null && !email.trim().isEmpty()) {
            Optional<Account> byEmail = accountRepository.findByEmail(email);
            if (byEmail.isPresent()) {
                return Optional.of(AccountMapper.toDTO(byEmail.get()));
            }
        }

        // Try by company name
        if (companyName != null && !companyName.trim().isEmpty()) {
            Optional<Account> byName = accountRepository.findByAccountNameIgnoreCase(companyName.trim());
            if (byName.isPresent()) {
                return Optional.of(AccountMapper.toDTO(byName.get()));
            }
        }

        // Try by domain
        if (domain != null && !domain.trim().isEmpty()) {
            List<Account> byDomain = accountRepository.findByEmailContainingIgnoreCase("@" + domain);
            if (!byDomain.isEmpty()) {
                return Optional.of(AccountMapper.toDTO(byDomain.get(0)));
            }
        }

        return Optional.empty();
    }

    /** Calculate and update account revenue based on associated deals */
    @Transactional
    public AccountDTO updateAccountRevenue(Integer accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("Account not found"));

        // Calculate total revenue from all deals associated with this account
        List<Deal> deals = dealRepository.findByAccount_AccountId(accountId);
        java.math.BigDecimal totalRevenue = deals.stream()
            .filter(deal -> deal.getDealValue() != null)
            .map(Deal::getDealValue)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Update account revenue (assuming Account entity has a revenue field)
        // If not, this could be stored in a separate table or calculated on-the-fly
        // For now, we'll calculate the revenue. In a real implementation, you'd update the account entity
        // account.setRevenue(totalRevenue);
        // Account saved = accountRepository.save(account);

        return AccountMapper.toDTO(account);
    }

    /** Get account statistics including revenue and contact count */
    public java.util.Map<String, Object> getAccountStats(Integer accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("Account not found"));

        // Count contacts
        var contacts = contactRepository.findByAccount_AccountId(accountId);
        int contactCount = contacts.size();

        // Calculate revenue from deals
        List<Deal> deals = dealRepository.findByAccount_AccountId(accountId);
        java.math.BigDecimal totalRevenue = deals.stream()
            .filter(deal -> deal.getDealValue() != null)
            .map(Deal::getDealValue)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        // Count deals by stage
        java.util.Map<String, Long> dealsByStage = deals.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                deal -> deal.getStage() != null ? deal.getStage().name() : "UNKNOWN",
                java.util.stream.Collectors.counting()
            ));

        java.util.Map<String, Object> stats = new java.util.HashMap<>();
        stats.put("accountId", accountId);
        stats.put("accountName", account.getAccountName());
        stats.put("contactCount", contactCount);
        stats.put("totalRevenue", totalRevenue);
        stats.put("dealCount", deals.size());
        stats.put("dealsByStage", dealsByStage);

        return stats;
    }

    /** Refresh all account revenues (useful for batch updates) */
    @Transactional
    public void refreshAllAccountRevenues() {
        List<Account> allAccounts = accountRepository.findAll();
        for (Account account : allAccounts) {
            updateAccountRevenue(account.getAccountId());
        }
    }
    
    /** Update existing account with lead data if fields are missing */
    private void updateAccountFromLead(Account account, Lead lead, Integer userId) {
        Users convertingUser = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        
        // Apply ownership rules for account updates
        Users leadCreator = lead.getCreatedBy();
        if (leadCreator != null && ("Sales_Manager".equals(leadCreator.getRole()) || "Sales_VP".equals(leadCreator.getRole()))) {
            account.setReassignTo(leadCreator); // Manager/VP becomes permanent owner
        } else if (account.getReassignTo() == null) {
            if (lead.getAssignedTo() != null) {
                account.setReassignTo(lead.getAssignedTo());
            } else {
                account.setReassignTo(convertingUser);
            }
        }
        
        if (account.getContactName() == null || account.getContactName().trim().isEmpty()) {
            String leadFullName = (lead.getFirstName() == null ? "" : lead.getFirstName().trim()) +
                                  (lead.getLastName() == null ? "" : " " + lead.getLastName().trim());
            leadFullName = leadFullName.trim();
            if (leadFullName.isEmpty()) {
                leadFullName = "Contact";
            }
            account.setContactName(leadFullName);
        }
        
        if (account.getEmail() == null || account.getEmail().trim().isEmpty()) {
            account.setEmail(lead.getEmail());
        }
        
        if (account.getPhoneNumber() == null || account.getPhoneNumber().trim().isEmpty()) {
            account.setPhoneNumber(lead.getPhoneNumber());
        }
        
        if (account.getCreatedBy() == null) {
            account.setCreatedBy(convertingUser);
        }
        
        // Update other fields if missing
        if (account.getIndustry() == null || account.getIndustry().trim().isEmpty()) {
            account.setIndustry(lead.getIndustry());
        }
        
        if (account.getCountry() == null || account.getCountry().trim().isEmpty()) {
            account.setCountry(lead.getCountry());
        }
        
        if (account.getCompanyLocation() == null || account.getCompanyLocation().trim().isEmpty()) {
            account.setCompanyLocation(lead.getCompanyLocation());
        }
        
        if (account.getNumberOfEmployees() == null) {
            account.setNumberOfEmployees(lead.getNumberOfEmployees());
        }
        
        log.debug("{}", "ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬Å¾ UPDATING EXISTING ACCOUNT - ID: " + account.getAccountId() + " with lead data");
    }
    
    private List<AccountDTO> getAccountsForHierarchy(List<Integer> userIds, String search) {
        log.debug("Hierarchy Account Visibility - User IDs: {}", userIds);
        
        List<Account> hierarchyAccounts = accountRepository.findAll().stream()
            .filter(account -> {
                // Account belongs to hierarchy if:
                // 1. Created by someone in the hierarchy
                // 2. Assigned to someone in the hierarchy
                boolean isCreatedByHierarchy = account.getCreatedBy() != null && userIds.contains(account.getCreatedBy().getUserId());
                boolean isAssignedToHierarchy = account.getReassignTo() != null && userIds.contains(account.getReassignTo().getUserId());
                return isCreatedByHierarchy || isAssignedToHierarchy;
            })
            .collect(Collectors.toList());
        
        log.debug("Total hierarchy visible accounts: {}", hierarchyAccounts.size());
        return hierarchyAccounts.stream()
            .distinct()
            .map(AccountMapper::toDTO)
            .collect(Collectors.toList());
    }
    
    private List<Integer> getExecutiveIdsUnderVP(Integer vpId) {
        List<Integer> executiveIds = usersRepository.findByManagerId(vpId).stream()
                .filter(user -> "Sales_Manager".equals(user.getRole()))
                .flatMap(manager -> usersRepository.findByManagerId(manager.getUserId()).stream())
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .map(user -> user.getUserId())
                .collect(Collectors.toList());

        log.debug("{}", "   VP " + vpId + " has " + executiveIds.size() + " executives under their managers");
        return executiveIds;
    }  

    
    public String createTestData(Integer currentUserId, String currentUserRole) {
        return "Test data creation disabled. Only real data will be displayed.";
    }
    
    public String checkDatabaseStatus() {
        StringBuilder status = new StringBuilder("Database Status:\n");
        
        try {
            List<Account> allAccounts = accountRepository.findAll();
            status.append("Total accounts in database: ").append(allAccounts.size()).append("\n");
            
            if (allAccounts.size() > 0) {
                status.append("Sample accounts:\n");
                for (int i = 0; i < Math.min(5, allAccounts.size()); i++) {
                    Account acc = allAccounts.get(i);
                    status.append("- ID: ").append(acc.getAccountId())
                          .append(", Name: ").append(acc.getAccountName())
                          .append(", Created By: ").append(acc.getCreatedBy() != null ? acc.getCreatedBy().getUserId() : "null")
                          .append("\n");
                }
            } else {
                status.append("No accounts found in database. This explains why Sales Manager sees 0 accounts.\n");
                status.append("You need to:\n");
                status.append("1. Create accounts manually through the UI\n");
                status.append("2. Convert leads to accounts\n");
                status.append("3. Import accounts from external source\n");
            }
            
        } catch (Exception e) {
            status.append("Error checking database: ").append(e.getMessage()).append("\n");
        }
        
        return status.toString();
    }
    
    public Double calculateRevenue(Integer accountId) {
        List<Deal> allDeals = dealRepository.findByAccount_AccountId(accountId);
        log.debug("{}", "Total deals for account " + accountId + ": " + allDeals.size());
        
        for (Deal deal : allDeals) {
            log.debug("{}", "Deal ID: " + deal.getDealId() + ", Stage: " + deal.getStage() + ", Value: " + deal.getDealValue());
        }
        
        List<Deal> wonDeals = allDeals.stream()
            .filter(deal -> deal.getStage() == Deal.Stage.Closed_Won)
            .collect(Collectors.toList());
        
        log.debug("{}", "Won deals count: " + wonDeals.size());
        
        return wonDeals.stream()
            .filter(deal -> deal.getDealValue() != null)
            .map(Deal::getDealValue)
            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add)
            .doubleValue();
    }
    
    public Double calculateTotalDealValue(Integer accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        return leadRepository.sumProspectValueByAccountName(account.getAccountName());
    }
    
    public java.util.Map<String, Object> debugRevenue(Integer accountId) {
        Account account = accountRepository.findById(accountId)
            .orElseThrow(() -> new RuntimeException("Account not found"));
        
        String accountName = account.getAccountName();
        List<Lead> leads = leadRepository.findByCompanyNameInIgnoreCase(List.of(accountName));
        Double totalRevenue = leadRepository.sumProspectValueByAccountName(accountName);
        
        java.util.Map<String, Object> debug = new java.util.HashMap<>();
        debug.put("accountId", accountId);
        debug.put("accountName", accountName);
        debug.put("leadsFound", leads.size());
        debug.put("totalRevenue", totalRevenue);
        debug.put("leadDetails", leads.stream().map(l -> 
            java.util.Map.of(
                "leadId", l.getLeadId(),
                "companyName", l.getCompanyName(),
                "prospectValue", l.getProspectValue() != null ? l.getProspectValue() : 0
            )
        ).collect(Collectors.toList()));
        
        return debug;
    }



}