package com.techtammina.crm.service;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.Optional;

@Slf4j
@Service
public class SalesVPService {
    private static final Logger log = LoggerFactory.getLogger(SalesVPService.class);
    
    private final UsersRepository usersRepository;
    private final LeadRepository leadRepository;
    private final DealRepository dealRepository;
    private final ContactRepository contactRepository;

    public SalesVPService(UsersRepository usersRepository, LeadRepository leadRepository, DealRepository dealRepository, ContactRepository contactRepository) {
        this.usersRepository = usersRepository;
        this.leadRepository = leadRepository;
        this.dealRepository = dealRepository;
        this.contactRepository = contactRepository;
    }

    public List<Integer> getExecutiveIdsUnderVP(Integer vpId) {
        List<Users> managers = usersRepository.findByManagerId(vpId).stream()
                .filter(user -> "Sales_Manager".equals(user.getRole()))
                .collect(Collectors.toList());

        List<Integer> executiveIds = managers.stream()
                .flatMap(manager -> usersRepository.findByManagerId(manager.getUserId()).stream())
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .map(Users::getUserId)
                .collect(Collectors.toList());

        // Include manager IDs as well to include leads created by or assigned to managers
        executiveIds.addAll(managers.stream().map(Users::getUserId).collect(Collectors.toList()));

        return executiveIds;
    }

