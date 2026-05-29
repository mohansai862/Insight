package com.techtammina.crm.service;

import java.util.List;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.techtammina.crm.dto.ContactDTO;
import com.techtammina.crm.dto.DealDTO;
import com.techtammina.crm.dto.LeadDTO;
import com.techtammina.crm.dto.UserDTO;
import com.techtammina.crm.entity.Contact;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.mapper.ContactMapper;
import com.techtammina.crm.mapper.DealMapper;
import com.techtammina.crm.mapper.LeadMapper;
import com.techtammina.crm.mapper.UserMapper;
import com.techtammina.crm.repository.ContactRepository;
import com.techtammina.crm.repository.DealRepository;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.UsersRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class CEOService {
    private static final Logger log = LoggerFactory.getLogger(CEOService.class);
    
    private final UsersRepository usersRepository;
    private final LeadRepository leadRepository;
    private final DealRepository dealRepository;
    private final ContactRepository contactRepository;
    private final SalesVPService salesVPService;

    public CEOService(UsersRepository usersRepository, LeadRepository leadRepository, 
                     DealRepository dealRepository, ContactRepository contactRepository,
                     SalesVPService salesVPService) {
        this.usersRepository = usersRepository;
        this.leadRepository = leadRepository;
        this.dealRepository = dealRepository;
        this.contactRepository = contactRepository;
        this.salesVPService = salesVPService;
    }

    public List<UserDTO> getAllSalesVPs() {
        log.info("CEOService.getAllSalesVPs() called");
        
        List<Users> salesVPs = usersRepository.findByRole("Sales_VP");
        List<UserDTO> result = salesVPs.stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());
        
        log.info("CEOService.getAllSalesVPs() found {} Sales VPs", result.size());
        return result;
    }

    public List<Integer> getAllExecutiveIds() {
        List<Users> salesVPs = usersRepository.findByRole("Sales_VP");
        
        return salesVPs.stream()
                .flatMap(vp -> salesVPService.getExecutiveIdsUnderVP(vp.getUserId()).stream())
                .distinct()
                .collect(Collectors.toList());
    }

    public List<Integer> getExecutiveIdsForSalesVP(Integer salesVpId) {
        return salesVPService.getExecutiveIdsUnderVP(salesVpId);
    }

    public List<LeadDTO> getLeadsForCEOWithFilters(Integer ceoId, String q, String status, String source, 
                                                  String startDate, String endDate, Integer salesVpId, 
                                                  Integer managerId, Integer executiveId) {
        log.info("CEOService.getLeadsForCEOWithFilters() called for ceoId: {}, salesVpId: {}, managerId: {}, executiveId: {}", 
                ceoId, salesVpId, managerId, executiveId);

        List<Lead> leads;
        
        if (executiveId != null) {
            // Executive selected: Use owner-based filtering with proper joins
            leads = leadRepository.findLeadsForExecutiveByOwnerWithJoins(q, executiveId);
            log.info("Executive {} selected, found {} leads based on owner logic", executiveId, leads.size());
        } else if (managerId != null) {
            // Manager selected: Use owner-based filtering with proper joins
            leads = leadRepository.findLeadsForExecutiveByOwnerWithJoins(q, managerId);
            log.info("Manager {} selected, found {} leads based on owner logic", managerId, leads.size());
        } else if (salesVpId != null) {
            // VP selected: Use owner-based filtering with proper joins
            leads = leadRepository.findLeadsForExecutiveByOwnerWithJoins(q, salesVpId);
            log.info("VP {} selected, found {} leads based on owner logic", salesVpId, leads.size());
        } else {
            // No filter: All leads in organization with proper joins
            leads = leadRepository.findAllWithJoins();
            // Apply search filter if provided
            if (q != null && !q.isEmpty()) {
                leads = leads.stream()
                        .filter(lead -> {
                            String searchTerm = q.toLowerCase();
                            return (lead.getFirstName() != null && lead.getFirstName().toLowerCase().contains(searchTerm)) ||
                                   (lead.getLastName() != null && lead.getLastName().toLowerCase().contains(searchTerm)) ||
                                   (lead.getEmail() != null && lead.getEmail().toLowerCase().contains(searchTerm)) ||
                                   (lead.getCompanyName() != null && lead.getCompanyName().toLowerCase().contains(searchTerm));
                        })
                        .collect(Collectors.toList());
            }
            log.info("No filter selected, found {} leads for all users", leads.size());
        }

        // Apply search filter if provided and not already applied by repository method
        if (q != null && !q.isEmpty() && (executiveId != null || managerId != null || salesVpId != null)) {
            leads = leads.stream()
                    .filter(lead -> {
                        String searchTerm = q.toLowerCase();
                        return (lead.getFirstName() != null && lead.getFirstName().toLowerCase().contains(searchTerm)) ||
                               (lead.getLastName() != null && lead.getLastName().toLowerCase().contains(searchTerm)) ||
                               (lead.getEmail() != null && lead.getEmail().toLowerCase().contains(searchTerm)) ||
                               (lead.getCompanyName() != null && lead.getCompanyName().toLowerCase().contains(searchTerm));
                    })
                    .collect(Collectors.toList());
        }
        
        // Apply filters
        if (status != null && !status.isEmpty()) {
            leads = leads.stream()
                    .filter(lead -> status.equalsIgnoreCase(lead.getLeadStatus().name()))
                    .collect(Collectors.toList());
        }
        
        if (source != null && !source.isEmpty()) {
            leads = leads.stream()
                    .filter(lead -> source.equalsIgnoreCase(lead.getLeadSource().name()))
                    .collect(Collectors.toList());
        }
        
        // Apply date filters
        if (startDate != null && !startDate.isEmpty()) {
            try {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate);
                leads = leads.stream()
                        .filter(lead -> {
                            if (lead.getCreatedAt() != null) {
                                java.time.LocalDate leadDate = lead.getCreatedAt().toLocalDate();
                                return !leadDate.isBefore(start);
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Invalid start date format: {}", startDate);
            }
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            try {
                java.time.LocalDate end = java.time.LocalDate.parse(endDate);
                leads = leads.stream()
                        .filter(lead -> {
                            if (lead.getCreatedAt() != null) {
                                java.time.LocalDate leadDate = lead.getCreatedAt().toLocalDate();
                                return !leadDate.isAfter(end);
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Invalid end date format: {}", endDate);
            }
        }

        List<LeadDTO> result = leads.stream()
                .map(LeadMapper::toDTO)
                .collect(Collectors.toList());

        log.info("CEOService.getLeadsForCEOWithFilters() found {} leads", result.size());
        return result;
    }

    public List<DealDTO> getDealsForCEOWithFilters(Integer ceoId, String q, String startDate, String endDate, 
                                                  Integer salesVpId, Integer managerId, Integer executiveId) {
        log.info("CEOService.getDealsForCEOWithFilters() called for ceoId: {}, salesVpId: {}, managerId: {}, executiveId: {}, startDate: {}, endDate: {}", 
                ceoId, salesVpId, managerId, executiveId, startDate, endDate);

        List<Deal> deals;
        
        if (executiveId != null) {
            // Executive selected: Use owner-based filtering (same logic as reports)
            deals = dealRepository.findAll().stream()
                .filter(d -> {
                    // If reassignTo exists, only that executive gets credit (not the creator)
                    if (d.getReassignTo() != null) {
                        return d.getReassignTo().getUserId().equals(executiveId);
                    } else {
                        // Only if reassignTo is null, check createdBy
                        return d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(executiveId);
                    }
                })
                .collect(java.util.stream.Collectors.toList());
            log.info("Executive {} selected, found {} deals based on owner logic", executiveId, deals.size());
        } else if (managerId != null) {
            // Manager selected: Get deals for all executives under this manager using owner logic
            List<Integer> executiveIds = salesVPService.getExecutivesUnderManager(managerId).stream()
                    .map(UserDTO::getUserId)
                    .collect(java.util.stream.Collectors.toList());
            // Include the manager ID as well
            executiveIds.add(managerId);
            
            deals = dealRepository.findAll().stream()
                .filter(d -> {
                    // Apply owner-based logic for each executive/manager
                    if (d.getReassignTo() != null) {
                        return executiveIds.contains(d.getReassignTo().getUserId());
                    } else {
                        return d.getCreatedBy() != null && executiveIds.contains(d.getCreatedBy().getUserId());
                    }
                })
                .collect(java.util.stream.Collectors.toList());
            log.info("Manager {} selected, found {} deals for {} executives/manager", managerId, deals.size(), executiveIds.size());
        } else if (salesVpId != null) {
            // VP selected: Get deals for all executives under this VP using owner logic
            List<Integer> executiveIds = getExecutiveIdsForSalesVP(salesVpId);
            
            deals = dealRepository.findAll().stream()
                .filter(d -> {
                    // Apply owner-based logic for each executive
                    if (d.getReassignTo() != null) {
                        return executiveIds.contains(d.getReassignTo().getUserId());
                    } else {
                        return d.getCreatedBy() != null && executiveIds.contains(d.getCreatedBy().getUserId());
                    }
                })
                .collect(java.util.stream.Collectors.toList());
            log.info("VP {} selected, found {} deals for {} executives", salesVpId, deals.size(), executiveIds.size());
        } else {
            // No filter: All deals in organization using owner logic
            deals = dealRepository.findAll();
            log.info("No filter selected, found {} deals for all users", deals.size());
        }

        // Apply search filter if provided
        if (q != null && !q.isEmpty()) {
            deals = deals.stream()
                    .filter(deal -> deal.getDealName() != null && deal.getDealName().toLowerCase().contains(q.toLowerCase()))
                    .collect(java.util.stream.Collectors.toList());
        }
        
        // Apply date filters based on expected close date
        if (startDate != null && !startDate.isEmpty()) {
            try {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate);
                deals = deals.stream()
                        .filter(deal -> {
                            if (deal.getExpectedCloseDate() != null) {
                                return !deal.getExpectedCloseDate().isBefore(start);
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Invalid start date format: {}", startDate);
            }
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            try {
                java.time.LocalDate end = java.time.LocalDate.parse(endDate);
                deals = deals.stream()
                        .filter(deal -> {
                            if (deal.getExpectedCloseDate() != null) {
                                return !deal.getExpectedCloseDate().isAfter(end);
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Invalid end date format: {}", endDate);
            }
        }

        List<DealDTO> result = deals.stream()
                .map(DealMapper::toDTO)
                .collect(Collectors.toList());

        log.info("CEOService.getDealsForCEOWithFilters() found {} deals", result.size());
        return result;
    }

    public long getDealsCountForCEO(Integer ceoId) {
        List<Integer> executiveIds = getAllExecutiveIds();
        if (executiveIds.isEmpty()) {
            return 0;
        }
        return dealRepository.countDealsForExecutives(executiveIds);
    }

    public long getLeadsCountForCEO(Integer ceoId) {
        List<Integer> executiveIds = getAllExecutiveIds();
        if (executiveIds.isEmpty()) {
            return 0;
        }
        return leadRepository.countLeadsForExecutives(executiveIds);
    }

    public List<UserDTO> getManagersUnderSalesVP(Integer salesVpId) {
        log.info("CEOService.getManagersUnderSalesVP() called for salesVpId: {}", salesVpId);
        return salesVPService.getManagersUnderVP(salesVpId);
    }

    public List<UserDTO> getExecutivesUnderManager(Integer managerId) {
        log.info("CEOService.getExecutivesUnderManager() called for managerId: {}", managerId);
        return salesVPService.getExecutivesUnderManager(managerId);
    }

    public List<ContactDTO> getContactsForCEO(Integer ceoId, String q, Integer salesVpId, Integer managerId, Integer executiveId) {
        log.info("CEOService.getContactsForCEO() called for ceoId: {}, salesVpId: {}, managerId: {}, executiveId: {}", 
                ceoId, salesVpId, managerId, executiveId);

        List<Integer> executiveIds;
        if (executiveId != null) {
            // Filter by specific executive
            executiveIds = List.of(executiveId);
        } else if (managerId != null) {
            // Filter by specific manager - get all executives under this manager
            executiveIds = salesVPService.getExecutivesUnderManager(managerId).stream()
                    .map(UserDTO::getUserId)
                    .collect(Collectors.toList());
            // Include the manager ID as well
            executiveIds.add(managerId);
        } else if (salesVpId != null) {
            // Filter by specific Sales VP
            executiveIds = getExecutiveIdsForSalesVP(salesVpId);
        } else {
            // Get all executives across all Sales VPs
            executiveIds = getAllExecutiveIds();
        }

        if (executiveIds.isEmpty()) {
            log.info("No executives found for CEO contacts query");
            return List.of();
        }

        List<Contact> contacts = contactRepository.findContactsBelongingToExecutivesWithSearch(q, executiveIds);
        List<ContactDTO> result = contacts.stream()
                .map(ContactMapper::toDTO)
                .collect(Collectors.toList());

        log.info("CEOService.getContactsForCEO() found {} contacts", result.size());
        return result;
    }

    public List<ContactDTO> getContactsForCEOWithFilters(Integer ceoId, String q, String startDate, String endDate, 
                                                        Integer salesVpId, Integer managerId, Integer executiveId) {
        log.info("CEOService.getContactsForCEOWithFilters() called for ceoId: {}, salesVpId: {}, managerId: {}, executiveId: {}", 
                ceoId, salesVpId, managerId, executiveId);

        List<Contact> contacts;
        
        if (executiveId != null) {
            // Executive selected: Show contacts where executive is the effective owner (same as VP service)
            List<Contact> assignedContacts = contactRepository.findByReassignTo_UserId(executiveId);
            List<Contact> validAssignedContacts = assignedContacts.stream()
                    .filter(contact -> {
                        if (contact.getCreatedBy() != null) {
                            return "Sales_Executive".equals(contact.getCreatedBy().getRole());
                        }
                        return false;
                    })
                    .collect(Collectors.toList());
            
            List<Contact> createdContacts = contactRepository.findByCreatedBy_UserIdAndReassignToIsNull(executiveId);
            
            // Combine both lists
            java.util.Set<Integer> contactIds = new java.util.HashSet<>();
            contacts = new java.util.ArrayList<>();
            
            for (Contact contact : validAssignedContacts) {
                if (contactIds.add(contact.getContactId())) {
                    contacts.add(contact);
                }
            }
            
            for (Contact contact : createdContacts) {
                if (contactIds.add(contact.getContactId())) {
                    contacts.add(contact);
                }
            }
            
            log.info("Executive {} selected, found {} assigned contacts and {} created contacts, total unique: {}", 
                    executiveId, validAssignedContacts.size(), createdContacts.size(), contacts.size());
        } else if (managerId != null) {
            // Manager selected: Show contacts created by this specific manager only
            contacts = contactRepository.findByCreatedBy_UserId(managerId);
            log.info("Manager {} selected, found {} contacts created by this manager", managerId, contacts.size());
        } else if (salesVpId != null) {
            // VP selected: Show contacts created by this specific VP only
            contacts = contactRepository.findByCreatedBy_UserId(salesVpId);
            log.info("VP {} selected, found {} contacts created by this VP", salesVpId, contacts.size());
        } else {
            // No filter: All contacts in organization
            contacts = contactRepository.findAll();
            log.info("No filter selected, found {} contacts for all users", contacts.size());
        }

        // Apply search filter if provided (for all cases now)
        if (q != null && !q.isEmpty()) {
            contacts = contacts.stream()
                    .filter(contact -> {
                        String searchTerm = q.toLowerCase();
                        return (contact.getFirstName() != null && contact.getFirstName().toLowerCase().contains(searchTerm)) ||
                               (contact.getLastName() != null && contact.getLastName().toLowerCase().contains(searchTerm)) ||
                               (contact.getEmail() != null && contact.getEmail().toLowerCase().contains(searchTerm)) ||
                               (contact.getAccount() != null && contact.getAccount().getAccountName() != null && contact.getAccount().getAccountName().toLowerCase().contains(searchTerm));
                    })
                    .collect(Collectors.toList());
        }
        
        // Apply date filters
        if (startDate != null && !startDate.isEmpty()) {
            try {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate);
                contacts = contacts.stream()
                        .filter(contact -> {
                            if (contact.getCreatedAt() != null) {
                                java.time.LocalDate contactDate = contact.getCreatedAt().toLocalDate();
                                return !contactDate.isBefore(start);
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Invalid start date format: {}", startDate);
            }
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            try {
                java.time.LocalDate end = java.time.LocalDate.parse(endDate);
                contacts = contacts.stream()
                        .filter(contact -> {
                            if (contact.getCreatedAt() != null) {
                                java.time.LocalDate contactDate = contact.getCreatedAt().toLocalDate();
                                return !contactDate.isAfter(end);
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Invalid end date format: {}", endDate);
            }
        }

        List<ContactDTO> result = contacts.stream()
                .map(ContactMapper::toDTO)
                .collect(Collectors.toList());

        log.info("CEOService.getContactsForCEOWithFilters() found {} contacts", result.size());
        return result;
    }

    public List<LeadDTO> getLeadsForSpecificSalesVP(Integer salesVpId, String q, String status, String source, 
                                                   String startDate, String endDate) {
        log.info("CEOService.getLeadsForSpecificSalesVP() called for salesVpId: {}", salesVpId);
        return salesVPService.getLeadsForVPWithFilters(salesVpId, q, status, source, startDate, endDate);
    }

    public List<ContactDTO> getContactsForSpecificSalesVP(Integer salesVpId, String q) {
        log.info("CEOService.getContactsForSpecificSalesVP() called for salesVpId: {}", salesVpId);
        return salesVPService.getContactsForVP(salesVpId, q);
    }

    public List<ContactDTO> getAccountsForCEO(Integer ceoId, String q, Integer salesVpId, Integer managerId, Integer executiveId) {
        log.info("CEOService.getAccountsForCEO() called for ceoId: {}, salesVpId: {}, managerId: {}, executiveId: {}", 
                ceoId, salesVpId, managerId, executiveId);

        List<Integer> executiveIds;
        if (executiveId != null) {
            // Filter by specific executive
            executiveIds = List.of(executiveId);
        } else if (managerId != null) {
            // Filter by specific manager - get all executives under this manager
            executiveIds = salesVPService.getExecutivesUnderManager(managerId).stream()
                    .map(UserDTO::getUserId)
                    .collect(Collectors.toList());
            // Include the manager ID as well
            executiveIds.add(managerId);
        } else if (salesVpId != null) {
            // Filter by specific Sales VP
            executiveIds = getExecutiveIdsForSalesVP(salesVpId);
        } else {
            // Get all executives across all Sales VPs
            executiveIds = getAllExecutiveIds();
        }

        if (executiveIds.isEmpty()) {
            log.info("No executives found for CEO accounts query");
            return List.of();
        }

        // Use contacts as accounts since they represent account relationships
        List<Contact> contacts = contactRepository.findContactsBelongingToExecutivesWithSearch(q, executiveIds);
        List<ContactDTO> result = contacts.stream()
                .map(ContactMapper::toDTO)
                .collect(Collectors.toList());

        log.info("CEOService.getAccountsForCEO() found {} accounts", result.size());
        return result;
    }

    public List<ContactDTO> getAccountsForCEOWithFilters(Integer ceoId, String q, String startDate, String endDate, 
                                                        Integer salesVpId, Integer managerId, Integer executiveId) {
        log.info("CEOService.getAccountsForCEOWithFilters() called for ceoId: {}, salesVpId: {}, managerId: {}, executiveId: {}, startDate: {}, endDate: {}", 
                ceoId, salesVpId, managerId, executiveId, startDate, endDate);

        List<Integer> executiveIds;
        if (executiveId != null) {
            // Filter by specific executive
            executiveIds = List.of(executiveId);
        } else if (managerId != null) {
            // Filter by specific manager - get all executives under this manager
            executiveIds = salesVPService.getExecutivesUnderManager(managerId).stream()
                    .map(UserDTO::getUserId)
                    .collect(Collectors.toList());
            // Include the manager ID as well
            executiveIds.add(managerId);
        } else if (salesVpId != null) {
            // Filter by specific Sales VP
            executiveIds = getExecutiveIdsForSalesVP(salesVpId);
        } else {
            // Get all executives across all Sales VPs
            executiveIds = getAllExecutiveIds();
        }

        if (executiveIds.isEmpty()) {
            log.info("No executives found for CEO accounts query");
            return List.of();
        }

        // Use contacts as accounts since they represent account relationships
        List<Contact> contacts = contactRepository.findContactsBelongingToExecutivesWithSearch(q, executiveIds);
        
        // Apply date filters
        if (startDate != null && !startDate.isEmpty()) {
            try {
                java.time.LocalDate start = java.time.LocalDate.parse(startDate);
                contacts = contacts.stream()
                        .filter(contact -> {
                            if (contact.getCreatedAt() != null) {
                                java.time.LocalDate contactDate = contact.getCreatedAt().toLocalDate();
                                return !contactDate.isBefore(start);
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Invalid start date format: {}", startDate);
            }
        }
        
        if (endDate != null && !endDate.isEmpty()) {
            try {
                java.time.LocalDate end = java.time.LocalDate.parse(endDate);
                contacts = contacts.stream()
                        .filter(contact -> {
                            if (contact.getCreatedAt() != null) {
                                java.time.LocalDate contactDate = contact.getCreatedAt().toLocalDate();
                                return !contactDate.isAfter(end);
                            }
                            return false;
                        })
                        .collect(Collectors.toList());
            } catch (Exception e) {
                log.warn("Invalid end date format: {}", endDate);
            }
        }

        List<ContactDTO> result = contacts.stream()
                .map(ContactMapper::toDTO)
                .collect(Collectors.toList());

        log.info("CEOService.getAccountsForCEOWithFilters() found {} accounts", result.size());
        return result;
    }

    public ContactDTO getAccountDetailsForCEO(Integer ceoId, Integer accountId) {
        log.info("CEOService.getAccountDetailsForCEO() called for ceoId: {}, accountId: {}", ceoId, accountId);

        // Get the contact by ID (since accounts are represented as contacts in CEO system)
        Contact contact = contactRepository.findById(accountId)
                .orElseThrow(() -> new RuntimeException("Account not found with ID: " + accountId));

        ContactDTO result = ContactMapper.toDTO(contact);
        log.info("CEOService.getAccountDetailsForCEO() found account: {}", result.getFirstName() + " " + result.getLastName());
        return result;
    }

    public ContactDTO getContactDetailsForCEO(Integer ceoId, Integer contactId) {
        log.info("CEOService.getContactDetailsForCEO() called for ceoId: {}, contactId: {}", ceoId, contactId);

        // Get the contact by ID
        Contact contact = contactRepository.findById(contactId)
                .orElse(null);

        if (contact == null) {
            log.warn("Contact not found with ID: {}", contactId);
            return null;
        }

        // CEO has access to all contacts in the system
        ContactDTO result = ContactMapper.toDTO(contact);
        log.info("CEOService.getContactDetailsForCEO() found contact: {} {}", 
                result.getFirstName() != null ? result.getFirstName() : "", 
                result.getLastName() != null ? result.getLastName() : "");
        return result;
    }

    public LeadDTO getLeadDetailsForCEO(Integer ceoId, Integer leadId) {
        log.info("CEOService.getLeadDetailsForCEO() called for ceoId: {}, leadId: {}", ceoId, leadId);

        // Get the lead by ID
        Lead lead = leadRepository.findById(leadId)
                .orElse(null);

        if (lead == null) {
            log.warn("Lead not found with ID: {}", leadId);
            return null;
        }

        // CEO has access to all leads in the system
        LeadDTO result = LeadMapper.toDTO(lead);
        log.info("CEOService.getLeadDetailsForCEO() found lead: {} {}", 
                result.getFirstName() != null ? result.getFirstName() : "", 
                result.getLastName() != null ? result.getLastName() : "");
        return result;
    }
}