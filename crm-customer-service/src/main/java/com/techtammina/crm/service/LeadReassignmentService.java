package com.techtammina.crm.service;

import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.LeadReassignmentRequest;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.LeadReassignmentRequestRepository;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class LeadReassignmentService {
    
    private final LeadReassignmentRequestRepository reassignmentRepository;
    private final LeadRepository leadRepository;
    private final UsersRepository usersRepository;
    
    @PersistenceContext
    private EntityManager entityManager;
    
    public LeadReassignmentService(LeadReassignmentRequestRepository reassignmentRepository,
                                   LeadRepository leadRepository,
                                   UsersRepository usersRepository) {
        this.reassignmentRepository = reassignmentRepository;
        this.leadRepository = leadRepository;
        this.usersRepository = usersRepository;
    }
    
    public LeadReassignmentRequest requestReassignment(Integer leadId, Integer executiveId, String reason) {
        Lead lead = leadRepository.findById(leadId)
                .orElseThrow(() -> new RuntimeException("Lead not found"));
        Users executive = usersRepository.findById(executiveId)
                .orElseThrow(() -> new RuntimeException("Executive not found"));
        
        // Clear any existing PENDING requests for this lead to avoid confusion
        List<LeadReassignmentRequest> existingPendingRequests = reassignmentRepository.findActiveRequestsByLeadId(leadId);
        for (LeadReassignmentRequest existingRequest : existingPendingRequests) {
            existingRequest.setStatus(LeadReassignmentRequest.Status.REJECTED);
            reassignmentRepository.save(existingRequest);
        }
        
        // Mark lead as having pending reassignment
        lead.setReassignmentPending(true);
        leadRepository.save(lead);
        
        // Determine manager who should approve
        Integer managerId = lead.getCreatedBy() != null && 
            ("Sales_Manager".equals(lead.getCreatedBy().getRole()) || "Sales_VP".equals(lead.getCreatedBy().getRole()))
            ? lead.getCreatedBy().getUserId() : executive.getManagerId();
        
        Users manager = managerId != null ? usersRepository.findById(managerId).orElse(null) : null;
        
        LeadReassignmentRequest request = new LeadReassignmentRequest();
        request.setLead(lead);
        request.setRequestedBy(executive);
        request.setRequestedTo(manager);
        request.setReason(reason);
        request.setStatus(LeadReassignmentRequest.Status.PENDING);
        
        return reassignmentRepository.save(request);
    }
    
    public LeadReassignmentRequest getRequestById(Integer requestId) {
        return reassignmentRepository.findById(requestId).orElse(null);
    }
    
    @Transactional
    public void approveReassignment(Integer requestId, Integer newExecutiveId, Integer managerId) {
        LeadReassignmentRequest request = reassignmentRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Reassignment request not found"));
        
        Users newExecutive = usersRepository.findById(newExecutiveId)
                .orElseThrow(() -> new RuntimeException("New executive not found"));
        
        Lead lead = request.getLead();
        Users oldExecutive = lead.getAssignedTo();
        
        // Update lead assignment and clear pending status
        lead.setAssignedTo(newExecutive);
        lead.setReassignmentPending(false);
        leadRepository.save(lead);
        
        // Transfer all related entities if there was a previous owner
        if (oldExecutive != null) {
            transferAllRelatedEntities(lead, oldExecutive.getUserId(), newExecutiveId);
        }
        
        // Update request status
        request.setStatus(LeadReassignmentRequest.Status.APPROVED);
        request.setApprovedDate(LocalDateTime.now());
        reassignmentRepository.save(request);
    }
    
    public List<LeadReassignmentRequest> getPendingRequestsForManager(Integer managerId) {
        return reassignmentRepository.findPendingRequestsByManager(managerId);
    }
    
    public List<LeadReassignmentRequest> getPendingRequestsByExecutive(Integer executiveId) {
        return reassignmentRepository.findPendingRequestsByExecutive(executiveId);
    }
    
    public List<LeadReassignmentRequest> getAllPendingRequests() {
        return reassignmentRepository.findAllPendingForDebug();
    }
    
    public LeadReassignmentRequest approveReassignmentRequest(Integer requestId, Integer managerId) {
        LeadReassignmentRequest request = reassignmentRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Reassignment request not found"));
        
        if (request.getStatus() != LeadReassignmentRequest.Status.PENDING) {
            throw new RuntimeException("Request is not pending");
        }
        
        // Do NOT change ownership on approval.
        // Keep reassignmentPending=true until manager assigns to new executive.
        Lead lead = request.getLead();
        leadRepository.save(lead);
        
        // Mark the request as approved so it appears in manager's assignment module
        request.setStatus(LeadReassignmentRequest.Status.APPROVED);
        request.setApprovedDate(LocalDateTime.now());
        
        return reassignmentRepository.save(request);
    }
    
    public LeadReassignmentRequest rejectReassignmentRequest(Integer requestId, Integer managerId) {
        LeadReassignmentRequest request = reassignmentRepository.findById(requestId)
            .orElseThrow(() -> new RuntimeException("Reassignment request not found"));
        
        if (request.getStatus() != LeadReassignmentRequest.Status.PENDING) {
            throw new RuntimeException("Request is not pending");
        }
        
        // Clear pending status when rejected
        Lead lead = request.getLead();
        lead.setReassignmentPending(false);
        leadRepository.save(lead);
        
        request.setStatus(LeadReassignmentRequest.Status.REJECTED);
        request.setApprovedDate(LocalDateTime.now());
        
        return reassignmentRepository.save(request);
    }
    
    @Transactional
    public void transferAllRelatedEntities(Lead lead, Integer fromUserId, Integer toUserId) {
        // Transfer contacts linked to this lead - only assignment, not ownership
        if (lead.getConvertedContactId() != null) {
            entityManager.createNativeQuery("UPDATE contacts SET reassign_to = ?1 WHERE contact_id = ?2")
                .setParameter(1, toUserId)
                .setParameter(2, lead.getConvertedContactId())
                .executeUpdate();
        }
        
        // Transfer accounts linked to this lead - only assignment, not ownership
        if (lead.getConvertedAccountId() != null) {
            entityManager.createNativeQuery("UPDATE accounts SET reassign_to = ?1 WHERE account_id = ?2")
                .setParameter(1, toUserId)
                .setParameter(2, lead.getConvertedAccountId())
                .executeUpdate();
        }
        
        // Transfer deals linked to this lead - only assignment, not ownership
        if (lead.getConvertedDealId() != null) {
            entityManager.createNativeQuery("UPDATE deals SET reassign_to = ?1 WHERE deal_id = ?2")
                .setParameter(1, toUserId)
                .setParameter(2, lead.getConvertedDealId())
                .executeUpdate();
        }
        
        // Transfer all communication records for lead and related entities
        transferLeadCommunications(lead.getLeadId(), fromUserId, toUserId);
        
        // Transfer communications for converted account
        if (lead.getConvertedAccountId() != null) {
            transferEntityCommunications("Account", lead.getConvertedAccountId(), fromUserId, toUserId);
        }
        
        // Transfer communications for converted contact
        if (lead.getConvertedContactId() != null) {
            transferEntityCommunications("Contact", lead.getConvertedContactId(), fromUserId, toUserId);
        }
        
        // Transfer communications for converted deal
        if (lead.getConvertedDealId() != null) {
            transferEntityCommunications("Deal", lead.getConvertedDealId(), fromUserId, toUserId);
        }
    }
    
    @Transactional
    public void transferLeadCommunications(Integer leadId, Integer fromUserId, Integer toUserId) {
        try {
            entityManager.createNativeQuery("UPDATE emails SET created_by = ?1 WHERE created_by = ?2 AND related_entity_type = 'Lead' AND related_entity_id = ?3")
                .setParameter(1, toUserId).setParameter(2, fromUserId).setParameter(3, leadId).executeUpdate();
            
            entityManager.createNativeQuery("UPDATE notes SET created_by = ?1 WHERE created_by = ?2 AND related_entity_type = 'Lead' AND related_entity_id = ?3")
                .setParameter(1, toUserId).setParameter(2, fromUserId).setParameter(3, leadId).executeUpdate();
            
            entityManager.createNativeQuery("UPDATE tasks SET assigned_to = ?1 WHERE assigned_to = ?2 AND related_entity_type = 'Lead' AND related_entity_id = ?3")
                .setParameter(1, toUserId).setParameter(2, fromUserId).setParameter(3, leadId).executeUpdate();
        } catch (Exception e) {}
    }
    
    @Transactional
    public void clearReassignmentPending(Integer leadId) {
        Lead lead = leadRepository.findById(leadId).orElse(null);
        if (lead != null && Boolean.TRUE.equals(lead.getReassignmentPending())) {
            lead.setReassignmentPending(false);
            leadRepository.save(lead);
        }
    }
    
    @Transactional
    public void transferEntityCommunications(String entityType, Integer entityId, Integer fromUserId, Integer toUserId) {
        try {
            entityManager.createNativeQuery("UPDATE emails SET created_by = ?1 WHERE created_by = ?2 AND related_entity_type = ?3 AND related_entity_id = ?4")
                .setParameter(1, toUserId).setParameter(2, fromUserId).setParameter(3, entityType).setParameter(4, entityId).executeUpdate();
            
            entityManager.createNativeQuery("UPDATE notes SET created_by = ?1 WHERE created_by = ?2 AND related_entity_type = ?3 AND related_entity_id = ?4")
                .setParameter(1, toUserId).setParameter(2, fromUserId).setParameter(3, entityType).setParameter(4, entityId).executeUpdate();
            
            entityManager.createNativeQuery("UPDATE tasks SET assigned_to = ?1 WHERE assigned_to = ?2 AND related_entity_type = ?3 AND related_entity_id = ?4")
                .setParameter(1, toUserId).setParameter(2, fromUserId).setParameter(3, entityType).setParameter(4, entityId).executeUpdate();
        } catch (Exception e) {}
    }
}

