package com.techtammina.crm.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.techtammina.crm.dto.ContactDTO;
import com.techtammina.crm.entity.Account;
import com.techtammina.crm.entity.Contact;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.mapper.ContactMapper;
import com.techtammina.crm.repository.AccountRepository;
import com.techtammina.crm.repository.ContactRepository;
import com.techtammina.crm.repository.DealRepository;
import com.techtammina.crm.repository.UsersRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;

    private final AccountRepository accountRepository;
    private final UsersRepository usersRepository;
    private final LeadSyncService leadSyncService;

    public ContactService(ContactRepository contactRepository, DealRepository dealRepository, AccountRepository accountRepository, UsersRepository usersRepository, LeadSyncService leadSyncService) {
        this.contactRepository = contactRepository;
        this.dealRepository = dealRepository;
        this.accountRepository = accountRepository;
        this.usersRepository = usersRepository;
        this.leadSyncService = leadSyncService;
    }

    @Transactional
    public ContactDTO create(ContactDTO dto, Integer userId) {
        if (dto.getAccountId() == null) {
            throw new RuntimeException("AccountId must be provided for Contact creation");
        }

        // Check for duplicate email
        if (dto.getEmail() != null && contactRepository.existsByEmail(dto.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Fetch the account within the transaction
        Account account = accountRepository.findById(dto.getAccountId())
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + dto.getAccountId()));

        Contact contact = ContactMapper.toEntity(dto);
        contact.setAccount(account);
        
        // Set defaults for type and status if not provided
        if (contact.getType() == null) contact.setType(Contact.ContactType.lead);
        if (contact.getStatus() == null) contact.setStatus(Contact.ContactStatus.active);

        // Set createdBy if userId provided - reassignTo is set during reassignment
        if (userId != null) {
            Users user = usersRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
            contact.setCreatedBy(user);
            // reassignTo is not set here - only during reassignment
        }

        Contact saved = contactRepository.save(contact);
        return ContactMapper.toDTO(saved);
    }

    public List<ContactDTO> list() {
        return contactRepository.findAll().stream().map(ContactMapper::toDTO).collect(Collectors.toList());
    }

    public List<ContactDTO> listFiltered(String search, Integer userId, String userRole) {
        log.info("ContactService.listFiltered called with userId={}, userRole={}, search={}", userId, userRole, search);
        
        List<Contact> allContacts = contactRepository.findAll();
        log.info("Total contacts in database: {}", allContacts.size());
        
        String role = (userRole == null ? "" : userRole).trim();
        String normalized = role.toUpperCase().replace(' ', '_');
        log.info("Normalized role: {}", normalized);

        if ("IT_ADMIN".equals(normalized)) {
            log.info("Admin role - returning all {} contacts", allContacts.size());
            return allContacts.stream().map(ContactMapper::toDTO).collect(Collectors.toList());
        }
        if ("SALES_VP".equals(normalized)) {
            log.info("Sales VP role - filtering contacts for VP hierarchy");
            List<Contact> vpContacts = getContactsForVP(userId, search);
            log.info("Found {} contacts for VP's hierarchy", vpContacts.size());
            return vpContacts.stream().map(ContactMapper::toDTO).collect(Collectors.toList());
        }
        if ("SALES_MANAGER".equals(normalized)) {
            log.info("Sales Manager role - filtering contacts for managerId={}", userId);
            // Manager sees contacts created by executives under them + contacts owned by manager
            List<Contact> teamContacts = (search != null && !search.trim().isEmpty()) 
                ? contactRepository.findByManagerIdAndSearch(userId, search.trim())
                : contactRepository.findByManagerId(userId);
            
            // Add contacts owned by the manager themselves (created_by or reassign_to)
            List<Contact> managerOwnedContacts = contactRepository.findAll().stream()
                .filter(contact -> {
                    // Contact is owned by manager if reassignTo OR createdBy is the manager
                    return (contact.getReassignTo() != null && contact.getReassignTo().getUserId().equals(userId)) ||
                           (contact.getCreatedBy() != null && contact.getCreatedBy().getUserId().equals(userId));
                })
                .collect(Collectors.toList());
            
            // Add contacts assigned to executives under this manager
            List<Integer> executiveIdsUnderManager = usersRepository.findByManagerId(userId).stream()
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .map(user -> user.getUserId())
                .collect(Collectors.toList());
            
            List<Contact> executiveAssignedContacts = contactRepository.findAll().stream()
                .filter(contact -> contact.getReassignTo() != null && 
                    executiveIdsUnderManager.contains(contact.getReassignTo().getUserId()))
                .collect(Collectors.toList());
            
            log.info("Manager {} sees {} contacts assigned to executives under them", userId, executiveAssignedContacts.size());
            
            // Combine and deduplicate
            List<Contact> combinedContacts = new java.util.ArrayList<>(teamContacts);
            combinedContacts.addAll(managerOwnedContacts);
            combinedContacts.addAll(executiveAssignedContacts);
            List<Contact> contacts = combinedContacts.stream().distinct().collect(Collectors.toList());
            
            log.info("Found {} contacts for manager (team: {}, owned: {})", contacts.size(), teamContacts.size(), managerOwnedContacts.size());
            List<ContactDTO> dtos = contacts.stream().map(ContactMapper::toDTO).collect(Collectors.toList());
            log.info("Converted to {} DTOs", dtos.size());
            if (!dtos.isEmpty()) {
                log.info("First contact DTO: id={}, name={} {}, email={}", 
                    dtos.get(0).getContactId(), 
                    dtos.get(0).getFirstName(), 
                    dtos.get(0).getLastName(),
                    dtos.get(0).getEmail());
            }
            return dtos;
        }
        if ("SALES_EXECUTIVE".equals(normalized)) {
            log.info("Sales Executive role - filtering contacts for userId={}", userId);
            
            // Use native SQL query to ensure it works
            List<Contact> executiveContacts = contactRepository.findAllContactsForExecutiveNative(userId);
            log.info("Found {} total contacts for executive using NATIVE query", executiveContacts.size());
            
            // Debug: Also test individual native query
            List<Contact> assignedOnly = contactRepository.findContactsAssignedToExecutive(userId);
            log.info("Debug - Contacts assigned to executive (reassign_to={}): {}", userId, assignedOnly.size());
            
            // Debug: Log ALL contacts before DTO conversion
            log.info("=== ALL {} CONTACTS BEFORE DTO CONVERSION ===", executiveContacts.size());
            for (int i = 0; i < executiveContacts.size(); i++) {
                Contact c = executiveContacts.get(i);
                log.info("Contact {}: ID={}, name={} {}, email={}, created_by={}, reassign_to={}", 
                    i+1, c.getContactId(), c.getFirstName(), c.getLastName(), c.getEmail(),
                    c.getCreatedBy() != null ? c.getCreatedBy().getUserId() : "null",
                    c.getReassignTo() != null ? c.getReassignTo().getUserId() : "null");
            }
            
            // Convert to DTOs with error handling
            List<ContactDTO> dtos = new java.util.ArrayList<>();
            for (Contact contact : executiveContacts) {
                try {
                    ContactDTO dto = ContactMapper.toDTO(contact);
                    dtos.add(dto);
                } catch (Exception e) {
                    log.error("Failed to convert contact ID {} to DTO: {}", contact.getContactId(), e.getMessage());
                    log.error("Contact details - name: {} {}, account: {}, createdBy: {}, reassignTo: {}", 
                        contact.getFirstName(), contact.getLastName(),
                        contact.getAccount() != null ? contact.getAccount().getAccountId() : "null",
                        contact.getCreatedBy() != null ? contact.getCreatedBy().getUserId() : "null",
                        contact.getReassignTo() != null ? contact.getReassignTo().getUserId() : "null");
                }
            }
            log.info("=== AFTER DTO CONVERSION: {} DTOs ===", dtos.size());
            
            if (dtos.size() != executiveContacts.size()) {
                log.error("DTO CONVERSION LOST CONTACTS! Before: {}, After: {}", executiveContacts.size(), dtos.size());
            }
            
            return dtos;
        }
        log.info("No matching role - returning empty list");
        return List.of();
    }

    public List<ContactDTO> listByAccountId(Integer accountId) {
        return contactRepository.findByAccount_AccountId(accountId).stream().map(ContactMapper::toDTO).collect(Collectors.toList());
    }

    public ContactDTO get(Integer id) {
        return contactRepository.findById(id)
                .map(ContactMapper::toDTO)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
    }

    @Transactional
    public ContactDTO update(Integer id, ContactDTO dto, Integer userId) {
        Contact existing = contactRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Contact not found"));

        // Update fields - only update if value is provided
        if (dto.getFirstName() != null) existing.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) existing.setLastName(dto.getLastName());
        if (dto.getEmail() != null) existing.setEmail(dto.getEmail());
        if (dto.getCountryCode() != null) existing.setCountryCode(dto.getCountryCode());
        if (dto.getPhoneNumber() != null) existing.setPhoneNumber(dto.getPhoneNumber());
        if (dto.getDesignation() != null) existing.setDesignation(dto.getDesignation());
        if (dto.getLinkedin() != null) existing.setLinkedin(dto.getLinkedin());
        if (dto.getRemarks() != null) existing.setRemarks(dto.getRemarks());
        if (dto.getType() != null) {
            try {
                existing.setType(Contact.ContactType.valueOf(dto.getType().toLowerCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid contact type: " + dto.getType());
            }
        }
        if (dto.getStatus() != null) {
            try {
                existing.setStatus(Contact.ContactStatus.valueOf(dto.getStatus().toLowerCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid contact status: " + dto.getStatus());
            }
        }

        // Update account if provided
        if (dto.getAccountId() != null && !dto.getAccountId().equals(existing.getAccount().getAccountId())) {
            Account account = accountRepository.findById(dto.getAccountId())
                    .orElseThrow(() -> new RuntimeException("Account not found with id: " + dto.getAccountId()));
            existing.setAccount(account);
        }

        Contact saved = contactRepository.save(existing);
        
        // Sync changes to related entities
        leadSyncService.syncContactUpdate(saved);
        
        return ContactMapper.toDTO(saved);
    }

    @Transactional
    public ContactDTO updateRemarks(Integer contactId, String remarks, Integer userId, String userRole) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));

        // Permission check: only reassign_to can edit remarks, or higher roles
        if (!isAuthorizedToEditRemarks(contact, userId, userRole)) {
            throw new RuntimeException("Unauthorized: Only the assigned sales executive can edit remarks");
        }

        contact.setRemarks(remarks);
        Contact saved = contactRepository.save(contact);
        return ContactMapper.toDTO(saved);
    }

    private boolean isAuthorizedToEditRemarks(Contact contact, Integer userId, String userRole) {
        // Higher roles can edit
        if ("Sales_Manager".equals(userRole) || "Sales_VP".equals(userRole) || "IT_Admin".equals(userRole)) {
            return true;
        }
        // Sales_Executive can edit if they are the reassign_to OR the creator (when reassign_to is null)
        if ("Sales_Executive".equals(userRole)) {
            // Check if user is the reassigned owner
            if (contact.getReassignTo() != null && contact.getReassignTo().getUserId().equals(userId)) {
                return true;
            }
            // Check if user is the creator (when no reassignment has occurred)
            if (contact.getReassignTo() == null && contact.getCreatedBy() != null && contact.getCreatedBy().getUserId().equals(userId)) {
                return true;
            }
        }
        return false;
    }

    public void delete(Integer id) {
        // First, delete all deals associated with this contact
        List<Deal> relatedDeals = dealRepository.findByContact_ContactId(id);
        if (!relatedDeals.isEmpty()) {
            dealRepository.deleteAll(relatedDeals);
        }

        // Then delete the contact
        contactRepository.deleteById(id);
    }

    // Helper method for robust role checking
    private boolean isManagerOrVP(String role) {
        if (role == null) return false;
        String normalizedRole = role.toUpperCase().replace(" ", "_").replace("-", "_");
        return normalizedRole.contains("MANAGER") || normalizedRole.contains("VP") || 
               normalizedRole.contains("SALES_MANAGER") || normalizedRole.contains("SALES_VP");
    }

    /** Idempotent: ensure one Contact per (accountId, email). */
    @Transactional
    public ContactDTO createFromLeadIfMissing(Integer accountId, Lead lead, Integer userId) {
        String email = lead.getEmail();
        if (email != null && contactRepository.existsByAccount_AccountIdAndEmail(accountId, email)) {
            return contactRepository.findByAccount_AccountIdAndEmail(accountId, email).map(ContactMapper::toDTO).orElse(null);
        }

        Contact c = new Contact();

        // Ensure firstName is never null (required field)
        String firstName = lead.getFirstName();
        if (firstName == null || firstName.trim().isEmpty()) {
            firstName = "Unknown";
        }
        c.setFirstName(firstName);

        c.setLastName(lead.getLastName());
        c.setEmail(lead.getEmail());
        
        // Preserve the lead's country code and phone number separately
        c.setCountryCode(lead.getCountryCode() != null ? lead.getCountryCode() : "+91");
        c.setPhoneNumber(lead.getPhoneNumber());
        
        c.setDesignation(null); // map from lead jobTitle if you added that field
        c.setLinkedin(null);

        // Set the account using the accountId - fetch the managed entity
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + accountId));
        c.setAccount(account);

        // Set createdBy to the converting user
        Users convertingUser = usersRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Apply ownership rules: if lead was created by Manager/VP, they own the contact
        Users leadCreator = lead.getCreatedBy();
        if (leadCreator != null && isManagerOrVP(leadCreator.getRole())) {
            c.setCreatedBy(leadCreator);
            // Manager/VP created it, but assign to converting executive for work
            c.setReassignTo(convertingUser);
        } else {
            c.setCreatedBy(convertingUser);
            c.setReassignTo(convertingUser);
        }

        
        // Set type to prospect for lead conversion
        c.setType(Contact.ContactType.prospect);
        c.setStatus(Contact.ContactStatus.active);

        Contact saved = contactRepository.save(c);
        
        // Verify the contact was saved with a valid ID
        if (saved.getContactId() == null || saved.getContactId() <= 0) {
            throw new RuntimeException("Failed to generate valid contact ID during lead conversion. Database auto-increment may be corrupted.");
        }
        
        log.debug("{}", "Ã¢Å“â€¦ CONTACT CREATED FROM LEAD - ID: " + saved.getContactId() + ", Name: " + saved.getFirstName() + " " + saved.getLastName());
        return ContactMapper.toDTO(saved);
    }

    /** Create contact from conversion data with deduplication */
    @Transactional
    public ContactDTO createFromConversionData(Integer accountId, Lead lead, java.util.Map<String, Object> conversionData, Integer userId) {
        String email = (String) conversionData.get("contactEmail");
        if (email == null || email.trim().isEmpty()) {
            email = lead.getEmail();
        }
        if (email != null && contactRepository.existsByAccount_AccountIdAndEmail(accountId, email)) {
            Contact existing = contactRepository.findByAccount_AccountIdAndEmail(accountId, email).orElse(null);
            if (existing != null) {
                log.debug("{}", "Ã¢Å“â€¦ CONTACT EXISTS - ID: " + existing.getContactId() + ", Name: " + existing.getFirstName() + " " + existing.getLastName());
                return ContactMapper.toDTO(existing);
            }
        }

        Contact c = new Contact();

        // Use conversion data with fallbacks to lead data
        String firstName = (String) conversionData.get("contactName");
        if (firstName != null && !firstName.trim().isEmpty()) {
            // Split name into first and last
            String[] nameParts = firstName.trim().split("\\s+", 2);
            c.setFirstName(nameParts[0]);
            if (nameParts.length > 1) {
                c.setLastName(nameParts[1]);
            }
        } else {
            // Fallback to lead data
            c.setFirstName(lead.getFirstName());
            c.setLastName(lead.getLastName());
        }

        // Ensure firstName is never null
        if (c.getFirstName() == null || c.getFirstName().trim().isEmpty()) {
            c.setFirstName("Unknown");
        }

        c.setEmail(email);
        
        // Handle country code and phone number separately
        String contactPhone = (String) conversionData.get("contactPhone");
        String contactCountryCode = (String) conversionData.get("contactCountryCode");
        
        if (contactPhone != null && !contactPhone.trim().isEmpty()) {
            c.setPhoneNumber(contactPhone);
            // Use provided country code or default to lead's country code
            if (contactCountryCode != null && !contactCountryCode.trim().isEmpty()) {
                c.setCountryCode(contactCountryCode);
            } else {
                c.setCountryCode(lead.getCountryCode() != null ? lead.getCountryCode() : "+91");
            }
        } else {
            // Fallback to lead data - preserve country code and phone number separately
            c.setCountryCode(lead.getCountryCode() != null ? lead.getCountryCode() : "+91");
            c.setPhoneNumber(lead.getPhoneNumber());
        }
        c.setDesignation((String) conversionData.get("contactDesignation"));
        if (c.getDesignation() == null) {
            c.setDesignation(lead.getDesignation());
        }
        c.setLinkedin((String) conversionData.get("contactLinkedIn"));
        if (c.getLinkedin() == null) {
            c.setLinkedin(lead.getLinkedin());
        }

        // Set the account using the accountId - fetch the managed entity
        Account account = accountRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + accountId));
        c.setAccount(account);

        // Set createdBy to the converting user
        Users convertingUser = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        // Apply ownership rules: if lead was created by Manager/VP, they own the contact
        Users leadCreator = lead.getCreatedBy();
        if (leadCreator != null && isManagerOrVP(leadCreator.getRole())) {
            c.setCreatedBy(leadCreator);
            // Manager/VP created it, but assign to converting executive for work
            c.setReassignTo(convertingUser);
        } else {
            c.setCreatedBy(convertingUser);
            c.setReassignTo(convertingUser);
        }
        
        // Set type to prospect for lead conversion
        c.setType(Contact.ContactType.prospect);
        c.setStatus(Contact.ContactStatus.active);

        Contact saved = contactRepository.save(c);
        
        // Verify the contact was saved with a valid ID
        if (saved.getContactId() == null || saved.getContactId() <= 0) {
            throw new RuntimeException("Failed to generate valid contact ID during conversion. Database auto-increment may be corrupted.");
        }
        
        log.debug("{}", "Ã¢Å“â€¦ CONTACT CREATED FROM CONVERSION DATA - ID: " + saved.getContactId() + ", Name: " + saved.getFirstName() + " " + saved.getLastName());
        log.debug("{}", "   Account: " + (saved.getAccount() != null ? saved.getAccount().getAccountName() : "null"));
        log.debug("{}", "   Email: " + saved.getEmail());
        log.debug("{}", "   Phone: " + saved.getPhoneNumber());
        return ContactMapper.toDTO(saved);
    }

    public String getOwnerEmail(Integer contactId) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        
        if (contact.getReassignTo() != null) {
            return contact.getReassignTo().getEmail();
        }
        
        throw new RuntimeException("No owner assigned to this contact");
    }
    
    @Transactional
    public void updateOwnershipFromLeadReassignment(Lead lead, Integer newAssignedToId) {
        if (newAssignedToId == null) {
            return;
        }
        
        Users newOwner = usersRepository.findById(newAssignedToId)
                .orElseThrow(() -> new RuntimeException("New owner not found"));
        
        // Allow reassignment for all leads - Manager/VP can reassign to executives
        log.info("Updating ownership for lead {} created by: {}, reassigning to: {}", 
            lead.getLeadId(),
            lead.getCreatedBy() != null ? lead.getCreatedBy().getRole() : "unknown", 
            newOwner.getRole());
        
        // Update contact owner if lead was converted to contact
        if (lead.getConvertedContactId() != null) {
            Contact contact = contactRepository.findById(lead.getConvertedContactId()).orElse(null);
            if (contact != null) {
                // If original creator is Sales_Executive, update created_by to new executive
                if (contact.getCreatedBy() != null && "Sales_Executive".equals(contact.getCreatedBy().getRole().toString())) {
                    contact.setCreatedBy(newOwner);
                    log.info("✅ Updated contact {} created_by to user {} (original creator was Sales_Executive)", contact.getContactId(), newOwner.getUserId());
                }
                contact.setReassignTo(newOwner);
                contactRepository.save(contact);
                log.info("✅ Updated contact {} ownership to user {}", contact.getContactId(), newOwner.getUserId());
            }
        }
        
        // Update account owner if lead was converted to account
        if (lead.getConvertedAccountId() != null) {
            Account account = accountRepository.findById(lead.getConvertedAccountId()).orElse(null);
            if (account != null) {
                // If original creator is Sales_Executive, update created_by to new executive
                if (account.getCreatedBy() != null && "Sales_Executive".equals(account.getCreatedBy().getRole().toString())) {
                    account.setCreatedBy(newOwner);
                    log.info("✅ Updated account {} created_by to user {} (original creator was Sales_Executive)", account.getAccountId(), newOwner.getUserId());
                }
                account.setReassignTo(newOwner);
                accountRepository.save(account);
                log.info("✅ Updated account {} ownership to user {}", account.getAccountId(), newOwner.getUserId());
            }
        }
        
        // Update deal owner if lead was converted to deal
        if (lead.getConvertedDealId() != null) {
            Deal deal = dealRepository.findById(lead.getConvertedDealId()).orElse(null);
            if (deal != null) {
                deal.setReassignTo(newOwner);
                dealRepository.save(deal);
                log.info("✅ Updated deal {} ownership to user {}", deal.getDealId(), newOwner.getUserId());
            }
        }
        
        log.info("✅ OWNERSHIP TRANSFER COMPLETE - Lead ID: {}, New Owner: {} {} (ID: {})", 
            lead.getLeadId(), newOwner.getFirstName(), newOwner.getLastName(), newOwner.getUserId());
    }
    
    private List<Contact> getContactsForVP(Integer vpId, String search) {
        // Get all executives under managers that report to this VP
        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        
        // Get all managers under this VP
        List<Integer> managerIds = usersRepository.findByManagerId(vpId).stream()
                .filter(user -> "Sales_Manager".equals(user.getRole()))
                .map(user -> user.getUserId())
                .collect(Collectors.toList());
        
        // Filter contacts owned by executives, managers, or VP themselves
        return contactRepository.findAll().stream()
                .filter(contact -> {
                    Integer ownerId = null;
                    Integer creatorId = null;
                    if (contact.getReassignTo() != null) {
                        ownerId = contact.getReassignTo().getUserId();
                    }
                    if (contact.getCreatedBy() != null) {
                        creatorId = contact.getCreatedBy().getUserId();
                    }
                    
                    // VP sees contacts where:
                    // 1. VP is assigned (reassignTo)
                    // 2. VP created it (createdBy) 
                    // 3. Executive under VP is assigned
                    // 4. Manager under VP is assigned
                    // 5. Manager under VP created it (hierarchical visibility)
                    return (ownerId != null && (executiveIds.contains(ownerId) || managerIds.contains(ownerId) || ownerId.equals(vpId))) ||
                           (creatorId != null && (creatorId.equals(vpId) || managerIds.contains(creatorId)));
                })
                .filter(contact -> search == null || search.trim().isEmpty() ||
                        (contact.getFirstName() != null && contact.getFirstName().toLowerCase().contains(search.toLowerCase())) ||
                        (contact.getLastName() != null && contact.getLastName().toLowerCase().contains(search.toLowerCase())) ||
                        (contact.getEmail() != null && contact.getEmail().toLowerCase().contains(search.toLowerCase())))
                .collect(Collectors.toList());
    }
    
    private List<Integer> getExecutiveIdsUnderVP(Integer vpId) {
        return usersRepository.findByManagerId(vpId).stream()
                .filter(user -> "Sales_Manager".equals(user.getRole()))
                .flatMap(manager -> usersRepository.findByManagerId(manager.getUserId()).stream())
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .map(user -> user.getUserId())
                .collect(Collectors.toList());
    }
    
    @Transactional
    public java.util.Map<String, Object> smartCreateContact(java.util.Map<String, Object> request, Integer userId) {
        String firstName = (String) request.get("firstName");
        String lastName = (String) request.get("lastName");
        String email = (String) request.get("email");
        String phoneNumber = (String) request.get("phoneNumber");
        String designation = (String) request.get("designation");
        String companyName = (String) request.get("companyName");
        String industry = (String) request.get("industry");
        String country = (String) request.get("country");
        String companyLocation = (String) request.get("companyLocation");
        String remarks = (String) request.get("remarks");
        
        if (firstName == null || firstName.trim().isEmpty()) {
            throw new RuntimeException("First name is required");
        }
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (companyName == null || companyName.trim().isEmpty()) {
            throw new RuntimeException("Company name is required");
        }
        
        // Check for duplicate email
        if (contactRepository.existsByEmail(email.trim())) {
            throw new RuntimeException("Email already exists");
        }
        
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Check if account exists by company name for this specific executive
        List<Account> userAccounts = accountRepository.findByCreatedBy(user);
        Account account = null;
        
        // Find exact match within this executive's accounts
        for (Account acc : userAccounts) {
            if (acc.getAccountName().equalsIgnoreCase(companyName.trim())) {
                account = acc;
                break;
            }
        }
        
        boolean accountCreated = false;
        if (account == null) {
            // Create new account
            account = new Account();
            account.setAccountName(companyName.trim());
            account.setIndustry(industry);
            account.setCountry(country);
            account.setCompanyLocation(companyLocation);
            account.setReassignTo(user);
            account.setCreatedBy(user);
            account = accountRepository.save(account);
            accountCreated = true;
            log.info("Created new account: {} (ID: {})", account.getAccountName(), account.getAccountId());
        } else {
            log.info("Using existing account: {} (ID: {})", account.getAccountName(), account.getAccountId());
        }
        
        // Check if contact already exists for this account and email
        if (contactRepository.existsByAccount_AccountIdAndEmail(account.getAccountId(), email)) {
            throw new RuntimeException("Contact with this email already exists for this company");
        }
        
        // Create new contact
        Contact contact = new Contact();
        contact.setFirstName(firstName.trim());
        contact.setLastName(lastName != null ? lastName.trim() : null);
        contact.setEmail(email.trim());
        contact.setPhoneNumber(phoneNumber);
        contact.setDesignation(designation);
        contact.setRemarks(remarks);
        contact.setAccount(account);
        contact.setCreatedBy(user);
        // reassignTo is not set here - only during reassignment
        
        contact = contactRepository.save(contact);
        log.info("Created new contact: {} {} (ID: {})", contact.getFirstName(), contact.getLastName(), contact.getContactId());
        
        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("success", true);
        result.put("message", "Contact created successfully");
        result.put("contact", ContactMapper.toDTO(contact));
        result.put("accountCreated", accountCreated);
        result.put("accountId", account.getAccountId());
        result.put("accountName", account.getAccountName());
        
        return result;
    }
    
    public Map<String, Object> getContactStats(Integer contactId) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        
        Integer accountId = contact.getAccount().getAccountId();
        
        // Get all deals for this account
        List<Deal> accountDeals = dealRepository.findByAccount_AccountId(accountId);
        
        // Calculate total deals count
        int totalDeals = accountDeals.size();
        
        // Calculate total deal value
        java.math.BigDecimal totalValue = accountDeals.stream()
                .map(Deal::getDealValue)
                .filter(value -> value != null)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalDeals", totalDeals);
        stats.put("dealValue", totalValue);
        stats.put("accountId", accountId);
        
        return stats;
    }
    
    @Transactional
    public void reassignContact(Integer contactId, Integer newAssignedToId, Integer currentUserId) {
        Contact contact = contactRepository.findById(contactId)
                .orElseThrow(() -> new RuntimeException("Contact not found"));
        
        Users newOwner = usersRepository.findById(newAssignedToId)
                .orElseThrow(() -> new RuntimeException("New owner not found"));
        
        log.info("Reassigning contact {} to user {}", contactId, newAssignedToId);
        
        // If original creator is Sales_Executive, update created_by to new executive
        if (contact.getCreatedBy() != null && 
            "Sales_Executive".equals(contact.getCreatedBy().getRole().toString())) {
            contact.setCreatedBy(newOwner);
            log.info("✅ Updated contact {} created_by to user {} (original creator was Sales_Executive)", 
                contactId, newAssignedToId);
        }
        
        // Always update reassignTo
        contact.setReassignTo(newOwner);
        contactRepository.save(contact);
        
        log.info("✅ Contact {} reassigned successfully to user {}", contactId, newAssignedToId);
    }
}



