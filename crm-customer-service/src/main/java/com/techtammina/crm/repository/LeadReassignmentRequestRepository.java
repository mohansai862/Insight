package com.techtammina.crm.repository;

import com.techtammina.crm.entity.LeadReassignmentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface LeadReassignmentRequestRepository extends JpaRepository<LeadReassignmentRequest, Integer> {
    
    @Query("SELECT r FROM LeadReassignmentRequest r WHERE r.status = 'PENDING' AND r.requestedBy.managerId = :managerId")
    List<LeadReassignmentRequest> findPendingRequestsByManager(@Param("managerId") Integer managerId);
    
    @Query("SELECT r FROM LeadReassignmentRequest r WHERE r.status = 'APPROVED' AND r.requestedBy.managerId = :managerId")
    List<LeadReassignmentRequest> findApprovedRequestsByManager(@Param("managerId") Integer managerId);
    
    @Query("SELECT r FROM LeadReassignmentRequest r WHERE r.status = 'PENDING' AND r.requestedBy.userId = :executiveId")
    List<LeadReassignmentRequest> findPendingRequestsByExecutive(@Param("executiveId") Integer executiveId);
    
    @Query("SELECT r FROM LeadReassignmentRequest r WHERE r.status = 'PENDING'")
    List<LeadReassignmentRequest> findAllPendingForDebug();
    
    @Query("SELECT r FROM LeadReassignmentRequest r WHERE r.lead.leadId = :leadId AND r.status = 'PENDING'")
    List<LeadReassignmentRequest> findActiveRequestsByLeadId(@Param("leadId") Integer leadId);
    
    @Query("SELECT r FROM LeadReassignmentRequest r WHERE r.lead.leadId = :leadId AND r.status = 'APPROVED'")
    List<LeadReassignmentRequest> findApprovedRequestsByLeadId(@Param("leadId") Integer leadId);

    boolean existsByLead_LeadId(Integer leadId);
}

