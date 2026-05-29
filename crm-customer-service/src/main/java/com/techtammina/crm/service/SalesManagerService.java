package com.techtammina.crm.service;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.LeadDTO;
import com.techtammina.crm.dto.ContactDTO;
import com.techtammina.crm.dto.UserDTO;
import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.Contact;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.mapper.LeadMapper;
import com.techtammina.crm.mapper.ContactMapper;
import com.techtammina.crm.mapper.UserMapper;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.ContactRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Slf4j
@Service
public class SalesManagerService {
    private static final Logger log = LoggerFactory.getLogger(SalesManagerService.class);
    private final UsersRepository usersRepository;
    private final LeadRepository leadRepository;
    private final ContactRepository contactRepository;

    public SalesManagerService(UsersRepository usersRepository, LeadRepository leadRepository, ContactRepository contactRepository) {
        this.usersRepository = usersRepository;
        this.leadRepository = leadRepository;
        this.contactRepository = contactRepository;
    }

    public List<UserDTO> getExecutivesUnderManager(Integer managerId) {
        log.info("SalesManagerService.getExecutivesUnderManager() called for managerId: {}", managerId);

        List<Users> executives = usersRepository.findByManagerId(managerId).stream()
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .collect(Collectors.toList());

        log.info("SalesManagerService.getExecutivesUnderManager() found {} raw executives from Users table", executives.size());
        
        // Log each executive for debugging
        for (Users exec : executives) {
            log.info("Executive: ID={}, Username={}, FirstName={}, LastName={}, Email={}", 
                exec.getUserId(), exec.getUsername(), exec.getFirstName(), exec.getLastName(), exec.getEmail());
        }

        List<UserDTO> result = executives.stream()
                .map(user -> {
                    UserDTO dto = UserMapper.toDTO(user);
                    long leadCount = leadRepository.countLeadsForExecutive(user.getUserId());
                    dto.setLeadCount((int) leadCount);
                    return dto;
                })
                .collect(Collectors.toList());

        log.info("SalesManagerService.getExecutivesUnderManager() returning {} executives", result.size());
        return result;
    }
    
    public List<UserDTO> getAllExecutives() {
        log.info("SalesManagerService.getAllExecutives() called");

        List<Users> executives = usersRepository.findAll().stream()
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .collect(Collectors.toList());

        log.info("SalesManagerService.getAllExecutives() found {} raw executives from Users table", executives.size());
        
        // Log each executive for debugging
        for (Users exec : executives) {
            log.info("Executive: ID={}, Username={}, FirstName={}, LastName={}, Email={}", 
                exec.getUserId(), exec.getUsername(), exec.getFirstName(), exec.getLastName(), exec.getEmail());
        }

        List<UserDTO> result = executives.stream()
                .map(user -> {
                    UserDTO dto = UserMapper.toDTO(user);
                    // Count leads for this executive (assigned or created by)
                    long leadCount = leadRepository.countLeadsForExecutive(user.getUserId());
                    dto.setLeadCount((int) leadCount);
                    return dto;
                })
                .collect(Collectors.toList());

        log.info("SalesManagerService.getAllExecutives() returning {} executives", result.size());
        return result;
    }
    
    public List<UserDTO> getManagersUnderVP(Integer vpId) {
        log.info("SalesManagerService.getManagersUnderVP() called for vpId: {}", vpId);

        List<Users> managers = usersRepository.findAll().stream()
                .filter(user -> vpId.equals(user.getManagerId()) &&
                               "Sales_Manager".equals(user.getRole()))
                .collect(Collectors.toList());

        List<UserDTO> result = managers.stream()
                .map(user -> {
                    UserDTO dto = UserMapper.toDTO(user);
                    // Count executives under this manager
                    long executiveCount = usersRepository.findAll().stream()
                            .filter(exec -> user.getUserId().equals(exec.getManagerId()) &&
                                          "Sales_Executive".equals(exec.getRole()))
                            .count();
                    dto.setLeadCount((int) executiveCount); // Reuse leadCount field for executive count
                    return dto;
                })
                .collect(Collectors.toList());

        log.info("SalesManagerService.getManagersUnderVP() found {} managers", result.size());
        return result;
    }

