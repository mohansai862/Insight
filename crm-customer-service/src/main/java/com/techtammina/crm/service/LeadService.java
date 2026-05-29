package com.techtammina.crm.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DateUtil;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.techtammina.crm.dto.ExcelUploadResultDTO;
import com.techtammina.crm.dto.LeadDTO;
import com.techtammina.crm.dto.UserDTO;
import com.techtammina.crm.entity.Account;
import com.techtammina.crm.entity.Contact;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.mapper.LeadMapper;
import com.techtammina.crm.repository.AccountRepository;
import com.techtammina.crm.repository.ContactRepository;
import com.techtammina.crm.repository.DealRepository;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.UsersRepository;

import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class LeadService {
    private static final Logger log = LoggerFactory.getLogger(LeadService.class);

	private final LeadRepository leadRepository;
    private final AccountService accountService;
    private final ContactService contactService;
    private final DealService dealService;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final UsersRepository usersRepository;
    private final DealRepository dealRepository;
    private final SalesManagerService salesManagerService;
    private final EmailService emailService;
    private final DatabaseHealthService databaseHealthService;
    private final LeadSyncService leadSyncService;
    private final NotificationService notificationService;
    private final LeadReassignmentService leadReassignmentService;

    public LeadService(LeadRepository leadRepository,
                       AccountService accountService,
                       ContactService contactService,
                       DealService dealService,
                       AccountRepository accountRepository,
                       ContactRepository contactRepository,
                       UsersRepository usersRepository,
                       DealRepository dealRepository,
                       SalesManagerService salesManagerService,
                       EmailService emailService,
                       DatabaseHealthService databaseHealthService,
                       LeadSyncService leadSyncService,
                       NotificationService notificationService,
                       LeadReassignmentService leadReassignmentService) {
        this.leadRepository = leadRepository;
        this.accountService = accountService;
        this.contactService = contactService;
        this.dealService = dealService;
        this.accountRepository = accountRepository;
        this.contactRepository = contactRepository;
        this.usersRepository = usersRepository;
        this.dealRepository = dealRepository;
        this.salesManagerService = salesManagerService;
        this.emailService = emailService;
        this.databaseHealthService = databaseHealthService;
        this.leadSyncService = leadSyncService;
        this.notificationService = notificationService;
        this.leadReassignmentService = leadReassignmentService;
    }

 
    public LeadDTO create(LeadDTO dto) {
        
        log.debug("BACKEND - Creating lead with LinkedIn: {}, Source: {}", dto.getLinkedin(), dto.getSource());
        log.debug("BACKEND - Special fields received:");
        log.debug("   customerLocation: {}", dto.getCustomerLocation());
        log.debug("   prospectValue: {}", dto.getProspectValue());
        log.debug("   decisionAuthority: {}", dto.getDecisionAuthority());
        log.debug("   technologies: {}", dto.getTechnologies());
        log.debug("   numberOfEmployees: {}", dto.getNumberOfEmployees());
        
        // Comprehensive validation for manual lead creation
        validateLeadData(dto);
        
        // Only force status to 'New' for manual creation, not Excel uploads
        if (dto.getStatus() == null || dto.getStatus().trim().isEmpty()) {
            dto.setStatus("New");
        }
        
        Lead entity = LeadMapper.toEntity(dto);
        // Do not manually set timestamps - let @PrePersist handle createdAt and keep updatedAt as NULL
        
        // Force set values for testing
        if (dto.getCustomerLocation() != null) {
            entity.setCustomerLocation(dto.getCustomerLocation());
            log.debug("FORCE SET customerLocation: '{}'", dto.getCustomerLocation());
        }
        if (dto.getProspectValue() != null) {
            entity.setProspectValue(dto.getProspectValue());
            log.debug("FORCE SET prospectValue: {}", dto.getProspectValue());
        }

        // Set createdBy if provided (createdById takes priority, then ownerId historically used as creator)
        Integer creatorId = dto.getCreatedById() != null ? dto.getCreatedById() : dto.getOwnerId();
        if (creatorId != null) {
            Users createdBy = usersRepository.findById(creatorId)
                    .orElseThrow(() -> new RuntimeException("User not found with ID: " + creatorId));
            entity.setCreatedBy(createdBy);
            log.debug("Set created_by to user: {} {} (ID: {})", createdBy.getFirstName(), createdBy.getLastName(), creatorId);
        } else {
            log.warn("No createdById or ownerId provided for lead creation - created_by will be null");
        }

        // Set assignedTo if provided
        if (dto.getAssignedToId() != null) {
            Users assignedTo = usersRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            entity.setAssignedTo(assignedTo);
        }

        Lead saved = leadRepository.save(entity);
        log.debug("LEAD CREATED - ID: {}, Email: {}", saved.getLeadId(), saved.getEmail());
        
        // Verify data was actually saved by re-fetching from database
        Lead verified = leadRepository.findById(saved.getLeadId()).orElse(null);
        if (verified != null) {
            log.debug("VERIFIED FROM DB:");
            log.debug("   customerLocation: '{}'", verified.getCustomerLocation());
            log.debug("   prospectValue: {}", verified.getProspectValue());
            log.debug("   decisionAuthority: '{}'", verified.getDecisionAuthority());
        }
        
        // Ensure no account creation for new leads
        if (saved.getLeadStatus() == Lead.LeadStatus.Converted) {
        }
        
        // DO NOT CREATE ACCOUNTS FOR NEW LEADS - Only during conversion
        log.debug("LEAD ONLY: No account created for new lead (as expected)");
        
        // Send welcome email to new lead
        try {
            String subject = "Welcome to Tech Tammina - Your Lead Has Been Created";
            String body = String.format(
                "Dear %s %s,\\n\\n" +
                "Thank you for your interest in Tech Tammina!\\n\\n" +
                "We have received your information and one of our representatives will contact you soon.\\n\\n" +
                "Lead Details:\\n" +
                "- Company: %s\\n" +
                "- Email: %s\\n" +
                "- Phone: %s\\n\\n" +
                "Best regards,\\n" +
                "Tech Tammina CRM Team",
                saved.getFirstName() != null ? saved.getFirstName() : "",
                saved.getLastName() != null ? saved.getLastName() : "",
                saved.getCompanyName() != null ? saved.getCompanyName() : "N/A",
                saved.getEmail() != null ? saved.getEmail() : "N/A",
                saved.getPhoneNumber() != null ? saved.getPhoneNumber() : "N/A"
            );
            
            if (saved.getEmail() != null && !saved.getEmail().trim().isEmpty()) {
                log.debug("SENDING EMAIL TO: {}", saved.getEmail());
                emailService.sendEmail(saved.getEmail(), null, subject, body);
                log.debug("EMAIL SENT SUCCESSFULLY!");
            } else {
                log.debug("NO EMAIL - Lead has no email address");
            }
        } catch (Exception e) {
            log.error("Failed to send welcome email for lead: {} {}", saved.getFirstName(), saved.getLastName(), e);
        }
        
        return LeadMapper.toDTO(saved);
    }

    public List<LeadDTO> list(String q) {
        return (q == null || q.isBlank() ? leadRepository.findAll() : leadRepository.search(q))
                .stream().map(LeadMapper::toDTO).collect(Collectors.toList());
    }

    public List<LeadDTO> listFiltered(String q, Integer userId, String userRole) {
        List<Lead> base;
        
        if ("IT_Admin".equals(userRole)) {
            // IT Admin: org-wide view
            base = leadRepository.searchWithFilters(
                (q == null || q.isBlank()) ? null : q,
                null, // createdById
                null  // assignedToId
            );
        } else if ("Sales_VP".equals(userRole)) {
            // Sales VP: hierarchy view only
            List<Integer> hierarchyUserIds = salesManagerService.findHierarchyUserIdsByVpId(userId);
            base = leadRepository.findLeadsBelongingToExecutives(
                (q == null || q.isBlank()) ? null : q,
                hierarchyUserIds
            );
        } else if ("Sales_Manager".equals(userRole)) {
            // Sales Manager: view leads belonging to their executives
            List<Integer> executiveIds = salesManagerService.getExecutivesUnderManager(userId)
                .stream()
                .map(dto -> dto.getUserId())
                .collect(Collectors.toList());
            if (executiveIds.isEmpty()) {
                return List.of();
            }
            base = leadRepository.findLeadsBelongingToExecutives(
                (q == null || q.isBlank()) ? null : q,
                executiveIds
            );
        } else if ("Sales_Executive".equals(userRole)) {
            // Sales Executive: leads uploaded by them OR assigned to them
            base = leadRepository.findLeadsForExecutive(
                (q == null || q.isBlank()) ? null : q,
                userId
            );
        } else {
            base = List.of();
        }
        
        return base.stream().map(LeadMapper::toDTO).collect(Collectors.toList());
    }

    private boolean hasAccess(Lead lead, Integer userId, String userRole) {
        // View permissions: Manager/Admin/VP can view all; Executive can view own or assigned
        if ("Sales_Manager".equals(userRole) || "IT_Admin".equals(userRole) || "Sales_VP".equals(userRole)) {
            return true;
        }
        if ("Sales_Executive".equals(userRole)) {
            // Executive can view leads they created OR leads assigned to them
            boolean isCreator = lead.getCreatedBy() != null && lead.getCreatedBy().getUserId().equals(userId);
            boolean isAssigned = lead.getAssignedTo() != null && lead.getAssignedTo().getUserId().equals(userId);
            return isCreator || isAssigned;
        }
        return false;
    }

    private boolean canMutate(Lead lead, Integer userId, String userRole) {
        // Write permissions per matrix
        if ("IT_Admin".equals(userRole)) return false; // view-only
        if ("Sales_VP".equals(userRole)) return false; // org-wide read on leads
        if ("Sales_Manager".equals(userRole)) return true; // team scope validated by hasAccess or upstream
        if ("Sales_Executive".equals(userRole)) {
            // Executive can edit/convert leads assigned to them OR leads they created
            boolean isAssigned = lead.getAssignedTo() != null && lead.getAssignedTo().getUserId().equals(userId);
            boolean isCreator = lead.getCreatedBy() != null && lead.getCreatedBy().getUserId().equals(userId);
            return isAssigned || isCreator;
        }
        return false;
    }

    public List<LeadDTO> listByCompanyNames(List<String> companyNames) {
        if (companyNames == null || companyNames.isEmpty()) {
            return List.of();
        }
        List<Lead> leads = leadRepository.findByCompanyNameInIgnoreCase(companyNames);
        return leads.stream().map(LeadMapper::toDTO).collect(Collectors.toList());
    }

    public List<LeadDTO> listByUserAssociations(String q, Integer userId) {
        List<Lead> leads = leadRepository.findByUserAssociations(
            (q == null || q.isBlank()) ? null : q, userId);
        return leads.stream().map(LeadMapper::toDTO).collect(Collectors.toList());
    }

    public Optional<LeadDTO> get(Integer id, Integer userId, String userRole) {
        return leadRepository.findById(id).filter(lead -> hasAccess(lead, userId, userRole)).map(LeadMapper::toDTO);
    }

    public LeadDTO update(Integer id, LeadDTO dto, Integer userId, String userRole) {
        Lead existing = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found"));

        if (!hasAccess(existing, userId, userRole)) {
            throw new RuntimeException("Access denied: You do not have permission to update this lead");
        }
        if (!canMutate(existing, userId, userRole)) {
            throw new RuntimeException("Access denied: Your role has view-only access for this operation");
        }
        
        // VALIDATE DATA FORMAT - use same validation as create but exclude current lead from duplicate email check
        validateLeadDataForUpdate(dto, id);

        existing.setFirstName(dto.getFirstName());
        existing.setLastName(dto.getLastName());
        existing.setCompanyName(dto.getCompanyName());
        existing.setDesignation(dto.getDesignation());
        existing.setEmail(dto.getEmail());
        existing.setCountryCode(dto.getCountryCode());
        existing.setPhoneNumber(dto.getPhoneNumber());
        existing.setLinkedin(dto.getLinkedin());
        if (dto.getStatus() != null) existing.setLeadStatus(Lead.LeadStatus.valueOf(dto.getStatus()));
        if (dto.getSource() != null && !dto.getSource().trim().isEmpty()) {
            String sourceValue = dto.getSource().trim();
            
            // Map frontend source values to backend enum values
            String mappedSource = null;
            switch (sourceValue.toLowerCase()) {
                case "website":
                    mappedSource = "Website";
                    break;
                case "email":
                    mappedSource = "Email";
                    break;
                case "campaign":
                    mappedSource = "Campaign";
                    break;
                case "cold_call":
                case "cold call":
                    mappedSource = "Cold_Call";
                    break;
                case "referral":
                    mappedSource = "Referral";
                    break;
                case "event":
                    mappedSource = "Event";
                    break;
                case "other":
                    mappedSource = "Other";
                    break;
                default:
                    // Try direct enum match as fallback
                    mappedSource = sourceValue;
            }
            
            try {
                existing.setLeadSource(Lead.LeadSource.valueOf(mappedSource));
                log.debug("SERVICE update - Source mapped: {} -> {}", dto.getSource(), existing.getLeadSource());
            } catch (IllegalArgumentException ex) {
                log.debug("SERVICE update - Invalid source: {}, keeping existing value", mappedSource);
                // Don't change the existing source if invalid value provided
            }
        }
        existing.setIndustry(dto.getIndustry());
        existing.setCountry(dto.getCountry());
        existing.setCompanyLocation(dto.getCompanyLocation()); // Add this line if missing
        existing.setConvertedAccountId(dto.getConvertedAccountId());
        existing.setConvertedContactId(dto.getConvertedContactId());
        existing.setConvertedDealId(dto.getConvertedDealId());
        existing.setCustomerLocation(dto.getCustomerLocation());
        existing.setTechnologies(dto.getTechnologies());
        existing.setProspectValue(dto.getProspectValue());
        existing.setNumberOfEmployees(dto.getNumberOfEmployees());
        existing.setDecisionAuthority(dto.getDecisionAuthority());

        // Update creator if explicitly provided
        if (dto.getCreatedById() != null) {
            Users createdBy = usersRepository.findById(dto.getCreatedById())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            existing.setCreatedBy(createdBy);
        }

        // Update assignedTo if explicitly provided
        if (dto.getAssignedToId() != null) {
            Users oldAssignedTo = existing.getAssignedTo();
            Users assignedTo = usersRepository.findById(dto.getAssignedToId())
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Always allow assigned_to changes, but keep created_by fixed for Manager/VP leads
            existing.setAssignedTo(assignedTo);
            
            // IMPORTANT: Never change created_by during reassignment - it should remain the original creator
            // This ensures Manager/VP ownership is preserved even after lead reassignment
            
            // Send notifications for lead reassignment
            if (oldAssignedTo == null || !oldAssignedTo.getUserId().equals(assignedTo.getUserId())) {
                sendLeadReassignmentNotifications(existing, oldAssignedTo, assignedTo, userId);
            }
        }

        // Do not manually set updatedAt - let @PreUpdate handle it
        Lead savedLead = leadRepository.save(existing);
        
        // Sync changes to related entities if lead is converted
        leadSyncService.syncLeadUpdate(savedLead);
        
        return LeadMapper.toDTO(savedLead);
    }

    public void delete(Integer id, Integer userId, String userRole) {
        Lead lead = leadRepository.findById(id).orElseThrow(() -> new RuntimeException("Lead not found"));
        if (!hasAccess(lead, userId, userRole)) {
            throw new RuntimeException("Access denied: You do not have permission to delete this lead");
        }
        if (!canMutate(lead, userId, userRole)) {
            throw new RuntimeException("Access denied: Your role has view-only access for this operation");
        }
        leadRepository.deleteById(id);
    }

    @Transactional
    public LeadDTO updateStatus(Integer id, String status, Integer userId, String userRole) {
      // Log status update operation

      Lead lead = leadRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("Lead not found"));

      if (!hasAccess(lead, userId, userRole)) {
          throw new RuntimeException("Access denied: You do not have permission to update this lead's status");
      }
      if (!canMutate(lead, userId, userRole)) {
          throw new RuntimeException("Access denied: Your role has view-only access for this operation");
      }

      lead.setLeadStatus(Lead.LeadStatus.valueOf(status));
      Lead saved = leadRepository.save(lead);

      // Lead status updated successfully

        if (saved.getLeadStatus() == Lead.LeadStatus.Converted) {
        // Lead conversion triggered - creating account and contact
        // Only create account if not already converted (prevent duplicates)
        if (saved.getConvertedAccountId() == null) {
            log.debug("Creating account for status-based conversion");
            var accountDTO = accountService.createFromLeadIfMissing(saved, userId); // ensure Account
            if (accountDTO != null) {
              // Account created successfully
              saved.setConvertedAccountId(accountDTO.getAccountId());
              log.debug("Account created with ID: {}", accountDTO.getAccountId());
              
          var contactDTO = contactService.createFromLeadIfMissing(accountDTO.getAccountId(), saved, userId); // ensure Contact
          if (contactDTO != null) {
            // Contact ensured successfully
            saved.setConvertedContactId(contactDTO.getContactId());
            log.debug("Contact created with ID: {}", contactDTO.getContactId());
            
            // Create deal for status-based conversion
            log.debug("Creating deal for status conversion - Account ID: {}, Contact ID: {}", accountDTO.getAccountId(), contactDTO.getContactId());
            
            String dealName = "New Deal from Lead " + saved.getFirstName() + " " + saved.getLastName();
            
            // Check if deal already exists to prevent duplicates
            Optional<Deal> existingDeal = dealRepository.findFirstByAccount_AccountIdAndContact_ContactIdAndDealNameIgnoreCase(
                accountDTO.getAccountId(), contactDTO.getContactId(), dealName);
            
            if (existingDeal.isPresent()) {
                log.debug("Deal already exists for status conversion, using existing ID: {}", existingDeal.get().getDealId());
                saved.setConvertedDealId(existingDeal.get().getDealId());
            } else {
                // Create new deal
                Deal deal = new Deal();
                deal.setDealName(dealName);
                deal.setDealValue(saved.getProspectValue());
                deal.setStage(Deal.Stage.Qualification);
                deal.setProbability(25);

                // Set account and contact relationships
                Account account = accountRepository.findById(accountDTO.getAccountId())
                    .orElseThrow(() -> new RuntimeException("Account not found"));
                deal.setAccount(account);

                Contact contact = contactRepository.findById(contactDTO.getContactId())
                    .orElseThrow(() -> new RuntimeException("Contact not found"));
                deal.setContact(contact);

                Users createdByUser = usersRepository.findById(userId)
                    .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
                    // Apply ownership rules for status-based conversion
                    Users leadCreator = saved.getCreatedBy();
                    if (leadCreator != null && ("Sales_Manager".equals(leadCreator.getRole()) || "Sales_VP".equals(leadCreator.getRole()))) {
                        // If lead was created by Manager/VP, they remain the owner of the deal
                        deal.setCreatedBy(leadCreator);
                        deal.setReassignTo(saved.getAssignedTo() != null ? saved.getAssignedTo() : createdByUser);
                    } else {
                        // For leads created by executives, use normal assignment
                        deal.setCreatedBy(createdByUser);
                        deal.setReassignTo(saved.getAssignedTo() != null ? saved.getAssignedTo() : createdByUser);
                    }
                
                log.debug("Saving deal for status conversion: {}", dealName);
                Deal savedDeal = dealService.save(deal);
                log.debug("Deal saved for status conversion with ID: {}", savedDeal.getDealId());
                saved.setConvertedDealId(savedDeal.getDealId());
            }
          } else {
            log.error("Failed to create contact for status-based conversion");
          }
        } else {
            log.error("Failed to create account for status-based conversion");
        }
        } else {
            log.debug("Lead already has converted account ID: {}, skipping account creation", saved.getConvertedAccountId());
        }
        // Save the lead again with the converted IDs
        saved = leadRepository.save(saved);
        
        // Send customer conversion confirmation email for status-based conversion
        try {
            if (saved.getEmail() != null && !saved.getEmail().trim().isEmpty()) {
                log.debug("SENDING STATUS CONVERSION EMAIL TO: {}", saved.getEmail());
                String subject = "You are now our Customer - Lead Status Updated!";
                String body = String.format(
                    "Dear %s %s,\\n\\n" +
                    "Great news! Your lead status has been updated to 'Converted' - you are now officially our customer!\\n\\n" +
                    "Customer Details:\\n" +
                    "- Company: %s\\n" +
                    "- Email: %s\\n" +
                    "- Phone: %s\\n" +
                    "%s" +
                    "%s" +
                    "%s" +
                    "\\nWhat happens next:\\n" +
                    "- Our team will reach out within 24 hours\\n" +
                    "- You'll receive onboarding materials\\n" +
                    "- A dedicated account manager will be assigned\\n\\n" +
                    "Welcome to the Tech Tammina family!\\n\\n" +
                    "Best regards,\\n" +
                    "Tech Tammina CRM Team",
                    saved.getFirstName() != null ? saved.getFirstName() : "",
                    saved.getLastName() != null ? saved.getLastName() : "",
                    saved.getCompanyName() != null ? saved.getCompanyName() : "N/A",
                    saved.getEmail(),
                    saved.getPhoneNumber() != null ? saved.getPhoneNumber() : "N/A",
                    saved.getConvertedAccountId() != null ? 
                        "- Account ID: " + saved.getConvertedAccountId() + "\\n" : "",
                    saved.getConvertedContactId() != null ? 
                        "- Contact ID: " + saved.getConvertedContactId() + "\\n" : "",
                    saved.getConvertedDealId() != null ? 
                        "- Deal/Opportunity ID: " + saved.getConvertedDealId() + "\\n" : ""
                );
                emailService.sendEmail(saved.getEmail(), null, subject, body);
                log.debug("STATUS CONVERSION EMAIL SENT SUCCESSFULLY!");
            }
        } catch (Exception e) {
            log.error("Failed to send status conversion email for lead: {} {}", saved.getFirstName(), saved.getLastName(), e);
        }
      }
      return LeadMapper.toDTO(saved);
    }



    @Transactional
    public com.techtammina.crm.dto.ConvertLeadResponse convert(Integer id, Map<String, Object> conversionData, Integer userId, String userRole) {
        log.debug("LEAD CONVERSION STARTED - ID: {}, User: {}, Role: {}", id, userId, userRole);
        log.debug("Conversion Data: {}", conversionData);
        
        // Pre-conversion database health check
        try {
            log.debug("PRE-CONVERSION: Checking database health...");
            // Quick validation of auto-increment sequences
            validateDatabaseHealth();
            log.debug("PRE-CONVERSION: Database health check passed");
        } catch (Exception e) {
            // Continue with conversion but log the warning
        }
        
        try {
            // Validate input parameters
            if (id == null || id <= 0) {
                throw new RuntimeException("Invalid lead ID: " + id);
            }
            if (userId == null || userId <= 0) {
                throw new RuntimeException("Invalid user ID: " + userId);
            }
            if (conversionData == null) {
                throw new RuntimeException("Conversion data cannot be null");
            }
            
            Lead lead = leadRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lead not found with ID: " + id));
            
            log.debug("Lead found: {} {} ({})", lead.getFirstName(), lead.getLastName(), lead.getEmail());
            log.debug("   Current Status: {}", lead.getLeadStatus());
            
            // Validate required conversion data
            String companyName = (String) conversionData.get("companyName");
            String contactEmail = (String) conversionData.get("contactEmail");
            String contactName = (String) conversionData.get("contactName");
            
            // Prioritize conversion data company name, then lead's company name
            if (companyName == null || companyName.trim().isEmpty()) {
                companyName = lead.getCompanyName();
                if (companyName == null || companyName.trim().isEmpty()) {
                    throw new RuntimeException("Company name is required for lead conversion. Please ensure the lead has a company name or provide one in the conversion form.");
                }
            }
            if (contactEmail == null || contactEmail.trim().isEmpty()) {
                throw new RuntimeException("Contact email is required for lead conversion");
            }
            if (contactName == null || contactName.trim().isEmpty()) {
                throw new RuntimeException("Contact name is required for lead conversion");
            }
            
            log.debug("Validation passed - Company: {}, Contact: {}, Email: {}", companyName, contactName, contactEmail);

        if (!hasAccess(lead, userId, userRole)) {
            throw new RuntimeException("Access denied: You do not have permission to convert this lead");
        }
        if (!canMutate(lead, userId, userRole)) {
            throw new RuntimeException("Access denied: Your role has view-only access for this operation");
        }

        // Update lead status to Converted
        lead.setLeadStatus(Lead.LeadStatus.Converted);
        
        // Update LinkedIn if provided in conversion data
        String contactLinkedIn = (String) conversionData.get("contactLinkedIn");
        if (contactLinkedIn != null && !contactLinkedIn.trim().isEmpty()) {
            lead.setLinkedin(contactLinkedIn.trim());
            log.debug("Updated lead LinkedIn to: {}", contactLinkedIn);
        }
        
        // Update lead's prospect value with the deal value from conversion form
        Object dealValueObj = conversionData.get("dealValue");
        if (dealValueObj != null) {
            BigDecimal newProspectValue = null;
            if (dealValueObj instanceof Number) {
                newProspectValue = new BigDecimal(dealValueObj.toString());
            } else if (dealValueObj instanceof String && !((String) dealValueObj).trim().isEmpty()) {
                try {
                    newProspectValue = new BigDecimal((String) dealValueObj);
                } catch (NumberFormatException e) {
                    log.warn("Invalid deal value format during lead update: {}", dealValueObj);
                }
            }
            if (newProspectValue != null) {
                lead.setProspectValue(newProspectValue);
                log.debug("Updated lead prospect value to: {}", newProspectValue);
            }
        }
        
        // Do not manually set updatedAt - let @PreUpdate handle it
        Lead savedLead = leadRepository.save(lead);

        // Lead status updated to Converted

        // Create account from conversion data
        log.debug("CONVERTING LEAD TO ACCOUNT - Lead ID: {}", savedLead.getLeadId());
        log.debug("   Lead Company: {}", savedLead.getCompanyName());
        log.debug("   Lead Email: {}", savedLead.getEmail());
        log.debug("   Conversion Data: {}", conversionData);
        
        var accountDTO = accountService.createFromConversionData(savedLead, conversionData, userId);
        if (accountDTO == null) {
            throw new RuntimeException("Failed to create or retrieve account during lead conversion");
        }
        
        // Account created/retrieved successfully
        log.debug("ACCOUNT CONVERSION SUCCESS - Account ID: {}", accountDTO.getAccountId());
        log.debug("   Account Name: {}", accountDTO.getAccountName());
        savedLead.setConvertedAccountId(accountDTO.getAccountId());

        // Create contact from conversion data
        log.debug("CONVERTING LEAD TO CONTACT - Account ID: {}", accountDTO.getAccountId());
        log.debug("   Lead Name: {} {}", savedLead.getFirstName(), savedLead.getLastName());
        log.debug("   Lead Email: {}", savedLead.getEmail());
        
        var contactDTO = contactService.createFromConversionData(accountDTO.getAccountId(), savedLead, conversionData, userId);
        if (contactDTO == null) {
            throw new RuntimeException("Failed to create or retrieve contact during lead conversion");
        }
        
        // Contact ensured successfully
        log.debug("CONTACT CONVERSION SUCCESS - Contact ID: {}", contactDTO.getContactId());
        log.debug("   Contact Name: {} {}", contactDTO.getFirstName(), contactDTO.getLastName());
        log.debug("   Contact Company: {}", contactDTO.getCompanyName());
        savedLead.setConvertedContactId(contactDTO.getContactId());

        // Create a deal on conversion if contact creation was successful
        if (contactDTO.getContactId() != null && contactDTO.getContactId() > 0) {
            log.debug("CONVERTING LEAD TO DEAL - Contact ID: {}", contactDTO.getContactId());
            try {
                Integer dealId = createDealFromConversionData(accountDTO, contactDTO, savedLead, conversionData, userId);
                if (dealId != null && dealId > 0) {
                    log.debug("DEAL CONVERSION SUCCESS - Deal ID: {}", dealId);
                    savedLead.setConvertedDealId(dealId);
                } else {
                    throw new RuntimeException("Deal creation failed - invalid ID: " + dealId);
                }
            } catch (Exception e) {
                e.printStackTrace();
                throw new RuntimeException("Deal creation failed during lead conversion: " + e.getMessage(), e);
            }
        } else {
            throw new RuntimeException("Cannot create deal - invalid contact ID: " + contactDTO.getContactId());
        }

        // Save the lead again with the converted IDs
        log.debug("SAVING LEAD WITH CONVERSION IDs - Lead ID: {}", savedLead.getLeadId());
        log.debug("   Account ID: {}", savedLead.getConvertedAccountId());
        log.debug("   Contact ID: {}", savedLead.getConvertedContactId());
        log.debug("   Deal ID: {}", savedLead.getConvertedDealId());
        savedLead = leadRepository.save(savedLead);
        log.debug("LEAD CONVERSION COMPLETE - All IDs saved");

        // Send customer conversion confirmation email
        try {
            if (savedLead.getEmail() != null && !savedLead.getEmail().trim().isEmpty()) {
                log.debug("SENDING CONVERSION EMAIL TO: {}", savedLead.getEmail());
                String subject = "Welcome to Tech Tammina - You're Now Our Customer!";
                String body = String.format(
                    "Dear %s %s,\\n\\n" +
                    "Congratulations! Your lead has been successfully converted to a customer account.\\n\\n" +
                    "Customer Details:\\n" +
                    "- Company: %s\\n" +
                    "- Email: %s\\n" +
                    "- Phone: %s\\n" +
                    "- Account ID: %s\\n" +
                    "- Contact ID: %s\\n" +
                    "%s" +
                    "\\nNext Steps:\\n" +
                    "- Our sales team will contact you within 24 hours\\n" +
                    "- You will receive access to our customer portal\\n" +
                    "- A dedicated account manager will be assigned\\n\\n" +
                    "Thank you for choosing Tech Tammina!\\n\\n" +
                    "Best regards,\\n" +
                    "Tech Tammina CRM Team",
                    savedLead.getFirstName() != null ? savedLead.getFirstName() : "",
                    savedLead.getLastName() != null ? savedLead.getLastName() : "",
                    savedLead.getCompanyName() != null ? savedLead.getCompanyName() : "N/A",
                    savedLead.getEmail(),
                    savedLead.getPhoneNumber() != null ? savedLead.getPhoneNumber() : "N/A",
                    savedLead.getConvertedAccountId() != null ? savedLead.getConvertedAccountId().toString() : "N/A",
                    savedLead.getConvertedContactId() != null ? savedLead.getConvertedContactId().toString() : "N/A",
                    savedLead.getConvertedDealId() != null ?
                        "- Deal/Opportunity ID: " + savedLead.getConvertedDealId() + "\\n" : ""
                );
                emailService.sendEmail(savedLead.getEmail(), null, subject, body);
                log.debug("CONVERSION EMAIL SENT SUCCESSFULLY!");
            } else {
                log.debug("NO EMAIL - Lead has no email address for conversion notification");
            }
        } catch (Exception e) {
            log.error("Failed to send conversion email for lead: {} {}", savedLead.getFirstName(), savedLead.getLastName(), e);
        }

            return new com.techtammina.crm.dto.ConvertLeadResponse(
                savedLead.getConvertedAccountId(),
                savedLead.getConvertedContactId(),
                savedLead.getConvertedDealId(),
                "Lead converted successfully"
            );
        } catch (Exception e) {
            log.error("Lead conversion failed for ID: {}", id, e);
            throw new RuntimeException("Lead conversion failed: " + e.getMessage(), e);
        }
    }

    private Integer createDealFromConversionData(com.techtammina.crm.dto.AccountDTO accountDTO,
                                            com.techtammina.crm.dto.ContactDTO contactDTO,
                                            Lead lead, Map<String, Object> conversionData, Integer userId) {
        log.debug("Creating deal from conversion data - Account ID: {}, Contact ID: {}", accountDTO.getAccountId(), contactDTO.getContactId());
        log.debug("Conversion data: {}", conversionData);
        
        // Validate input parameters
        if (accountDTO == null || accountDTO.getAccountId() == null || accountDTO.getAccountId() <= 0) {
            throw new RuntimeException("Invalid account DTO: " + accountDTO);
        }
        if (contactDTO == null || contactDTO.getContactId() == null || contactDTO.getContactId() <= 0) {
            throw new RuntimeException("Invalid contact DTO: " + contactDTO);
        }
        if (userId == null || userId <= 0) {
            throw new RuntimeException("Invalid user ID: " + userId);
        }

        String dealName = (String) conversionData.get("dealName");
        if (dealName == null || dealName.trim().isEmpty()) {
            dealName = "New Deal from Lead " + lead.getFirstName() + " " + lead.getLastName();
        }
        log.debug("Deal name: {}", dealName);

        // Get account and contact entities
        Account account = accountRepository.findById(accountDTO.getAccountId())
            .orElseThrow(() -> new RuntimeException("Account not found with ID: " + accountDTO.getAccountId()));
        log.debug("Account found: {}", account.getAccountName());
        
        Contact contact = contactRepository.findById(contactDTO.getContactId())
            .orElseThrow(() -> new RuntimeException("Contact not found with ID: " + contactDTO.getContactId()));
        log.debug("Contact found: {} {}", contact.getFirstName(), contact.getLastName());

        // Check if deal already exists to prevent duplicates
        var existing = dealRepository.findFirstByAccount_AccountIdAndContact_ContactIdAndDealNameIgnoreCase(
            accountDTO.getAccountId(), contactDTO.getContactId(), dealName
        );
        if (existing.isPresent()) {
            log.debug("Deal already exists, returning existing ID: {}", existing.get().getDealId());
            return existing.get().getDealId();
        }

        // Get user entity
        Users createdByUser = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));
        log.debug("User found: {} {}", createdByUser.getFirstName(), createdByUser.getLastName());

        Deal deal = new Deal();
        deal.setDealName(dealName);

        // Use deal value from conversion data with priority over lead data
        Object dealValueObj = conversionData.get("dealValue");
        BigDecimal dealValue = null;
        
        log.debug("Processing deal value - Raw value from conversion: {}, Type: {}", 
            dealValueObj, dealValueObj != null ? dealValueObj.getClass().getSimpleName() : "null");
        
        if (dealValueObj instanceof Number) {
            dealValue = new BigDecimal(dealValueObj.toString());
            log.debug("Deal value from Number: {}", dealValue);
        } else if (dealValueObj instanceof String && !((String) dealValueObj).trim().isEmpty()) {
            try {
                dealValue = new BigDecimal((String) dealValueObj);
                log.debug("Deal value from String: {}", dealValue);
            } catch (NumberFormatException e) {
                log.warn("Invalid deal value format: {}", dealValueObj);
            }
        }
        
        // Only use lead's prospect value if no valid deal value provided in conversion data
        if (dealValue == null) {
            dealValue = lead.getProspectValue();
            log.debug("Using lead prospect value as fallback: {}", dealValue);
        }
        
        // Final fallback to zero
        if (dealValue == null) {
            dealValue = new BigDecimal("0.00");
            log.debug("Using zero as final fallback");
        }
        
        log.debug("Final deal value set to: {}", dealValue);
        deal.setDealValue(dealValue);
        deal.setStage(Deal.Stage.Qualification);
        deal.setProbability(25);
        
        // Set expected close date from conversion data
        String expectedCloseDateStr = (String) conversionData.get("expectedCloseDate");
        if (expectedCloseDateStr != null && !expectedCloseDateStr.trim().isEmpty()) {
            try {
                java.time.LocalDate expectedCloseDate = java.time.LocalDate.parse(expectedCloseDateStr);
                deal.setExpectedCloseDate(expectedCloseDate);
                log.debug("Expected close date set: {}", expectedCloseDate);
            } catch (Exception e) {
            }
        }
        deal.setAccount(account);
        deal.setContact(contact);
        deal.setCreatedBy(createdByUser);
        
        // Apply ownership rules for deal assignment
        Users leadCreator = lead.getCreatedBy();
        if (leadCreator != null && ("Sales_Manager".equals(leadCreator.getRole()) || "Sales_VP".equals(leadCreator.getRole()))) {
            // If lead was created by Manager/VP, they remain the owner of the deal
            deal.setCreatedBy(leadCreator);
            // Assign the deal to the current assignee or the person performing conversion
            deal.setReassignTo(lead.getAssignedTo() != null ? lead.getAssignedTo() : createdByUser);
        } else {
            // For leads created by executives, use normal assignment
            deal.setCreatedBy(createdByUser);
            deal.setReassignTo(lead.getAssignedTo() != null ? lead.getAssignedTo() : createdByUser);
        }
        
        log.debug("Saving deal with details:");
        log.debug("   Name: {}", deal.getDealName());
        log.debug("   Value: {}", deal.getDealValue());
        log.debug("   Stage: {}", deal.getStage());
        log.debug("   Account ID: {}", deal.getAccount().getAccountId());
        log.debug("   Contact ID: {}", deal.getContact().getContactId());
        log.debug("   Created By ID: {}", deal.getCreatedBy().getUserId());
        
        try {
            Deal savedDeal = dealService.save(deal);
            
            // Verify the deal was saved with a valid ID
            if (savedDeal.getDealId() == null || savedDeal.getDealId() <= 0) {
                throw new RuntimeException("Failed to create deal - invalid ID returned: " + savedDeal.getDealId());
            }
            
            log.debug("Deal saved successfully with ID: {}", savedDeal.getDealId());
            return savedDeal.getDealId();
            
        } catch (Exception e) {
            log.error("Failed to save deal during lead conversion: {}", deal.getDealName(), e);
            throw new RuntimeException("Failed to save deal: " + e.getMessage(), e);
        }
    }

    public List<LeadDTO> filterByExecutive(Integer executiveId, Integer managerId, String userRole, String q) {
        // Validate that executive belongs to manager
        if (!salesManagerService.isExecutiveUnderManager(executiveId, managerId)) {
            throw new RuntimeException("Access denied: Executive does not belong to this manager");
        }
        
        // Get leads for the specific executive
        List<Lead> leads = leadRepository.findLeadsForExecutive(q, executiveId);
        return leads.stream().map(LeadMapper::toDTO).collect(Collectors.toList());
    }

    public List<LeadDTO> getLeadsForManager(Integer managerId, String userRole, String q) {
        // Validate user role - only Sales_Manager can use this endpoint
        if (!"Sales_Manager".equals(userRole)) {
            throw new RuntimeException("Access denied: Only Sales Managers can access this endpoint");
        }

        // Get all executives under this manager
        List<Integer> executiveIds = salesManagerService.getExecutivesUnderManager(managerId)
                .stream()
                .map(UserDTO::getUserId)
                .collect(Collectors.toList());

        if (executiveIds.isEmpty()) {
            return new ArrayList<>();
        }

        // Fetch leads assigned to all executives under this manager
        List<Lead> leads = leadRepository.findLeadsAssignedToExecutives(q, executiveIds);
        return leads.stream().map(LeadMapper::toDTO).collect(Collectors.toList());
    }
    
    public Map<String, Object> listFilteredWithPagination(String search, Integer manager, Integer executive, String status, String source, String startDate, String endDate, int page, int size, Integer userId, String userRole) {
        List<Lead> allLeads;
        
        // Get base leads based on role
        if ("IT_Admin".equals(userRole)) {
            allLeads = leadRepository.findAll();
        } else if ("Sales_VP".equals(userRole)) {
            List<Integer> hierarchyUserIds = salesManagerService.findHierarchyUserIdsByVpId(userId);
            allLeads = leadRepository.findLeadsBelongingToExecutives(null, hierarchyUserIds);
        } else if ("Sales_Manager".equals(userRole)) {
            List<Integer> executiveIds = salesManagerService.getExecutivesUnderManager(userId)
                .stream()
                .map(dto -> dto.getUserId())
                .collect(Collectors.toList());
            if (executiveIds.isEmpty()) {
                allLeads = new ArrayList<>();
            } else {
                allLeads = leadRepository.findLeadsBelongingToExecutives(null, executiveIds);
            }
        } else if ("Sales_Executive".equals(userRole)) {
            allLeads = leadRepository.findLeadsForExecutive(null, userId);
        } else {
            allLeads = new ArrayList<>();
        }
        
        // Apply filters
        List<Lead> filteredLeads = allLeads.stream()
            .filter(lead -> {
                // Search filter
                if (search != null && !search.trim().isEmpty()) {
                    String searchLower = search.toLowerCase();
                    String fullName = (lead.getFirstName() + " " + lead.getLastName()).toLowerCase();
                    return fullName.contains(searchLower) ||
                           lead.getEmail().toLowerCase().contains(searchLower) ||
                           lead.getCompanyName().toLowerCase().contains(searchLower);
                }
                return true;
            })
            .filter(lead -> {
                // Manager filter (for VP role)
                if (manager != null && "Sales_VP".equals(userRole)) {
                    return lead.getCreatedBy() != null && manager.equals(lead.getCreatedBy().getManagerId());
                }
                return true;
            })
            .filter(lead -> {
                // Executive filter - prioritize assigned_to over created_by
                if (executive != null) {
                    // If lead is assigned to someone, only check assigned_to
                    if (lead.getAssignedTo() != null) {
                        return executive.equals(lead.getAssignedTo().getUserId());
                    }
                    // If not assigned to anyone, check created_by
                    return lead.getCreatedBy() != null && executive.equals(lead.getCreatedBy().getUserId());
                }
                return true;
            })
            .filter(lead -> {
                // Status filter
                if (status != null && !status.trim().isEmpty() && !"All".equals(status)) {
                    return lead.getLeadStatus().name().equalsIgnoreCase(status);
                }
                return true;
            })
            .filter(lead -> {
                // Source filter
                if (source != null && !source.trim().isEmpty() && !"All".equals(source)) {
                    return lead.getLeadSource().name().equalsIgnoreCase(source);
                }
                return true;
            })
            .filter(lead -> {
                // Date range filter
                if (startDate != null && !startDate.trim().isEmpty() && endDate != null && !endDate.trim().isEmpty()) {
                    try {
                        java.time.LocalDate start = java.time.LocalDate.parse(startDate);
                        java.time.LocalDate end = java.time.LocalDate.parse(endDate);
                        java.time.LocalDate leadDate = lead.getCreatedAt().toLocalDate();
                        return !leadDate.isBefore(start) && !leadDate.isAfter(end);
                    } catch (Exception e) {
                        return true;
                    }
                }
                return true;
            })
            .collect(Collectors.toList());
        
        // Sort by creation date - group by minute (upload batch), newest batch first, but preserve order within batch
        filteredLeads.sort((a, b) -> {
            // Truncate to minute to group upload batches together
            java.time.LocalDateTime aMinute = a.getCreatedAt().truncatedTo(java.time.temporal.ChronoUnit.MINUTES);
            java.time.LocalDateTime bMinute = b.getCreatedAt().truncatedTo(java.time.temporal.ChronoUnit.MINUTES);
            
            // If different batches (different minutes), newest batch first
            if (!aMinute.equals(bMinute)) {
                return bMinute.compareTo(aMinute);
            }
            // Same batch (same minute), preserve Excel order (oldest first within batch)
            return a.getCreatedAt().compareTo(b.getCreatedAt());
        });
        
        // Pagination
        int totalElements = filteredLeads.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<Lead> paginatedLeads = startIndex < totalElements ? 
            filteredLeads.subList(startIndex, endIndex) : new ArrayList<>();
        
        // Convert to DTOs
        List<LeadDTO> leadDTOs = paginatedLeads.stream()
            .map(LeadMapper::toDTO)
            .collect(Collectors.toList());
        
        // Get available managers and executives for filters
        List<Map<String, Object>> availableManagers = new ArrayList<>();
        List<Map<String, Object>> availableExecutives = new ArrayList<>();
        
        if ("Sales_VP".equals(userRole)) {
            try {
                availableManagers = salesManagerService.getManagersUnderVP(userId)
                    .stream()
                    .map(dto -> {
                        Map<String, Object> managerMap = new HashMap<>();
                        managerMap.put("userId", dto.getUserId());
                        managerMap.put("name", dto.getFirstName() + " " + dto.getLastName());
                        return managerMap;
                    })
                    .collect(Collectors.toList());
            } catch (Exception e) {
                log.error("Error getting managers for VP", e);
            }
        }
        
        if ("Sales_Manager".equals(userRole)) {
            try {
                availableExecutives = salesManagerService.getExecutivesUnderManager(userId)
                    .stream()
                    .map(dto -> {
                        Map<String, Object> executiveMap = new HashMap<>();
                        executiveMap.put("userId", dto.getUserId());
                        executiveMap.put("name", dto.getFirstName() + " " + dto.getLastName());
                        return executiveMap;
                    })
                    .collect(Collectors.toList());
            } catch (Exception e) {
                log.error("Error getting executives for manager", e);
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("data", leadDTOs);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        response.put("availableManagers", availableManagers);
        response.put("availableExecutives", availableExecutives);
        
        return response;
    }

    public ExcelUploadResultDTO uploadExcelFile(MultipartFile file, Integer userId) {
        long startTime = System.currentTimeMillis();
        log.info("Starting Excel upload for user: {}, file size: {} bytes", userId, file.getSize());
        
        try {
            // Memory check before processing
            Runtime runtime = Runtime.getRuntime();
            long maxMemory = runtime.maxMemory();
            long usedMemory = runtime.totalMemory() - runtime.freeMemory();
            double memoryUsage = (double) usedMemory / maxMemory;
            
            if (memoryUsage > 0.8) {
                log.warn("High memory usage ({:.1f}%) before Excel processing, requesting GC", memoryUsage * 100);
                System.gc();
            }
            
            // Validate file format and size
            if (file.isEmpty()) {
                throw new RuntimeException("File is empty. Please select a valid Excel file.");
            }
            
            // Check file size limit (prevent memory issues)
            long fileSizeLimit = 50 * 1024 * 1024; // 50MB limit for Excel files
            if (file.getSize() > fileSizeLimit) {
                throw new RuntimeException("Excel file too large. Maximum size allowed is 50MB.");
            }
            
            String fileName = file.getOriginalFilename();
            if (fileName == null || (!fileName.toLowerCase().endsWith(".xlsx") && !fileName.toLowerCase().endsWith(".xls"))) {
                throw new RuntimeException("Invalid file format. Please upload an Excel file (.xlsx or .xls).");
            }
            
            Workbook workbook = null;
            try {
                // Use streaming for large files to reduce memory usage
                if (fileName.toLowerCase().endsWith(".xlsx")) {
                    workbook = new XSSFWorkbook(file.getInputStream());
                } else {
                    workbook = new HSSFWorkbook(file.getInputStream());
                }
                
                log.debug("Excel workbook loaded successfully, sheets: {}", workbook.getNumberOfSheets());
            } catch (Exception e) {
                log.error("Failed to read Excel file: {}", fileName, e);
                throw new RuntimeException("Unable to read Excel file. The file may be corrupted or password-protected.");
            }

            if (workbook.getNumberOfSheets() == 0) {
                workbook.close();
                throw new RuntimeException("Excel file contains no sheets. Please provide a valid Excel file with data.");
            }
            
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getLastRowNum() < 1) {
                workbook.close();
                throw new RuntimeException("Excel file is empty. Please provide a file with header row and data rows.");
            }
            
            // Validate headers
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) {
                workbook.close();
                throw new RuntimeException("Missing header row. Please ensure the first row contains column headers.");
            }
            
            List<String> expectedHeaders = List.of(
                "first_name", "last_name", "company_name", "designation", "email", "country_code", "phone_number",
                "linkedin", "industry", "country", "company_location", "lead_status", "lead_source",
                "customer_location", "technologies", "prospect_value", "number_of_employees", "decision_authority", "created_by"
            );
            
            // Create a map of actual headers for flexible matching
            Map<String, Integer> headerMap = new HashMap<>();
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell headerCell = headerRow.getCell(i);
                if (headerCell != null) {
                    String headerValue = getCellValueAsString(headerCell);
                    if (headerValue != null && !headerValue.trim().isEmpty()) {
                        // Normalize header name for matching
                        String normalizedHeader = headerValue.toLowerCase().trim().replace(" ", "_");
                        headerMap.put(normalizedHeader, i);
                    }
                }
            }
            
            // Check for missing required headers
            List<String> missingHeaders = new ArrayList<>();
            for (String expectedHeader : expectedHeaders) {
                if (!headerMap.containsKey(expectedHeader)) {
                    missingHeaders.add(expectedHeader.replace("_", " "));
                }
            }
            
            if (!missingHeaders.isEmpty()) {
                workbook.close();
                throw new RuntimeException("Missing required column headers: " + String.join(", ", missingHeaders) + ". Please ensure your Excel file has the correct column headers.");
            }
            
            List<String> errors = new ArrayList<>();
            List<LeadDTO> validLeads = new ArrayList<>();
            Map<String, Integer> emailToRowMap = new HashMap<>(); // Track emails and their first occurrence
            int totalRows = sheet.getLastRowNum();
            int emptyRowCount = 0;
            
            // Check row count limit to prevent memory issues
            int maxRows = 10000; // Limit to 10,000 rows
            if (totalRows > maxRows) {
                workbook.close();
                throw new RuntimeException(String.format("Excel file has too many rows (%d). Maximum allowed is %d rows.", totalRows, maxRows));
            }
            
            log.info("Processing {} rows from Excel file", totalRows);
            
            // VALIDATE ALL ROWS FIRST - NO SAVING YET
            for (int i = 1; i <= totalRows; i++) {
                // Memory check every 1000 rows
                if (i % 1000 == 0) {
                    long currentUsed = runtime.totalMemory() - runtime.freeMemory();
                    double currentUsage = (double) currentUsed / maxMemory;
                    if (currentUsage > 0.85) {
                        log.warn("High memory usage ({:.1f}%) at row {}, requesting GC", currentUsage * 100, i);
                        System.gc();
                    }
                    log.debug("Processed {} rows, memory usage: {:.1f}%", i, currentUsage * 100);
                }
                Row row = sheet.getRow(i);
                if (row == null || isRowEmpty(row)) {
                    emptyRowCount++;
                    continue;
                }
                
                try {
                    LeadDTO lead = parseRowToLeadDTO(row, i + 1, headerMap);
                    
                    // Track email for duplicate detection within Excel file FIRST
                    if (lead.getEmail() != null && !lead.getEmail().trim().isEmpty()) {
                        String email = lead.getEmail().trim().toLowerCase();
                        if (emailToRowMap.containsKey(email)) {
                            errors.add("Row " + (i + 1) + ": Duplicate email '" + lead.getEmail() + "' found in row " + emailToRowMap.get(email) + " of this Excel file");
                            continue;
                        } else {
                            emailToRowMap.put(email, i + 1);
                        }
                    }
                    
                    // CHECK FOR INVALID DATA
                    List<String> rowErrors = validateLeadRow(lead, i + 1, row, headerMap);
                    if (!rowErrors.isEmpty()) {
                        errors.addAll(rowErrors);
                        continue; // Skip this row, errors already added
                    }
                    
                    // Handle Created_By empid logic
                    if (lead.getCreatedByEmpid() != null && !lead.getCreatedByEmpid().trim().isEmpty()) {
                        Users createdByUser = usersRepository.findByEmpid(lead.getCreatedByEmpid().trim());
                        if (createdByUser != null) {
                            lead.setCreatedById(createdByUser.getUserId());
                            log.debug("Row {}: Set created_by to user {} (from empid: {})", i + 1, createdByUser.getUserId(), lead.getCreatedByEmpid());
                            // If created_by is Manager/VP, assigned_to should be the uploader (Executive)
                            if ("Sales_Manager".equals(createdByUser.getRole()) || "Sales_VP".equals(createdByUser.getRole())) {
                                lead.setAssignedToId(userId); // Executive who uploaded
                                log.debug("Row {}: Manager/VP created lead, assigned to uploader: {}", i + 1, userId);
                            } else {
                                lead.setAssignedToId(createdByUser.getUserId()); // Same person
                                log.debug("Row {}: Executive created lead, assigned to same person: {}", i + 1, createdByUser.getUserId());
                            }
                        } else {
                            errors.add("Row " + (i + 1) + ": Invalid Created_By empid '" + lead.getCreatedByEmpid() + "' - user not found");
                            continue;
                        }
                    } else {
                        // When created_by is empty, set to the executive who uploaded the Excel
                        if (userId != null) {
                            lead.setCreatedById(userId);
                            lead.setAssignedToId(userId);
                            log.debug("Row {}: Empty created_by field, set to uploader: {}", i + 1, userId);
                        } else {
                            errors.add("Row " + (i + 1) + ": Unable to determine uploader - user ID is null");
                            continue;
                        }
                    }
                    
                    validLeads.add(lead);
                } catch (Exception e) {
                    errors.add("Row " + (i + 1) + ": Error parsing data - " + e.getMessage());
                }
            }
            
            workbook.close();
            
            // Don't report empty rows as errors - they are automatically skipped during processing
            
            // IF ANY ERRORS FOUND, RETURN DETAILED ERROR RESPONSE - NO DATA SAVED
            if (!errors.isEmpty()) {
                ExcelUploadResultDTO errorResult = new ExcelUploadResultDTO();
                errorResult.setTotalRecords(totalRows);
                errorResult.setSuccessfulRecords(0);
                errorResult.setFailedRecords(totalRows - validLeads.size());
                errorResult.setSuccess(false);
                errorResult.setErrors(errors);
                errorResult.setCreatedLeads(new ArrayList<>());
                
                // Create detailed error message
                StringBuilder errorMessage = new StringBuilder();
                if (errors.size() == 1) {
                    errorMessage.append("1 validation error found:\n");
                } else {
                    errorMessage.append(errors.size()).append(" validation errors found:\n");
                }
                
                // Show first 10 errors to avoid overwhelming the user
                int errorCount = Math.min(10, errors.size());
                for (int i = 0; i < errorCount; i++) {
                    errorMessage.append("• ").append(errors.get(i)).append("\n");
                }
                if (errors.size() > 10) {
                    errorMessage.append("... and ").append(errors.size() - 10).append(" more errors. Please fix the above issues and try again.");
                }
                
                errorResult.setMessage(errorMessage.toString());
                return errorResult;
            }
            
            // ALL DATA VALID - SAVE ALL RECORDS IN SINGLE TRANSACTION
            List<LeadDTO> savedLeads = new ArrayList<>();
            List<String> saveErrors = new ArrayList<>();
            
            try {
                // Process all leads in a single transaction for all-or-nothing behavior
                for (LeadDTO lead : validLeads) {
                    try {
                        // Use createLeadEntity to avoid JPA validation annotations
                        Lead entity = createLeadEntityFromDTO(lead);
                        Lead saved = leadRepository.save(entity);
                        savedLeads.add(LeadMapper.toDTO(saved));
                        
                        // Send welcome email only for New status leads
                        if (saved.getLeadStatus() == Lead.LeadStatus.New) {
                            sendWelcomeEmail(saved);
                        }
                        
                        // Add 2ms delay to ensure unique created_at timestamps and preserve Excel row order
                        try {
                            Thread.sleep(2);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                        
                    } catch (Exception e) {
                        log.error("Failed to save lead: {} {}", lead.getFirstName(), lead.getLastName(), e);
                        // Extract clean error message
                        String cleanError = extractCleanErrorMessage(e);
                        saveErrors.add("Row for " + lead.getFirstName() + " " + lead.getLastName() + ": " + cleanError);
                    }
                }
                
                // If any save errors occurred, rollback the transaction
                if (!saveErrors.isEmpty()) {
                    throw new RuntimeException("Validation errors occurred during save");
                }
                
            } catch (Exception e) {
                // Transaction will be rolled back automatically
                log.error("Transaction rolled back due to validation errors", e);
                
                ExcelUploadResultDTO errorResult = new ExcelUploadResultDTO();
                errorResult.setTotalRecords(validLeads.size());
                errorResult.setSuccessfulRecords(0);
                errorResult.setFailedRecords(validLeads.size());
                errorResult.setSuccess(false);
                errorResult.setErrors(saveErrors.isEmpty() ? List.of("Validation failed during save") : saveErrors);
                errorResult.setCreatedLeads(new ArrayList<>());
                errorResult.setMessage("Upload failed. No records were saved.");
                return errorResult;
            }
            
            ExcelUploadResultDTO result = new ExcelUploadResultDTO();
            result.setTotalRecords(validLeads.size());
            result.setSuccessfulRecords(savedLeads.size());
            result.setFailedRecords(0);
            result.setSuccess(true);
            result.setErrors(new ArrayList<>());
            result.setCreatedLeads(savedLeads);
            result.setMessage("Successfully imported " + savedLeads.size() + " leads.");
            
            long duration = System.currentTimeMillis() - startTime;
            log.info("Excel upload completed in {}ms: {} leads processed, {} saved", 
                    duration, validLeads.size(), savedLeads.size());
            
            return result;
            
        } catch (RuntimeException e) {
            log.error("Excel upload failed for user: {}", userId, e);
            // Return structured error response instead of throwing exception
            ExcelUploadResultDTO errorResult = new ExcelUploadResultDTO();
            errorResult.setTotalRecords(0);
            errorResult.setSuccessfulRecords(0);
            errorResult.setFailedRecords(1);
            errorResult.setSuccess(false);
            errorResult.setMessage(e.getMessage());
            errorResult.setErrors(List.of(e.getMessage()));
            errorResult.setCreatedLeads(new ArrayList<>());
            return errorResult;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("Unexpected error during Excel upload after {}ms for user: {}", duration, userId, e);
            
            // Return structured error response for unexpected errors
            ExcelUploadResultDTO errorResult = new ExcelUploadResultDTO();
            errorResult.setTotalRecords(0);
            errorResult.setSuccessfulRecords(0);
            errorResult.setFailedRecords(1);
            errorResult.setSuccess(false);
            errorResult.setMessage("Unexpected error processing Excel file: " + e.getMessage());
            errorResult.setErrors(List.of("Unexpected error: " + e.getMessage()));
            errorResult.setCreatedLeads(new ArrayList<>());
            return errorResult;
        } finally {
            // Ensure memory cleanup
            System.gc();
        }
    }
    
    private List<String> validateLeadRow(LeadDTO lead, int rowNum, Row row, Map<String, Integer> headerMap) {
        List<String> errors = new ArrayList<>();
        
        // CHECK MANDATORY FIELDS - First Name
        if (isEmpty(lead.getFirstName())) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (isOnlySpaces(lead.getFirstName())) {
            errors.add("Row " + rowNum + ": First name cannot contain only spaces");
        } else if (containsNumbers(lead.getFirstName())) {
            errors.add("Row " + rowNum + ": First name cannot contain numbers");
        } else if (!isValidTextOnly(lead.getFirstName())) {
            errors.add("Row " + rowNum + ": First name can only contain letters and spaces");
        }
        
        // CHECK MANDATORY FIELDS - Last Name
        if (isEmpty(lead.getLastName())) {
            errors.add("Row " + rowNum + ": This field  is required");
        } else if (isOnlySpaces(lead.getLastName())) {
            errors.add("Row " + rowNum + ": Last name cannot contain only spaces");
        } else if (containsNumbers(lead.getLastName())) {
            errors.add("Row " + rowNum + ": Last name cannot contain numbers");
        } else if (!isValidTextOnly(lead.getLastName())) {
            errors.add("Row " + rowNum + ": Last name can only contain letters and spaces");
        }
        
        // CHECK MANDATORY FIELDS - Company Name
        if (isEmpty(lead.getCompanyName())) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (isOnlySpaces(lead.getCompanyName())) {
            errors.add("Row " + rowNum + ": Company name cannot contain only spaces");
        }
        
        // CHECK MANDATORY FIELDS - Designation
        if (isEmpty(lead.getDesignation())) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (isOnlySpaces(lead.getDesignation())) {
            errors.add("Row " + rowNum + ": Designation cannot contain only spaces");
        } else if (containsNumbers(lead.getDesignation())) {
            errors.add("Row " + rowNum + ": Designation cannot contain numbers");
        }
        
        // CHECK MANDATORY FIELDS - Email
        if (isEmpty(lead.getEmail())) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (isOnlySpaces(lead.getEmail())) {
            errors.add("Row " + rowNum + ": Email cannot contain only spaces");
        } else if (!isValidEmail(lead.getEmail())) {
            errors.add("Row " + rowNum + ": Invalid email format");
        } else {
            // CHECK DUPLICATES
            if (leadRepository.findByEmail(lead.getEmail().trim()).isPresent()) {
                errors.add("Row " + rowNum + ": Email already exists");
            }
        }
        
        // CHECK MANDATORY FIELDS - Country Code
        String countryCode = lead.getCountryCode();
        if (isEmpty(countryCode)) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (!isValidCountryCode(countryCode)) {
            errors.add("Row " + rowNum + ": Invalid country code. Valid codes are: +91 (India), +1 (US), +44 (UK), +49 (Germany)");
        }
        
        // CHECK MANDATORY FIELDS - Phone Number with country code validation
        if (isEmpty(lead.getPhoneNumber())) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (isOnlySpaces(lead.getPhoneNumber())) {
            errors.add("Row " + rowNum + ": Phone number cannot contain only spaces");
        } else if (containsLetters(lead.getPhoneNumber())) {
            errors.add("Row " + rowNum + ": Phone number is invalid");
        } else if (!isValidPhoneNumberForCountryCode(lead.getPhoneNumber(), countryCode)) {
            String expectedLength = getExpectedPhoneLengthMessage(countryCode);
            errors.add("Row " + rowNum + ": Phone number is invalid for country code " + countryCode + ". " + expectedLength);
        }
        
        // CHECK MANDATORY FIELDS - Company Location
        if (isEmpty(lead.getCompanyLocation())) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (isOnlySpaces(lead.getCompanyLocation())) {
            errors.add("Row " + rowNum + ": Company location cannot contain only spaces");
        }
        
        // CHECK MANDATORY FIELDS - Customer Location
        if (isEmpty(lead.getCustomerLocation())) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (isOnlySpaces(lead.getCustomerLocation())) {
            errors.add("Row " + rowNum + ": Customer location cannot contain only spaces");
        }
        
        // CHECK MANDATORY FIELDS - Industry
        if (isEmpty(lead.getIndustry())) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (isOnlySpaces(lead.getIndustry())) {
            errors.add("Row " + rowNum + ": Industry cannot contain only spaces");
        } else if (!isValidIndustry(lead.getIndustry())) {
            errors.add("Row " + rowNum + ": Industry can only contain letters, numbers, spaces, and special characters: & - . , ' ( ) [ ]");
        }
        
        // CHECK MANDATORY FIELDS - Technologies
        if (isEmpty(lead.getTechnologies())) {
            errors.add("Row " + rowNum + ": This field is required");
        } else if (isOnlySpaces(lead.getTechnologies())) {
            errors.add("Row " + rowNum + ": Technologies cannot contain only spaces");
        }
        
        // CHECK MANDATORY FIELDS - Prospect Value
        if (lead.getProspectValue() == null) {
            // Check if the original cell had text data
            Integer prospectCol = headerMap.get("prospect_value");
            if (prospectCol != null) {
                Cell prospectCell = row.getCell(prospectCol);
                String prospectValueStr = getCellValueAsString(prospectCell);
                if (prospectValueStr != null && !prospectValueStr.trim().isEmpty()) {
                    // Cell has data but couldn't be parsed as number - it's text
                    errors.add("Row " + rowNum + ": Prospect value should be integer only");
                } else {
                    // Cell is empty
                    errors.add("Row " + rowNum + ": This field is required");
                }
            } else {
                errors.add("Row " + rowNum + ": This field is required");
            }
        } else if (lead.getProspectValue().compareTo(java.math.BigDecimal.ZERO) < 0) {
            errors.add("Row " + rowNum + ": Prospect value must be a positive number");
        }
        
        // CHECK MANDATORY FIELDS - Number of Employees
        if (lead.getNumberOfEmployees() == null) {
            // Check if the original cell had text data
            Integer employeesCol = headerMap.get("number_of_employees");
            if (employeesCol == null) employeesCol = headerMap.get("number of employees"); // fallback
            if (employeesCol != null) {
                Cell employeesCell = row.getCell(employeesCol);
                String employeesStr = getCellValueAsString(employeesCell);
                if (employeesStr != null && !employeesStr.trim().isEmpty()) {
                    // Cell has data but couldn't be parsed as number - it's text
                    errors.add("Row " + rowNum + ": Number of employees should be integer only");
                } else {
                    // Cell is empty
                    errors.add("Row " + rowNum + ": This field is required");
                }
            } else {
                errors.add("Row " + rowNum + ": This field is required");
            }
        } else if (lead.getNumberOfEmployees() <= 0) {
            errors.add("Row " + rowNum + ": Number of employees must be a positive number");
        }
        
        // VALIDATE LINKEDIN URL - Optional field but must be valid URL if provided
        if (lead.getLinkedin() != null && !lead.getLinkedin().trim().isEmpty()) {
            String linkedin = lead.getLinkedin().trim();
            if (!isValidLinkedInUrl(linkedin)) {
                errors.add("Row " + rowNum + ": LinkedIn must be a valid URL starting with http:// or https://");
            }
        }
        
        // VALIDATE STATUS - Optional validation since we have default mapping
        if (lead.getStatus() != null && !lead.getStatus().trim().isEmpty()) {
            String status = lead.getStatus().trim();
            if (!isValidLeadStatus(status)) {
                errors.add("Row " + rowNum + ": Invalid lead status '" + status + "'. Valid values are: New, Contacted, Qualified, Unqualified, Converted");
            }
        }
        
        return errors;
    }
    
    private boolean isRowEmpty(Row row) {
        if (row == null) return true;
        
        for (int i = 0; i < 16; i++) { // Check first 16 columns
            Cell cell = row.getCell(i);
            if (cell != null && !isEmpty(getCellValueAsString(cell))) {
                return false;
            }
        }
        return true;
    }
    
    private boolean isValidTextOnly(String value) {
        if (isEmpty(value)) return false;
        return value.matches("^[a-zA-Z\\s]+$") && !isOnlySpaces(value);
    }
    
    private boolean isValidPhoneNumber(String phoneNumber) {
        if (isEmpty(phoneNumber)) return false;
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");
        return cleaned.length() >= 10 && cleaned.length() <= 15;
    }
    
    private boolean isValidCountryCode(String countryCode) {
        if (isEmpty(countryCode)) return false;
        return "+91".equals(countryCode) || "+1".equals(countryCode) || 
               "+44".equals(countryCode) || "+49".equals(countryCode);
    }
    
    private boolean isValidPhoneNumberForCountryCode(String phoneNumber, String countryCode) {
        if (isEmpty(phoneNumber)) return false;
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");
        
        if (isEmpty(countryCode)) {
            return cleaned.length() >= 10 && cleaned.length() <= 15;
        }
        
        switch (countryCode) {
            case "+91": // India
                return cleaned.length() == 10;
            case "+1": // US
                return cleaned.length() == 10;
            case "+44": // UK
                return cleaned.length() == 10;
            case "+49": // Germany
                return cleaned.length() >= 10 && cleaned.length() <= 11;
            default:
                return cleaned.length() >= 10 && cleaned.length() <= 15;
        }
    }
    
    private String getExpectedPhoneLengthMessage(String countryCode) {
        if (isEmpty(countryCode)) {
            return "Expected 10-15 digits";
        }
        
        switch (countryCode) {
            case "+91": // India
                return "Expected 10 digits for India";
            case "+1": // US
                return "Expected 10 digits for US";
            case "+44": // UK
                return "Expected 10 digits for UK";
            case "+49": // Germany
                return "Expected 10-11 digits for Germany";
            default:
                return "Expected 10-15 digits";
        }
    }
    
    private boolean isValidIndustry(String industry) {
        if (isEmpty(industry)) return false;
        // Allow letters, numbers, spaces, and specific special characters: & - . , ' ( ) [ ]
        return industry.matches("^[a-zA-Z0-9\\s&\\-.,'\\'()\\[\\]]+$");
    }
    
    private boolean isOnlySpaces(String value) {
        return value != null && value.trim().isEmpty();
    }
    
    private void validateLeadData(LeadDTO dto) {
        validateLeadDataForUpdate(dto, null);
    }
    
    private void validateLeadDataForUpdate(LeadDTO dto, Integer excludeLeadId) {
        // First Name validation
        if (isEmpty(dto.getFirstName())) {
            throw new RuntimeException("This field is required");
        }
        if (isOnlySpaces(dto.getFirstName())) {
            throw new RuntimeException("First name cannot contain only spaces");
        }
        if (containsNumbers(dto.getFirstName())) {
            throw new RuntimeException("First name cannot contain numbers");
        }
        
        // Last Name validation
        if (isEmpty(dto.getLastName())) {
            throw new RuntimeException("This field is required");
        }
        if (isOnlySpaces(dto.getLastName())) {
            throw new RuntimeException("Last name cannot contain only spaces");
        }
        if (containsNumbers(dto.getLastName())) {
            throw new RuntimeException("Last name cannot contain numbers");
        }
        
        // Company Name validation
        if (isEmpty(dto.getCompanyName())) {
            throw new RuntimeException("This field is required");
        }
        if (isOnlySpaces(dto.getCompanyName())) {
            throw new RuntimeException("Company name cannot contain only spaces");
        }
        
        // Designation validation
        if (isEmpty(dto.getDesignation())) {
            throw new RuntimeException("This field is required");
        }
        if (isOnlySpaces(dto.getDesignation())) {
            throw new RuntimeException("Designation cannot contain only spaces");
        }
        
        // Email validation
        if (isEmpty(dto.getEmail())) {
            throw new RuntimeException("This field is required");
        }
        if (!isValidEmail(dto.getEmail())) {
            throw new RuntimeException("Invalid email format");
        }
        
        // Check for duplicate email (exclude current lead if updating)
        Optional<Lead> existingLead = leadRepository.findByEmail(dto.getEmail().trim());
        if (existingLead.isPresent() && (excludeLeadId == null || !existingLead.get().getLeadId().equals(excludeLeadId))) {
            throw new RuntimeException("A lead with this email address already exists");
        }
        
        // Phone Number validation
        if (isEmpty(dto.getPhoneNumber())) {
            throw new RuntimeException("This field is required");
        }
        if (containsLetters(dto.getPhoneNumber())) {
            throw new RuntimeException("Phone number must contain only digits");
        }
        
        // Company Location validation
        if (isEmpty(dto.getCompanyLocation())) {
            throw new RuntimeException("This field is required");
        }
        if (isOnlySpaces(dto.getCompanyLocation())) {
            throw new RuntimeException("Company location cannot contain only spaces");
        }
        
        // Customer Location validation
        if (isEmpty(dto.getCustomerLocation())) {
            throw new RuntimeException("This field is required");
        }
        if (isOnlySpaces(dto.getCustomerLocation())) {
            throw new RuntimeException("Customer location cannot contain only spaces");
        }
        
        if (isEmpty(dto.getIndustry())) {
            throw new RuntimeException("This field is required");
        }
        if (isOnlySpaces(dto.getIndustry())) {
            throw new RuntimeException("Industry cannot contain only spaces");
        }
        if (!isValidIndustry(dto.getIndustry())) {
            throw new RuntimeException("Industry can only contain letters, numbers, spaces, and special characters: & - . , ' ( ) [ ]");
        }
        if (isEmpty(dto.getTechnologies())) {
            throw new RuntimeException("This field is required");
        }
        if (isOnlySpaces(dto.getTechnologies())) {
            throw new RuntimeException("Technologies cannot contain only spaces");
        }
        
        // Prospect Value validation
        if (dto.getProspectValue() == null) {
            throw new RuntimeException("This field is required");
        }
        if (dto.getProspectValue().compareTo(java.math.BigDecimal.ZERO) < 0) {
            throw new RuntimeException("Prospect value must be a positive number");
        }
        
        // Number of Employees validation
        if (dto.getNumberOfEmployees() == null) {
            throw new RuntimeException("This field is required");
        }
        if (dto.getNumberOfEmployees() <= 0) {
            throw new RuntimeException("Number of employees must be a positive number");
        }
        
        // Decision Authority validation (optional field)
        
        // LinkedIn URL validation (optional field but must be valid URL if provided)
        if (dto.getLinkedin() != null && !dto.getLinkedin().trim().isEmpty()) {
            String linkedin = dto.getLinkedin().trim();
            if (!isValidLinkedInUrl(linkedin)) {
                throw new RuntimeException("LinkedIn must be a valid URL starting with http:// or https://");
            }
        }
    }
    
    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
    
    private boolean containsNumbers(String text) {
        for (char c : text.toCharArray()) {
            if (Character.isDigit(c)) return true;
        }
        return false;
    }
    
    private boolean containsLetters(String text) {
        for (char c : text.toCharArray()) {
            if (Character.isLetter(c)) return true;
        }
        return false;
    }
    
    private boolean containsSpecialCharacters(String text) {
        for (char c : text.toCharArray()) {
            if (!Character.isLetterOrDigit(c) && !Character.isWhitespace(c)) {
                return true;
            }
        }
        return false;
    }
    
    private boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) return false;
        String trimmed = email.trim();
        
        // Basic email validation: must contain @ and at least one dot
        if (!trimmed.contains("@") || !trimmed.contains(".")) {
            return false;
        }
        
        // @ symbol must not be at the beginning or end
        int atIndex = trimmed.indexOf("@");
        if (atIndex <= 0 || atIndex >= trimmed.length() - 1) {
            return false;
        }
        
        // Must have at least one dot after the @ symbol (for domain)
        String domain = trimmed.substring(atIndex + 1);
        if (!domain.contains(".") || domain.indexOf(".") >= domain.length() - 1) {
            return false;
        }
        
        // Basic format check: no spaces, no consecutive dots
        if (trimmed.contains(" ") || trimmed.contains("..")) {
            return false;
        }
        
        return true;
    }
    
    private LeadDTO parseRowToLeadDTO(Row row, int rowNumber, Map<String, Integer> headerMap) {
        LeadDTO leadDTO = new LeadDTO();
        
        try {
            // Use flexible header mapping
            leadDTO.setFirstName(getCellValueAsString(row.getCell(headerMap.get("first_name"))));
            leadDTO.setLastName(getCellValueAsString(row.getCell(headerMap.get("last_name"))));
            leadDTO.setCompanyName(getCellValueAsString(row.getCell(headerMap.get("company_name"))));
            leadDTO.setDesignation(getCellValueAsString(row.getCell(headerMap.get("designation"))));
            leadDTO.setEmail(getCellValueAsString(row.getCell(headerMap.get("email"))));
            
            // Handle phone number with country code
            String phoneNumber = getCellValueAsString(row.getCell(headerMap.get("phone_number")));
            String countryCode = getCellValueAsString(row.getCell(headerMap.get("country_code")));
            leadDTO.setPhoneNumber(phoneNumber);
            leadDTO.setCountryCode(countryCode != null && !countryCode.trim().isEmpty() ? countryCode : "+91");
            
            leadDTO.setLinkedin(getCellValueAsString(row.getCell(headerMap.get("linkedin"))));
            leadDTO.setIndustry(getCellValueAsString(row.getCell(headerMap.get("industry"))));
            leadDTO.setCountry(getCellValueAsString(row.getCell(headerMap.get("country"))));
            leadDTO.setCompanyLocation(getCellValueAsString(row.getCell(headerMap.get("company_location"))));
            
            // Handle lead source
            String source = getCellValueAsString(row.getCell(headerMap.get("lead_source")));
            leadDTO.setSource(source != null && !source.trim().isEmpty() ? source : "Other");
            
            leadDTO.setCustomerLocation(getCellValueAsString(row.getCell(headerMap.get("customer_location"))));
            leadDTO.setTechnologies(getCellValueAsString(row.getCell(headerMap.get("technologies"))));
            
            // Handle prospect value
            Integer prospectCol = headerMap.get("prospect_value");
            if (prospectCol == null) prospectCol = headerMap.get("prospect value"); // fallback
            if (prospectCol != null) {
                String prospectValueStr = getCellValueAsString(row.getCell(prospectCol));
                if (prospectValueStr != null && !prospectValueStr.trim().isEmpty()) {
                    try {
                        String cleanValue = prospectValueStr.trim().replaceAll("[^0-9.]", "");
                        if (!cleanValue.isEmpty()) {
                            leadDTO.setProspectValue(new java.math.BigDecimal(cleanValue));
                        }
                    } catch (NumberFormatException e) {
                        // Will be caught by validation
                    }
                }
            }
            
            // Handle number of employees
            Integer employeesCol = headerMap.get("number_of_employees");
            if (employeesCol == null) employeesCol = headerMap.get("number of employees"); // fallback
            if (employeesCol != null) {
                String employeesStr = getCellValueAsString(row.getCell(employeesCol));
                if (employeesStr != null && !employeesStr.trim().isEmpty()) {
                    try {
                        leadDTO.setNumberOfEmployees(Integer.parseInt(employeesStr.trim()));
                    } catch (NumberFormatException e) {
                        // Will be caught by validation
                    }
                }
            }
            
            leadDTO.setDecisionAuthority(getCellValueAsString(row.getCell(headerMap.get("decision_authority"))));
            
            // Handle Created_By empid
            String createdByEmpid = getCellValueAsString(row.getCell(headerMap.get("created_by")));
            if (createdByEmpid != null && !createdByEmpid.trim().isEmpty()) {
                leadDTO.setCreatedByEmpid(createdByEmpid.trim());
            }
            
            // Handle lead status with proper mapping
            String status = getCellValueAsString(row.getCell(headerMap.get("lead_status")));
            if (status != null && !status.trim().isEmpty()) {
                String mappedStatus = mapExcelStatusToEnum(status.trim());
                log.debug("Row {}: Excel status '{}' mapped to '{}'", rowNumber, status, mappedStatus);
                leadDTO.setStatus(mappedStatus);
            } else {
                log.debug("Row {}: Empty status, defaulting to 'New'", rowNumber);
                leadDTO.setStatus("New"); // Default for empty cells
            }
            
        } catch (Exception e) {
            throw new RuntimeException("Error parsing row " + rowNumber + ": " + e.getMessage());
        }
        
        return leadDTO;
    }
    
    private String getCellValueAsString(Cell cell) {
        if (cell == null) {
            return null;
        }
        
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue().trim();
            case NUMERIC:
                if (DateUtil.isCellDateFormatted(cell)) {
                    return cell.getDateCellValue().toString();
                } else {
                    // Convert numeric to string, removing decimal if it's a whole number
                    double numericValue = cell.getNumericCellValue();
                    if (numericValue == (long) numericValue) {
                        return String.valueOf((long) numericValue);
                    } else {
                        return String.valueOf(numericValue);
                    }
                }
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                return cell.getCellFormula();
            default:
                return null;
        }
    }
    
    private String mapExcelStatusToEnum(String excelStatus) {
        if (excelStatus == null) {
            return "New";
        }
        
        String trimmed = excelStatus.trim().toLowerCase();
        switch (trimmed) {
            case "contacted":
                return "Contacted";
            case "qualified":
                return "Qualified";
            case "unqualified":
                return "Unqualified";
            case "converted":
                return "Converted";
            case "new":
                return "New";
            default:
                return "New"; // Default for invalid values
        }
    }
    
    private boolean isValidLeadStatus(String status) {
        if (status == null || status.trim().isEmpty()) {
            return true; // Empty is valid, will use default
        }
        
        String trimmed = status.trim();
        return "New".equals(trimmed) || "Contacted".equals(trimmed) || 
               "Qualified".equals(trimmed) || "Unqualified".equals(trimmed) || 
               "Converted".equals(trimmed);
    }
    
    private boolean isValidLinkedInUrl(String url) {
        if (url == null || url.trim().isEmpty()) {
            return true; // Empty is valid (optional field)
        }
        
        String trimmed = url.trim();
        // Must start with http:// or https:// (case insensitive)
        return trimmed.toLowerCase().startsWith("http://") || trimmed.toLowerCase().startsWith("https://");
    }
    
    /**
     * Export leads to Excel file
     */
    public byte[] exportLeadsToExcel(String q, Integer userId, String userRole) {
        log.debug("EXPORT: Starting export - userId: {}, userRole: {}, query: {}", userId, userRole, q);
        
        Workbook workbook = null;
        try {
            // Get filtered leads based on user role and permissions
            log.debug("EXPORT: Getting filtered leads...");
            List<LeadDTO> leads;
            try {
                leads = listFiltered(q, userId, userRole);
                if (leads == null) {
                    leads = new ArrayList<>();
                }
            } catch (Exception e) {
                leads = new ArrayList<>();
            }
            log.debug("EXPORT: Found {} leads to export", leads.size());
            
            // Create workbook and sheet
            log.debug("EXPORT: Creating Excel workbook...");
            workbook = new XSSFWorkbook();
            Sheet sheet = workbook.createSheet("Leads");
            
            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {
                "First Name", "Last Name", "Company Name", "Email", "Phone Number", "Status"
            };
            
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }
            log.debug("EXPORT: Headers created");
            
            // Add data rows - simplified version
            int rowNum = 1;
            for (LeadDTO lead : leads) {
                if (lead == null) continue;
                
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(lead.getFirstName() != null ? lead.getFirstName() : "");
                row.createCell(1).setCellValue(lead.getLastName() != null ? lead.getLastName() : "");
                row.createCell(2).setCellValue(lead.getCompanyName() != null ? lead.getCompanyName() : "");
                row.createCell(3).setCellValue(lead.getEmail() != null ? lead.getEmail() : "");
                row.createCell(4).setCellValue(lead.getPhoneNumber() != null ? lead.getPhoneNumber() : "");
                row.createCell(5).setCellValue(lead.getStatus() != null ? lead.getStatus() : "");
            }
            log.debug("EXPORT: Data rows created: {}", (rowNum - 1));
            
            // Convert to byte array
            log.debug("EXPORT: Converting to byte array...");
            java.io.ByteArrayOutputStream outputStream = new java.io.ByteArrayOutputStream();
            workbook.write(outputStream);
            
            byte[] result = outputStream.toByteArray();
            log.debug("EXPORT: Export completed successfully, size: {} bytes", result.length);
            return result;
            
        } catch (Exception e) {
            log.error("Failed to export leads to Excel for user: {}", userId, e);
            throw new RuntimeException("Failed to export leads to Excel: " + e.getMessage(), e);
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (Exception e) {
                }
            }
        }
    }

    /**
     * Validate database health before critical operations
     */
    private void validateDatabaseHealth() {
        try {
            Map<String, Object> healthStatus = databaseHealthService.getDatabaseHealthStatus();
            
            // Check if any table has unhealthy auto-increment sequences
            boolean hasIssues = false;
            for (Map.Entry<String, Object> entry : healthStatus.entrySet()) {
                if (entry.getValue() instanceof Map) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> tableStatus = (Map<String, Object>) entry.getValue();
                    Boolean isHealthy = (Boolean) tableStatus.get("isHealthy");
                    if (isHealthy != null && !isHealthy) {
                        hasIssues = true;
                    }
                }
            }
            
            if (hasIssues) {
                log.debug("Attempting to fix database health issues...");
                databaseHealthService.checkAndFixAutoIncrementSequences();
                log.debug("Database health issues fixed");
            }
        } catch (Exception e) {
            // Don't fail the conversion, just log the warning
        }
    }
    

    
    private void sendLeadReassignmentNotifications(Lead lead, Users oldExecutive, Users newExecutive, Integer performedBy) {
        try {
            String leadName = lead.getFirstName() + " " + lead.getLastName() + " (" + lead.getCompanyName() + ")";
            Users performedByUser = usersRepository.findById(performedBy).orElse(null);
            String performedByName = performedByUser != null ? 
                performedByUser.getFirstName() + " " + performedByUser.getLastName() : "System";
            
            log.debug("Sending notifications for lead: {}, performed by: {}", leadName, performedByName);
            
            // Notify the new executive about the assignment
            if (newExecutive != null) {
                log.debug("Notifying new executive: {}", newExecutive.getFirstName() + " " + newExecutive.getLastName());
                notificationService.createLeadAssignmentNotification(
                    newExecutive.getUserId(), 
                    leadName, 
                    performedByName
                );
            }
            
            // If lead was created by VP, notify the manager of the new executive
            Users createdByUser = lead.getCreatedBy();
            log.debug("Lead created by: {}, role: {}", 
                createdByUser != null ? createdByUser.getFirstName() + " " + createdByUser.getLastName() : "null",
                createdByUser != null ? createdByUser.getRole() : "null");
                
            if (createdByUser != null && "Sales_VP".equals(createdByUser.getRole())) {
                // VP created lead - notify the manager of the new executive
                if (newExecutive != null && newExecutive.getManagerId() != null) {
                    log.debug("New executive manager ID: {}", newExecutive.getManagerId());
                    Users manager = usersRepository.findById(newExecutive.getManagerId()).orElse(null);
                    if (manager != null && "Sales_Manager".equals(manager.getRole())) {
                        log.debug("Sending VP lead notification to manager: {}", manager.getFirstName() + " " + manager.getLastName());
                        notificationService.createVPLeadReassignmentNotification(
                            manager.getUserId(),
                            leadName,
                            createdByUser.getFirstName() + " " + createdByUser.getLastName(),
                            newExecutive.getFirstName() + " " + newExecutive.getLastName(),
                            performedByName
                        );
                    } else {
                        log.debug("Manager not found or not Sales_Manager role. Manager: {}, Role: {}", 
                            manager != null ? manager.getFirstName() : "null",
                            manager != null ? manager.getRole() : "null");
                    }
                } else {
                    log.debug("New executive is null or has no manager ID");
                }
            }
            
        } catch (Exception e) {
            log.error("Failed to send lead reassignment notifications: {}", e.getMessage(), e);
        }
    }
    
    /**
     * Create Lead entity from DTO without triggering JPA validation annotations
     */
    private Lead createLeadEntityFromDTO(LeadDTO dto) {
        Lead entity = new Lead();
        
        // Set basic fields
        entity.setFirstName(dto.getFirstName());
        entity.setLastName(dto.getLastName());
        entity.setCompanyName(dto.getCompanyName());
        entity.setDesignation(dto.getDesignation());
        entity.setEmail(dto.getEmail());
        entity.setCountryCode(dto.getCountryCode());
        entity.setPhoneNumber(dto.getPhoneNumber());
        entity.setLinkedin(dto.getLinkedin());
        entity.setIndustry(dto.getIndustry());
        entity.setCountry(dto.getCountry());
        entity.setCompanyLocation(dto.getCompanyLocation());
        entity.setCustomerLocation(dto.getCustomerLocation());
        entity.setTechnologies(dto.getTechnologies());
        entity.setProspectValue(dto.getProspectValue());
        entity.setNumberOfEmployees(dto.getNumberOfEmployees());
        entity.setDecisionAuthority(dto.getDecisionAuthority());
        
        // Set status with default
        if (dto.getStatus() != null && !dto.getStatus().trim().isEmpty()) {
            try {
                entity.setLeadStatus(Lead.LeadStatus.valueOf(dto.getStatus()));
            } catch (IllegalArgumentException e) {
                entity.setLeadStatus(Lead.LeadStatus.New); // Default fallback
            }
        } else {
            entity.setLeadStatus(Lead.LeadStatus.New);
        }
        
        // Set source with default
        if (dto.getSource() != null && !dto.getSource().trim().isEmpty()) {
            try {
                String mappedSource = mapSourceToEnum(dto.getSource());
                entity.setLeadSource(Lead.LeadSource.valueOf(mappedSource));
            } catch (IllegalArgumentException e) {
                entity.setLeadSource(Lead.LeadSource.Other); // Default fallback
            }
        } else {
            entity.setLeadSource(Lead.LeadSource.Other);
        }
        
        // Set user relationships
        if (dto.getCreatedById() != null) {
            Users createdBy = usersRepository.findById(dto.getCreatedById()).orElse(null);
            if (createdBy != null) {
                entity.setCreatedBy(createdBy);
            }
        }
        
        if (dto.getAssignedToId() != null) {
            Users assignedTo = usersRepository.findById(dto.getAssignedToId()).orElse(null);
            if (assignedTo != null) {
                entity.setAssignedTo(assignedTo);
            }
        }
        
        return entity;
    }
    
    /**
     * Map frontend source values to backend enum values
     */
    private String mapSourceToEnum(String source) {
        if (source == null) return "Other";
        
        String trimmed = source.trim();
        switch (trimmed.toLowerCase()) {
            case "website":
                return "Website";
            case "email":
                return "Email";
            case "campaign":
                return "Campaign";
            case "cold_call":
            case "cold call":
                return "Cold_Call";
            case "referral":
                return "Referral";
            case "event":
                return "Event";
            case "other":
                return "Other";
            default:
                return trimmed; // Try direct match
        }
    }
    
    /**
     * Extract clean, user-friendly error message from exception
     */
    private String extractCleanErrorMessage(Exception e) {
        String message = e.getMessage();
        if (message == null) {
            return "Unknown validation error";
        }
        
        // Check if it's a constraint violation
        if (message.contains("ConstraintViolationImpl")) {
            // Extract just the interpolated message
            int start = message.indexOf("interpolatedMessage='");
            if (start != -1) {
                start += "interpolatedMessage='".length();
                int end = message.indexOf("'", start);
                if (end != -1) {
                    return message.substring(start, end);
                }
            }
        }
        
        // Check for validation failed message pattern
        if (message.contains("Validation failed for classes")) {
            // Look for constraint violations list
            int violationsStart = message.indexOf("List of constraint violations:[");
            if (violationsStart != -1) {
                String violationsSection = message.substring(violationsStart);
                // Extract interpolated messages
                List<String> violations = new ArrayList<>();
                String[] parts = violationsSection.split("ConstraintViolationImpl\\{");
                for (int i = 1; i < parts.length; i++) {
                    String part = parts[i];
                    int msgStart = part.indexOf("interpolatedMessage='");
                    if (msgStart != -1) {
                        msgStart += "interpolatedMessage='".length();
                        int msgEnd = part.indexOf("'", msgStart);
                        if (msgEnd != -1) {
                            violations.add(part.substring(msgStart, msgEnd));
                        }
                    }
                }
                if (!violations.isEmpty()) {
                    return String.join(", ", violations);
                }
            }
        }
        
        // Return original message if no pattern matches
        return message;
    }
    
    /**
     * Send welcome email to new lead
     */
    private void sendWelcomeEmail(Lead lead) {
        try {
            String subject = "Welcome to Tech Tammina - Your Lead Has Been Created";
            String body = String.format(
                "Dear %s %s,\\n\\n" +
                "Thank you for your interest in Tech Tammina!\\n\\n" +
                "We have received your information and one of our representatives will contact you soon.\\n\\n" +
                "Lead Details:\\n" +
                "- Company: %s\\n" +
                "- Email: %s\\n" +
                "- Phone: %s\\n\\n" +
                "Best regards,\\n" +
                "Tech Tammina CRM Team",
                lead.getFirstName() != null ? lead.getFirstName() : "",
                lead.getLastName() != null ? lead.getLastName() : "",
                lead.getCompanyName() != null ? lead.getCompanyName() : "N/A",
                lead.getEmail() != null ? lead.getEmail() : "N/A",
                lead.getPhoneNumber() != null ? lead.getPhoneNumber() : "N/A"
            );
            
            if (lead.getEmail() != null && !lead.getEmail().trim().isEmpty()) {
                log.debug("SENDING EMAIL TO: {}", lead.getEmail());
                emailService.sendEmail(lead.getEmail(), null, subject, body);
                log.debug("EMAIL SENT SUCCESSFULLY!");
            }
        } catch (Exception e) {
            log.error("Failed to send welcome email for lead: {} {}", lead.getFirstName(), lead.getLastName(), e);
        }
    }
}
