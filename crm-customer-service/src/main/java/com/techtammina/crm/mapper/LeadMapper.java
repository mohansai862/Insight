package com.techtammina.crm.mapper;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.LeadDTO;
import com.techtammina.crm.entity.Lead;

@Slf4j
public class LeadMapper {
    private static final Logger log = LoggerFactory.getLogger(LeadMapper.class);
    public static LeadDTO toDTO(Lead e) {
        LeadDTO d = new LeadDTO();
        d.setId(e.getLeadId());
        d.setLeadId(e.getLeadId()); // Ensure leadId is also set
        d.setFirstName(e.getFirstName());
        d.setLastName(e.getLastName());
        d.setCompanyName(e.getCompanyName());
        d.setDesignation(e.getDesignation());
        d.setEmail(e.getEmail());
        d.setCountryCode(e.getCountryCode());
        d.setPhoneNumber(e.getPhoneNumber());
        d.setLinkedin(e.getLinkedin());
        log.debug("🔍 MAPPER toDTO - LinkedIn: {}", e.getLinkedin());
        d.setIndustry(e.getIndustry());
        d.setCountry(e.getCountry());
        d.setCompanyLocation(e.getCompanyLocation());
        d.setStatus(e.getLeadStatus() == null ? null : e.getLeadStatus().name());
        // Convert enum name to frontend dropdown format
        if (e.getLeadSource() != null) {
            switch (e.getLeadSource()) {
                case Website: d.setSource("website"); break;
                case Email: d.setSource("email"); break;
                case Campaign: d.setSource("campaign"); break;
                case Cold_Call: d.setSource("cold_call"); break;
                case Referral: d.setSource("referral"); break;
                case Event: d.setSource("event"); break;
                case Other: d.setSource("other"); break;
                default: d.setSource("other"); break;
            }
        }
        // legacy: ownerId kept for compatibility (creator id)
        d.setOwnerId(e.getCreatedBy() != null ? e.getCreatedBy().getUserId() : null);
        // explicit creator
        d.setCreatedById(e.getCreatedBy() != null ? e.getCreatedBy().getUserId() : null);
        d.setAssignedToId(e.getAssignedTo() != null ? e.getAssignedTo().getUserId() : null);
        d.setCreatedAt(e.getCreatedAt());
        d.setUpdatedAt(e.getUpdatedAt());
        d.setConvertedAccountId(e.getConvertedAccountId());
        d.setConvertedContactId(e.getConvertedContactId());
        d.setConvertedDealId(e.getConvertedDealId());
        d.setCustomerLocation(e.getCustomerLocation());
        d.setTechnologies(e.getTechnologies());
        d.setProspectValue(e.getProspectValue());
        d.setNumberOfEmployees(e.getNumberOfEmployees());
        d.setDecisionAuthority(e.getDecisionAuthority());
        d.setReassignmentPending(e.getReassignmentPending());
        
        log.debug("🔍 MAPPER toDTO - reassignmentPending: {} -> {}", e.getReassignmentPending(), d.getReassignmentPending());
        log.debug("🔍 MAPPER toDTO - Special fields mapping for lead ID {}:", e.getLeadId());
        log.debug("   Entity customerLocation: '{}' -> DTO: '{}'", e.getCustomerLocation(), d.getCustomerLocation());
        log.debug("   Entity prospectValue: {} -> DTO: {}", e.getProspectValue(), d.getProspectValue());
        log.debug("   Entity decisionAuthority: '{}' -> DTO: '{}'", e.getDecisionAuthority(), d.getDecisionAuthority());
        d.setAssignedTo(e.getAssignedTo() != null ? e.getAssignedTo().getUsername() : null);
        
        // Owner logic: 
        // - If created_by is Sales_VP or Sales_Manager: always show created_by as owner
        // - If created_by is Sales_Executive: show assignTo if exists, otherwise show created_by
        String ownerName = null;
        if (e.getCreatedBy() != null) {
            String createdByRole = e.getCreatedBy().getRole();
            if ("Sales_VP".equals(createdByRole) || "Sales_Manager".equals(createdByRole)) {
                // VP/Manager created leads: always show created_by as owner
                ownerName = e.getCreatedBy().getUsername();
            } else if ("Sales_Executive".equals(createdByRole)) {
                // Executive created leads: show assignTo if exists, otherwise show created_by
                if (e.getAssignedTo() != null) {
                    ownerName = e.getAssignedTo().getUsername();
                } else {
                    ownerName = e.getCreatedBy().getUsername();
                }
            } else {
                // Fallback for other roles: show created_by
                ownerName = e.getCreatedBy().getUsername();
            }
        }
        d.setOwner(ownerName);
        d.setCreatedByName(e.getCreatedBy() != null ? e.getCreatedBy().getUsername() : null);
        d.setCreatedByEmpid(e.getCreatedBy() != null ? e.getCreatedBy().getEmpid() : null);
        // Set name field for frontend compatibility
        String firstName = e.getFirstName() != null ? e.getFirstName() : "";
        String lastName = e.getLastName() != null ? e.getLastName() : "";
        d.setName((firstName + " " + lastName).trim());
        return d;
    }