    public List<LeadDTO> getLeadsForVP(Integer vpId, String q) {
        log.info("SalesVPService.getLeadsForVP() called for vpId: {}, q: {}", vpId, q);

        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        if (executiveIds.isEmpty()) {
            log.info("No executives found under VP {}", vpId);
            return List.of();
        }

        List<Lead> leads = leadRepository.findLeadsBelongingToExecutives(q, executiveIds);
        List<LeadDTO> result = leads.stream()
                .map(LeadMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesVPService.getLeadsForVP() found {} leads", result.size());
        return result;
    }

    public List<DealDTO> getDealsForVP(Integer vpId, String q) {
        log.info("SalesVPService.getDealsForVP() called for vpId: {}, q: {}", vpId, q);

        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        if (executiveIds.isEmpty()) {
            log.info("No executives found under VP {}", vpId);
            return List.of();
        }

        List<Deal> deals = dealRepository.findDealsForExecutives(q, executiveIds);
        List<DealDTO> result = deals.stream()
                .map(DealMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesVPService.getDealsForVP() found {} deals", result.size());
        return result;
    }

    public long getDealsCountForVP(Integer vpId) {
        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        if (executiveIds.isEmpty()) {
            return 0;
        }
        return dealRepository.countDealsForExecutives(executiveIds);
    }

    public long getLeadsCountForVP(Integer vpId) {
        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        if (executiveIds.isEmpty()) {
            return 0;
        }
        return leadRepository.countLeadsForExecutives(executiveIds);
    }

    public List<UserDTO> getManagersUnderVP(Integer vpId) {
        log.info("SalesVPService.getManagersUnderVP() called for vpId: {}", vpId);

        List<Users> managers = usersRepository.findByManagerId(vpId).stream()
                .filter(user -> "Sales_Manager".equals(user.getRole()))
                .collect(Collectors.toList());

        List<UserDTO> result = managers.stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesVPService.getManagersUnderVP() found {} managers", result.size());
        return result;
    }

    public List<UserDTO> getExecutivesUnderManager(Integer managerId) {
        log.info("SalesVPService.getExecutivesUnderManager() called for managerId: {}", managerId);

        List<Users> executives = usersRepository.findByManagerId(managerId).stream()
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .collect(Collectors.toList());

        List<UserDTO> result = executives.stream()
                .map(UserMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesVPService.getExecutivesUnderManager() found {} executives", result.size());
        return result;
    }

    public List<LeadDTO> getLeadsForExecutiveUnderVP(Integer vpId, Integer executiveId, String q) {
        log.info("SalesVPService.getLeadsForExecutiveUnderVP() called for vpId: {}, executiveId: {}, q: {}", vpId, executiveId, q);

        // First validate that the executive is under the VP's hierarchy
        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        if (!executiveIds.contains(executiveId)) {
            log.warn("Executive {} is not under VP {} hierarchy", executiveId, vpId);
            return List.of();
        }

        // Get leads based on owner logic (assignTo for Sales_Executive created leads, created_by for others)
        List<Lead> leads = leadRepository.findLeadsForExecutiveByOwner(q, executiveId);

        List<LeadDTO> result = leads.stream()
                .map(LeadMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesVPService.getLeadsForExecutiveUnderVP() found {} leads", result.size());
        return result;
    }

    public List<LeadDTO> getLeadsForManagerUnderVP(Integer vpId, Integer managerId, String q) {
        log.info("SalesVPService.getLeadsForManagerUnderVP() called for vpId: {}, managerId: {}, q: {}", vpId, managerId, q);

        // First validate that the manager is under the VP
        List<UserDTO> managers = getManagersUnderVP(vpId);
        boolean isValidManager = managers.stream().anyMatch(m -> m.getUserId().equals(managerId));
        if (!isValidManager) {
            log.warn("Manager {} is not under VP {} hierarchy", managerId, vpId);
            return List.of();
        }

        // Get leads based on owner logic (assignTo for Sales_Executive created leads, created_by for others)
        List<Lead> leads = leadRepository.findLeadsForExecutiveByOwner(q, managerId);

        List<LeadDTO> result = leads.stream()
                .map(LeadMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesVPService.getLeadsForManagerUnderVP() found {} leads", result.size());
        return result;
    }

    public List<ContactDTO> getContactsForVP(Integer vpId, String q) {
        log.info("SalesVPService.getContactsForVP() called for vpId: {}, q: {}", vpId, q);

        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        if (executiveIds.isEmpty()) {
            log.info("No executives found under VP {}", vpId);
            return List.of();
        }

        List<Contact> contacts = contactRepository.findContactsBelongingToExecutivesWithSearch(q, executiveIds);
        List<ContactDTO> result = contacts.stream()
                .map(ContactMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesVPService.getContactsForVP() found {} contacts", result.size());
        return result;
    }

    public List<ContactDTO> getContactsForExecutiveUnderVP(Integer vpId, Integer executiveId, String q) {
        log.info("SalesVPService.getContactsForExecutiveUnderVP() called for vpId: {}, executiveId: {}, q: {}", vpId, executiveId, q);

        // First validate that the executive is under the VP's hierarchy
        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        if (!executiveIds.contains(executiveId)) {
            log.warn("Executive {} is not under VP {} hierarchy", executiveId, vpId);
            return List.of();
        }

        // Get contacts where executive is the effective owner:
        // 1. Contacts assigned to executive (reassignTo = executiveId) where creator is Sales_Executive
        // 2. Contacts created by this specific executive where reassignTo is null
        
        // First get all contacts assigned to this executive
        List<Contact> assignedContacts = contactRepository.findByReassignTo_UserId(executiveId);
        
        // Filter assigned contacts to only include those created by Sales_Executive
        List<Contact> validAssignedContacts = assignedContacts.stream()
                .filter(contact -> {
                    if (contact.getCreatedBy() != null) {
                        return "Sales_Executive".equals(contact.getCreatedBy().getRole());
                    }
                    return false;
                })
                .collect(Collectors.toList());
        
        // Get contacts created by this specific executive where reassignTo is null
        List<Contact> createdContacts = contactRepository.findByCreatedBy_UserIdAndReassignToIsNull(executiveId);
        
        // Combine both lists
        Set<Integer> contactIds = new HashSet<>();
        List<Contact> contacts = new ArrayList<>();
        
        // Add valid assigned contacts (created by Sales_Executive, assigned to this executive)
        for (Contact contact : validAssignedContacts) {
            if (contactIds.add(contact.getContactId())) {
                contacts.add(contact);
            }
        }
        
        // Add created contacts where reassignTo is null (created by this executive, not reassigned)
        for (Contact contact : createdContacts) {
            if (contactIds.add(contact.getContactId())) {
                contacts.add(contact);
            }
        }
        
        log.info("Found {} valid assigned contacts and {} created contacts for executive {}, total unique: {}", 
                validAssignedContacts.size(), createdContacts.size(), executiveId, contacts.size());
        
        // Apply search filter if provided
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

        List<ContactDTO> result = contacts.stream()
                .map(ContactMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesVPService.getContactsForExecutiveUnderVP() found {} contacts after filtering", result.size());
        return result;
    }

    public List<ContactDTO> getContactsForManagerUnderVP(Integer vpId, Integer managerId, String q) {
        log.info("SalesVPService.getContactsForManagerUnderVP() called for vpId: {}, managerId: {}, q: {}", vpId, managerId, q);

        // First validate that the manager is under the VP
        List<UserDTO> managers = getManagersUnderVP(vpId);
        boolean isValidManager = managers.stream().anyMatch(m -> m.getUserId().equals(managerId));
        if (!isValidManager) {
            log.warn("Manager {} is not under VP {} hierarchy", managerId, vpId);
            return List.of();
        }

        // Get contacts created by the specific manager only
        List<Contact> contacts = contactRepository.findByCreatedBy_UserId(managerId);
        
        // Apply search filter if provided
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

        List<ContactDTO> result = contacts.stream()
                .map(ContactMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesVPService.getContactsForManagerUnderVP() found {} contacts", result.size());
        return result;
    }

    public List<LeadDTO> getLeadsForVPWithFilters(Integer vpId, String q, String status, String source, String startDate, String endDate) {
        log.info("SalesVPService.getLeadsForVPWithFilters() called for vpId: {}, q: {}, status: {}, source: {}, startDate: {}, endDate: {}", vpId, q, status, source, startDate, endDate);

        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        if (executiveIds.isEmpty()) {
            log.info("No executives found under VP {}", vpId);
            return List.of();
        }

        List<Lead> leads = leadRepository.findLeadsBelongingToExecutives(q, executiveIds);
        
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

        log.info("SalesVPService.getLeadsForVPWithFilters() found {} leads", result.size());
        return result;
    }

    public List<LeadDTO> getLeadsForExecutiveUnderVPWithFilters(Integer vpId, Integer executiveId, String q, String status, String source, String startDate, String endDate) {
        log.info("SalesVPService.getLeadsForExecutiveUnderVPWithFilters() called for vpId: {}, executiveId: {}, q: {}, status: {}, source: {}, startDate: {}, endDate: {}", vpId, executiveId, q, status, source, startDate, endDate);

        // First validate that the executive is under the VP's hierarchy
        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        if (!executiveIds.contains(executiveId)) {
            log.warn("Executive {} is not under VP {} hierarchy", executiveId, vpId);
            return List.of();
        }

        // Get leads based on owner logic (assignTo for Sales_Executive created leads, created_by for others)
        List<Lead> leads = leadRepository.findLeadsForExecutiveByOwner(q, executiveId);
        
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

        log.info("SalesVPService.getLeadsForExecutiveUnderVPWithFilters() found {} leads", result.size());
        return result;
    }

    public List<LeadDTO> getLeadsForManagerUnderVPWithFilters(Integer vpId, Integer managerId, String q, String status, String source, String startDate, String endDate) {
        log.info("SalesVPService.getLeadsForManagerUnderVPWithFilters() called for vpId: {}, managerId: {}, q: {}, status: {}, source: {}, startDate: {}, endDate: {}", vpId, managerId, q, status, source, startDate, endDate);

        // First validate that the manager is under the VP
        List<UserDTO> managers = getManagersUnderVP(vpId);
        boolean isValidManager = managers.stream().anyMatch(m -> m.getUserId().equals(managerId));
        if (!isValidManager) {
            log.warn("Manager {} is not under VP {} hierarchy", managerId, vpId);
            return List.of();
        }

        // Get leads based on owner logic (assignTo for Sales_Executive created leads, created_by for others)
        List<Lead> leads = leadRepository.findLeadsForExecutiveByOwner(q, managerId);
        
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

        log.info("SalesVPService.getLeadsForManagerUnderVPWithFilters() found {} leads", result.size());
        return result;
    }

    public Map<String, Object> getLeadsForVPWithFiltersAndPagination(Integer vpId, String q, String status, String source, String startDate, String endDate, int page, int size) {
        List<LeadDTO> allLeads = getLeadsForVPWithFilters(vpId, q, status, source, startDate, endDate);
        
        int totalElements = allLeads.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<LeadDTO> paginatedLeads = startIndex < totalElements ? 
            allLeads.subList(startIndex, endIndex) : List.of();
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", paginatedLeads);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        response.put("hasNext", page < totalPages - 1);
        response.put("hasPrevious", page > 0);
        
        return response;
    }

    public Map<String, Object> getLeadsForExecutiveUnderVPWithFiltersAndPagination(Integer vpId, Integer executiveId, String q, String status, String source, String startDate, String endDate, int page, int size) {
        List<LeadDTO> allLeads = getLeadsForExecutiveUnderVPWithFilters(vpId, executiveId, q, status, source, startDate, endDate);
        
        int totalElements = allLeads.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<LeadDTO> paginatedLeads = startIndex < totalElements ? 
            allLeads.subList(startIndex, endIndex) : List.of();
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", paginatedLeads);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        response.put("hasNext", page < totalPages - 1);
        response.put("hasPrevious", page > 0);
        
        return response;
    }

    public Map<String, Object> getLeadsForManagerUnderVPWithFiltersAndPagination(Integer vpId, Integer managerId, String q, String status, String source, String startDate, String endDate, int page, int size) {
        List<LeadDTO> allLeads = getLeadsForManagerUnderVPWithFilters(vpId, managerId, q, status, source, startDate, endDate);
        
        int totalElements = allLeads.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<LeadDTO> paginatedLeads = startIndex < totalElements ? 
            allLeads.subList(startIndex, endIndex) : List.of();
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", paginatedLeads);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        response.put("hasNext", page < totalPages - 1);
        response.put("hasPrevious", page > 0);
        
        return response;
    }

    public List<LeadDTO> getMyLeadsWithFilters(Integer vpId, String q, String status, String source, String startDate, String endDate) {
        log.info("SalesVPService.getMyLeadsWithFilters() called for vpId: {}, q: {}, status: {}, source: {}, startDate: {}, endDate: {}", vpId, q, status, source, startDate, endDate);

        // Get leads created by the VP OR assigned to the VP
        List<Lead> createdByVP = leadRepository.findByCreatedBy_UserId(vpId);
        List<Lead> assignedToVP = leadRepository.findByAssignedTo_UserId(vpId);
        
        // Combine and deduplicate leads
        Set<Integer> leadIds = new HashSet<>();
        List<Lead> leads = new ArrayList<>();
        
        // Add leads created by VP
        for (Lead lead : createdByVP) {
            if (leadIds.add(lead.getLeadId())) {
                leads.add(lead);
            }
        }
        
        // Add leads assigned to VP (avoid duplicates)
        for (Lead lead : assignedToVP) {
            if (leadIds.add(lead.getLeadId())) {
                leads.add(lead);
            }
        }
        
        log.info("Found {} leads created by VP {} and {} leads assigned to VP, total unique leads: {}", 
                createdByVP.size(), vpId, assignedToVP.size(), leads.size());
        
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

        log.info("SalesVPService.getMyLeadsWithFilters() found {} leads after filtering", result.size());
        return result;
    }

    public Map<String, Object> getMyLeadsWithFiltersAndPagination(Integer vpId, String q, String status, String source, String startDate, String endDate, int page, int size) {
        List<LeadDTO> allLeads = getMyLeadsWithFilters(vpId, q, status, source, startDate, endDate);
        
        int totalElements = allLeads.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<LeadDTO> paginatedLeads = startIndex < totalElements ? 
            allLeads.subList(startIndex, endIndex) : List.of();
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", paginatedLeads);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        response.put("hasNext", page < totalPages - 1);
        response.put("hasPrevious", page > 0);
        
        return response;
    }

    public List<ContactDTO> getMyContactsWithFilters(Integer vpId, String q, String startDate, String endDate) {
        log.info("SalesVPService.getMyContactsWithFilters() called for vpId: {}, q: {}, startDate: {}, endDate: {}", vpId, q, startDate, endDate);

        // Get contacts created by the VP OR assigned to the VP
        List<Contact> createdByVP = contactRepository.findByCreatedBy_UserId(vpId);
        List<Contact> assignedToVP = contactRepository.findByReassignTo_UserId(vpId);
        
        // Combine and deduplicate contacts
        Set<Integer> contactIds = new HashSet<>();
        List<Contact> contacts = new ArrayList<>();
        
        // Add contacts created by VP
        for (Contact contact : createdByVP) {
            if (contactIds.add(contact.getContactId())) {
                contacts.add(contact);
            }
        }
        
        // Add contacts assigned to VP (avoid duplicates)
        for (Contact contact : assignedToVP) {
            if (contactIds.add(contact.getContactId())) {
                contacts.add(contact);
            }
        }
        
        log.info("Found {} contacts created by VP {} and {} contacts assigned to VP, total unique contacts: {}", 
                createdByVP.size(), vpId, assignedToVP.size(), contacts.size());
        
        // Apply search filter if provided
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

        log.info("SalesVPService.getMyContactsWithFilters() found {} contacts after filtering", result.size());
        return result;
    }

    public Map<String, Object> getMyContactsWithFiltersAndPagination(Integer vpId, String q, String startDate, String endDate, int page, int size) {
        List<ContactDTO> allContacts = getMyContactsWithFilters(vpId, q, startDate, endDate);
        
        int totalElements = allContacts.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<ContactDTO> paginatedContacts = startIndex < totalElements ? 
            allContacts.subList(startIndex, endIndex) : List.of();
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", paginatedContacts);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        response.put("hasNext", page < totalPages - 1);
        response.put("hasPrevious", page > 0);
        
        return response;
    }
}