    public boolean isExecutiveUnderManager(Integer executiveId, Integer managerId) {
        return usersRepository.findById(executiveId)
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .map(user -> managerId.equals(user.getManagerId()))
                .orElse(false);
    }

    public List<LeadDTO> getLeadsForExecutive(Integer executiveId, String q) {
        log.info("SalesManagerService.getLeadsForExecutive() called for executiveId: {}, q: {}", executiveId, q);

        List<Lead> leads = leadRepository.findLeadsForExecutive(q, executiveId);
        if (leads == null) {
            leads = List.of();
        }

        List<LeadDTO> result = leads.stream()
                .map(LeadMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesManagerService.getLeadsForExecutive() found {} leads", result.size());
        return result;
    }

    public List<LeadDTO> getLeadsForManager(Integer managerId, String q) {
        log.info("SalesManagerService.getLeadsForManager() called for managerId: {}, q: {}", managerId, q);

        // Get executives under this manager
        List<Integer> executiveIds = usersRepository.findByManagerId(managerId).stream()
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .map(Users::getUserId)
                .collect(Collectors.toList());

        List<Lead> leads;
        if (executiveIds.isEmpty()) {
            leads = List.of();
        } else {
            leads = leadRepository.findLeadsBelongingToExecutives(q, executiveIds);
        }

        List<LeadDTO> result = leads.stream()
                .map(LeadMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesManagerService.getLeadsForManager() found {} leads for manager {}", result.size(), managerId);
        return result;
    }

    public List<LeadDTO> getLeadsForManagerWithFilters(Integer managerId, String q, String status, String source, String startDate, String endDate) {
        log.info("SalesManagerService.getLeadsForManagerWithFilters() called for managerId: {}, q: {}, status: {}, source: {}, startDate: {}, endDate: {}", managerId, q, status, source, startDate, endDate);

        // Get executives under this manager
        List<Integer> executiveIds = usersRepository.findByManagerId(managerId).stream()
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .map(Users::getUserId)
                .collect(Collectors.toList());

        List<Lead> leads;
        if (executiveIds.isEmpty()) {
            leads = List.of();
        } else {
            leads = leadRepository.findLeadsBelongingToExecutives(q, executiveIds);
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

        log.info("SalesManagerService.getLeadsForManagerWithFilters() found {} leads for manager {}", result.size(), managerId);
        return result;
    }

    public List<LeadDTO> getLeadsForExecutiveWithFilters(Integer executiveId, String q, String status, String source, String startDate, String endDate) {
        log.info("SalesManagerService.getLeadsForExecutiveWithFilters() called for executiveId: {}, q: {}, status: {}, source: {}, startDate: {}, endDate: {}", executiveId, q, status, source, startDate, endDate);

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

        log.info("SalesManagerService.getLeadsForExecutiveWithFilters() found {} leads for executive {} based on owner logic", result.size(), executiveId);
        return result;
    }
    
    public List<LeadDTO> getVPLeadsWithFilters(Integer managerId, String q, String status, String source, String startDate, String endDate) {
        log.info("SalesManagerService.getVPLeadsWithFilters() called for managerId: {}, q: {}, status: {}, source: {}, startDate: {}, endDate: {}", managerId, q, status, source, startDate, endDate);

        // Get the VP ID for this manager
        Users manager = usersRepository.findById(managerId).orElse(null);
        if (manager == null || manager.getManagerId() == null) {
            log.warn("Manager {} not found or has no VP", managerId);
            return List.of();
        }
        
        Integer vpId = manager.getManagerId();
        
        // Get leads created by the VP only (based on created_by field)
        List<Lead> leads = leadRepository.findByCreatedBy_UserId(vpId);
        
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

        log.info("SalesManagerService.getVPLeadsWithFilters() found {} leads created by VP {}", result.size(), vpId);
        return result;
    }
    
    public List<LeadDTO> getLeadsForVP(Integer vpId, String q) {
        log.info("SalesManagerService.getLeadsForVP() called for vpId: {}, q: {}", vpId, q);

        // Get all executives under managers that report to this VP
        List<Integer> executiveIds = getExecutiveIdsUnderVP(vpId);
        
        List<Lead> leads;
        if (executiveIds.isEmpty()) {
            leads = List.of();
        } else {
            leads = leadRepository.findLeadsBelongingToExecutives(q, executiveIds);
        }

        List<LeadDTO> result = leads.stream()
                .map(LeadMapper::toDTO)
                .collect(Collectors.toList());

        log.info("SalesManagerService.getLeadsForVP() found {} leads for VP {}", result.size(), vpId);
        return result;
    }
    
    private List<Integer> getExecutiveIdsUnderVP(Integer vpId) {
        List<Users> managers = usersRepository.findByManagerId(vpId).stream()
                .filter(user -> "Sales_Manager".equals(user.getRole()))
                .collect(Collectors.toList());

        return managers.stream()
                .flatMap(manager -> usersRepository.findByManagerId(manager.getUserId()).stream())
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .map(Users::getUserId)
                .collect(Collectors.toList());
    }
    
    public List<LeadDTO> getMyLeadsWithFilters(Integer managerId, String q, String status, String source, String startDate, String endDate) {
        log.info("SalesManagerService.getMyLeadsWithFilters() called for managerId: {}, q: {}, status: {}, source: {}, startDate: {}, endDate: {}", managerId, q, status, source, startDate, endDate);

        // Get leads created by the manager OR assigned to the manager
        List<Lead> createdByManager = leadRepository.findByCreatedBy_UserId(managerId);
        List<Lead> assignedToManager = leadRepository.findByAssignedTo_UserId(managerId);
        
        // Combine and deduplicate leads
        Set<Integer> leadIds = new HashSet<>();
        List<Lead> leads = new ArrayList<>();
        
        // Add leads created by manager
        for (Lead lead : createdByManager) {
            if (leadIds.add(lead.getLeadId())) {
                leads.add(lead);
            }
        }
        
        // Add leads assigned to manager (avoid duplicates)
        for (Lead lead : assignedToManager) {
            if (leadIds.add(lead.getLeadId())) {
                leads.add(lead);
            }
        }
        
        log.info("Found {} leads created by manager {} and {} leads assigned to manager, total unique leads: {}", 
                createdByManager.size(), managerId, assignedToManager.size(), leads.size());
        
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

        log.info("SalesManagerService.getMyLeadsWithFilters() found {} leads after filtering", result.size());
        return result;
    }

    public List<Integer> findHierarchyUserIdsByVpId(Integer vpId) {
        return getExecutiveIdsUnderVP(vpId);
    }
    
    // Contact methods
    public List<ContactDTO> getMyContactsWithFilters(Integer managerId, String q, String startDate, String endDate) {
        log.info("SalesManagerService.getMyContactsWithFilters() called for managerId: {}, q: {}, startDate: {}, endDate: {}", managerId, q, startDate, endDate);

        // Get contacts created by the manager OR assigned to the manager
        List<Contact> createdByManager = contactRepository.findByCreatedBy_UserId(managerId);
        List<Contact> assignedToManager = contactRepository.findByReassignTo_UserId(managerId);
        
        // Combine and deduplicate contacts
        Set<Integer> contactIds = new HashSet<>();
        List<Contact> contacts = new ArrayList<>();
        
        // Add contacts created by manager
        for (Contact contact : createdByManager) {
            if (contactIds.add(contact.getContactId())) {
                contacts.add(contact);
            }
        }
        
        // Add contacts assigned to manager (avoid duplicates)
        for (Contact contact : assignedToManager) {
            if (contactIds.add(contact.getContactId())) {
                contacts.add(contact);
            }
        }
        
        log.info("Found {} contacts created by manager {} and {} contacts assigned to manager, total unique contacts: {}", 
                createdByManager.size(), managerId, assignedToManager.size(), contacts.size());
        
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

        log.info("SalesManagerService.getMyContactsWithFilters() found {} contacts after filtering", result.size());
        return result;
    }
    
    public List<ContactDTO> getVPContactsWithFilters(Integer managerId, String q, String startDate, String endDate) {
        log.info("SalesManagerService.getVPContactsWithFilters() called for managerId: {}, q: {}, startDate: {}, endDate: {}", managerId, q, startDate, endDate);

        // Get the VP ID for this manager
        Users manager = usersRepository.findById(managerId).orElse(null);
        if (manager == null || manager.getManagerId() == null) {
            log.warn("Manager {} not found or has no VP", managerId);
            return List.of();
        }
        
        Integer vpId = manager.getManagerId();
        
        // Get contacts created by the VP only (based on created_by field)
        List<Contact> contacts = contactRepository.findByCreatedBy_UserId(vpId);
        
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

        log.info("SalesManagerService.getVPContactsWithFilters() found {} contacts created by VP {}", result.size(), vpId);
        return result;
    }
    
    public List<ContactDTO> getContactsForExecutiveWithFilters(Integer executiveId, String q, String startDate, String endDate) {
        log.info("SalesManagerService.getContactsForExecutiveWithFilters() called for executiveId: {}, q: {}, startDate: {}, endDate: {}", executiveId, q, startDate, endDate);

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

        log.info("SalesManagerService.getContactsForExecutiveWithFilters() found {} contacts after filtering", result.size());
        return result;
    }
    
    // Pagination methods for leads
    public Map<String, Object> getLeadsForManagerWithPagination(Integer managerId, String q, String status, String source, String startDate, String endDate, int page, int size) {
        log.info("SalesManagerService.getLeadsForManagerWithPagination() called for managerId: {}, page: {}, size: {}", managerId, page, size);
        
        List<LeadDTO> allLeads = getLeadsForManagerWithFilters(managerId, q, status, source, startDate, endDate);
        
        // Sort by creation date (newest first)
        allLeads.sort((a, b) -> {
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return 0;
        });
        
        int totalElements = allLeads.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<LeadDTO> paginatedLeads = startIndex < totalElements ? 
            allLeads.subList(startIndex, endIndex) : new ArrayList<>();
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", paginatedLeads);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        
        return response;
    }
    
    public Map<String, Object> getLeadsForExecutiveWithPagination(Integer executiveId, String q, String status, String source, String startDate, String endDate, int page, int size) {
        log.info("SalesManagerService.getLeadsForExecutiveWithPagination() called for executiveId: {}, page: {}, size: {}", executiveId, page, size);
        
        List<LeadDTO> allLeads = getLeadsForExecutiveWithFilters(executiveId, q, status, source, startDate, endDate);
        
        // Sort by creation date (newest first)
        allLeads.sort((a, b) -> {
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return 0;
        });
        
        int totalElements = allLeads.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<LeadDTO> paginatedLeads = startIndex < totalElements ? 
            allLeads.subList(startIndex, endIndex) : new ArrayList<>();
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", paginatedLeads);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        
        return response;
    }
    
    public Map<String, Object> getMyLeadsWithPagination(Integer managerId, String q, String status, String source, String startDate, String endDate, int page, int size) {
        log.info("SalesManagerService.getMyLeadsWithPagination() called for managerId: {}, page: {}, size: {}", managerId, page, size);
        
        List<LeadDTO> allLeads = getMyLeadsWithFilters(managerId, q, status, source, startDate, endDate);
        
        // Sort by creation date (newest first)
        allLeads.sort((a, b) -> {
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return 0;
        });
        
        int totalElements = allLeads.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<LeadDTO> paginatedLeads = startIndex < totalElements ? 
            allLeads.subList(startIndex, endIndex) : new ArrayList<>();
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", paginatedLeads);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        
        return response;
    }
    
    public Map<String, Object> getVPLeadsWithPagination(Integer managerId, String q, String status, String source, String startDate, String endDate, int page, int size) {
        log.info("SalesManagerService.getVPLeadsWithPagination() called for managerId: {}, page: {}, size: {}", managerId, page, size);
        
        List<LeadDTO> allLeads = getVPLeadsWithFilters(managerId, q, status, source, startDate, endDate);
        
        // Sort by creation date (newest first)
        allLeads.sort((a, b) -> {
            if (a.getCreatedAt() != null && b.getCreatedAt() != null) {
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            }
            return 0;
        });
        
        int totalElements = allLeads.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<LeadDTO> paginatedLeads = startIndex < totalElements ? 
            allLeads.subList(startIndex, endIndex) : new ArrayList<>();
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", paginatedLeads);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        
        return response;
    }
}