    public static Lead toEntity(LeadDTO d) {
        Lead e = new Lead();
        e.setLeadId(d.getId());
        e.setFirstName(d.getFirstName());
        e.setLastName(d.getLastName());
        e.setCompanyName(d.getCompanyName());
        e.setDesignation(d.getDesignation());
        e.setEmail(d.getEmail());
        e.setCountryCode(d.getCountryCode());
        e.setPhoneNumber(d.getPhoneNumber());
        e.setLinkedin(d.getLinkedin());
        log.debug("🔍 MAPPER toEntity - LinkedIn: {}", d.getLinkedin());
        e.setIndustry(d.getIndustry());
        e.setCountry(d.getCountry());
        e.setCompanyLocation(d.getCompanyLocation());
        if (d.getStatus() != null) e.setLeadStatus(Lead.LeadStatus.valueOf(d.getStatus()));
        log.debug("🔍 MAPPER toEntity - Received source: '{}'", d.getSource());
        if (d.getSource() != null && !d.getSource().trim().isEmpty()) {
            String sourceValue = d.getSource().trim();
            log.debug("🔍 MAPPER DEBUG - Processing source: '{}'", sourceValue);
            
            // Map frontend source values to backend enum values
            Lead.LeadSource mappedSource = null;
            switch (sourceValue.toLowerCase()) {
                case "website":
                    mappedSource = Lead.LeadSource.Website;
                    break;
                case "email":
                    mappedSource = Lead.LeadSource.Email;
                    break;
                case "campaign":
                    mappedSource = Lead.LeadSource.Campaign;
                    break;
                case "cold_call":
                case "cold call":
                    mappedSource = Lead.LeadSource.Cold_Call;
                    break;
                case "referral":
                    mappedSource = Lead.LeadSource.Referral;
                    break;
                case "event":
                    mappedSource = Lead.LeadSource.Event;
                    break;
                case "other":
                    mappedSource = Lead.LeadSource.Other;
                    break;
                default:
                    // Try direct enum match as fallback
                    try {
                        mappedSource = Lead.LeadSource.valueOf(sourceValue);
                    } catch (IllegalArgumentException ex) {
                        log.debug("⚠️ MAPPER toEntity - Invalid source: {}, using Other", sourceValue);
                        mappedSource = Lead.LeadSource.Other;
                    }
            }
            
            e.setLeadSource(mappedSource);
            log.debug("✅ MAPPER toEntity - Source mapped: {} -> {}", d.getSource(), mappedSource);
        } else {
            log.debug("⚠️ MAPPER toEntity - Empty/null source, will use default in @PrePersist");
            // Let @PrePersist handle the default
        }
        e.setConvertedAccountId(d.getConvertedAccountId());
        e.setConvertedContactId(d.getConvertedContactId());
        e.setConvertedDealId(d.getConvertedDealId());
        e.setCustomerLocation(d.getCustomerLocation());
        e.setTechnologies(d.getTechnologies());
        e.setProspectValue(d.getProspectValue());
        e.setNumberOfEmployees(d.getNumberOfEmployees());
        e.setDecisionAuthority(d.getDecisionAuthority());
        e.setReassignmentPending(d.getReassignmentPending());
        
        log.debug("🔍 MAPPER toEntity - Special fields mapping:");
        log.debug("   DTO -> Entity customerLocation: {} -> {}", d.getCustomerLocation(), e.getCustomerLocation());
        log.debug("   DTO -> Entity prospectValue: {} -> {}", d.getProspectValue(), e.getProspectValue());
        log.debug("   DTO -> Entity decisionAuthority: {} -> {}", d.getDecisionAuthority(), e.getDecisionAuthority());
        // createdBy and assignedTo set in service after loading Users
        return e;
    }
}