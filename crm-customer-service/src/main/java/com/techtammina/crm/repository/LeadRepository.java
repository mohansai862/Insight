package com.techtammina.crm.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.techtammina.crm.entity.Lead;

public interface LeadRepository extends JpaRepository<Lead, Integer> {
    @Query("""
       SELECT l FROM Lead l
       WHERE (:q IS NULL
          OR LOWER(l.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
          OR LOWER(l.lastName)  LIKE LOWER(CONCAT('%',:q,'%'))
          OR LOWER(l.companyName)   LIKE LOWER(CONCAT('%',:q,'%'))
          OR LOWER(l.email)     LIKE LOWER(CONCAT('%',:q,'%')))

    """)
    List<Lead> search(@Param("q") String q);

    List<Lead> findByCompanyNameInIgnoreCase(List<String> companyNames);
    
    Optional<Lead> findByEmail(String email);

    // New: unified search with RBAC-friendly filters
    @Query("""
       SELECT l FROM Lead l
       WHERE (:q IS NULL
          OR LOWER(l.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
          OR LOWER(l.lastName)  LIKE LOWER(CONCAT('%',:q,'%'))
          OR LOWER(l.companyName)   LIKE LOWER(CONCAT('%',:q,'%'))
          OR LOWER(l.email)     LIKE LOWER(CONCAT('%',:q,'%')))

       AND (:createdById IS NULL OR l.createdBy IS NOT NULL AND l.createdBy.userId = :createdById)
       AND (:assignedToId IS NULL OR l.assignedTo IS NOT NULL AND l.assignedTo.userId = :assignedToId)

    """)
    List<Lead> searchWithFilters(@Param("q") String q,
                                 @Param("createdById") Integer createdById,
                                 @Param("assignedToId") Integer assignedToId);

    // For Contacts module View Leads: filter by user associations (createdBy)
    @Query("""
       SELECT l FROM Lead l
       WHERE (:q IS NULL
          OR LOWER(l.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
          OR LOWER(l.lastName)  LIKE LOWER(CONCAT('%',:q,'%'))
          OR LOWER(l.companyName)   LIKE LOWER(CONCAT('%',:q,'%'))
          OR LOWER(l.email)     LIKE LOWER(CONCAT('%',:q,'%')))

       AND (:userId IS NULL OR l.createdBy IS NOT NULL AND l.createdBy.userId = :userId)

    """)
    List<Lead> findByUserAssociations(@Param("q") String q, @Param("userId") Integer userId);

    // Convenience methods (not used by service after adding searchWithFilters, but useful)
    List<Lead> findByCreatedBy_UserId(Integer userId);

    // Count leads assigned to a user
    long countByAssignedTo_UserId(Integer userId);

    // Count leads for executive (assigned_to OR unassigned created_by)
    @Query("SELECT COUNT(l) FROM Lead l WHERE l.assignedTo.userId = :executiveId OR (l.assignedTo IS NULL AND l.createdBy.userId = :executiveId)")
    long countLeadsForExecutive(@Param("executiveId") Integer executiveId);

    @Query("""
       SELECT l FROM Lead l
       WHERE (l.assignedTo.userId = :executiveId 
              OR (l.assignedTo IS NULL AND l.createdBy.userId = :executiveId))
       AND (:q IS NULL
         OR LOWER(l.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.lastName)  LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.companyName)   LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.email)     LIKE LOWER(CONCAT('%',:q,'%')))

    """)
    List<Lead> findLeadsForExecutive(@Param("q") String q, @Param("executiveId") Integer executiveId);

    @Query("""
       SELECT l FROM Lead l
       WHERE (l.assignedTo.userId IN :executiveIds 
              OR (l.assignedTo IS NULL AND l.createdBy.userId IN :executiveIds))
       AND (:q IS NULL
         OR LOWER(l.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.lastName)  LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.companyName)   LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.email)     LIKE LOWER(CONCAT('%',:q,'%')))

    """)
    List<Lead> findLeadsForExecutives(@Param("q") String q, @Param("executiveIds") List<Integer> executiveIds);
    
    // Find leads that are not converted (for reminder emails)
    List<Lead> findByLeadStatusNot(Lead.LeadStatus status);
    
    // Find leads by converted deal ID
    List<Lead> findByConvertedDealId(Integer dealId);
    // Count leads by executive (prioritize assigned_to over created_by)
    @Query("SELECT COUNT(l) FROM Lead l WHERE l.assignedTo.userId = :executiveId OR (l.assignedTo IS NULL AND l.createdBy.userId = :executiveId)")
    long countByExecutiveId(@Param("executiveId") Integer executiveId);

    // For Lead Assignment module
    List<Lead> findByAssignedToIsNull();
    List<Lead> findByAssignedTo_UserId(Integer userId);
    
    // Find unassigned leads created by executives under a manager
    @Query("SELECT l FROM Lead l WHERE l.assignedTo IS NULL AND l.createdBy.userId IN :executiveIds")
    List<Lead> findUnassignedLeadsForManager(@Param("executiveIds") List<Integer> executiveIds);
    
    // Find unassigned leads created by executives under a specific manager
    @Query("SELECT l FROM Lead l WHERE l.assignedTo IS NULL AND l.createdBy.managerId = :managerId")
    List<Lead> findUnassignedLeadsByManagerTeam(@Param("managerId") Integer managerId);
    
    // Direct SQL query to find unassigned leads created by executives under a manager
    @Query(value = "SELECT l.* FROM leads l " +
           "INNER JOIN users u ON l.created_by = u.user_id " +
           "WHERE l.assigned_to IS NULL " +
           "AND u.role = 'Sales_Executive' " +
           "AND u.manager_id = :managerId", nativeQuery = true)
    List<Lead> findUnassignedLeadsByManagerTeamNative(@Param("managerId") Integer managerId);
    @Query("""
       SELECT l FROM Lead l
       WHERE (l.assignedTo.userId IN :executiveIds 
              OR (l.assignedTo IS NULL AND l.createdBy.userId IN :executiveIds))
       AND (:q IS NULL
         OR LOWER(l.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.lastName)  LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.companyName)   LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.email)     LIKE LOWER(CONCAT('%',:q,'%')))

    """)
    List<Lead> findLeadsAssignedToExecutives(@Param("q") String q, @Param("executiveIds") List<Integer> executiveIds);

    @Query("""
       SELECT l FROM Lead l
       WHERE (l.assignedTo.userId IN :executiveIds 
              OR (l.assignedTo IS NULL AND l.createdBy.userId IN :executiveIds))
       AND (:q IS NULL
         OR LOWER(l.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.lastName)  LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.companyName)   LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.email)     LIKE LOWER(CONCAT('%',:q,'%')))

    """)
    List<Lead> findLeadsBelongingToExecutives(@Param("q") String q, @Param("executiveIds") List<Integer> executiveIds);
    
    // Find leads for Lead Assignment module: approved reassignment requests (regardless of assignment status)
    @Query(value = "SELECT l.* FROM leads l " +
           "WHERE l.lead_id IN (" +
           "  SELECT DISTINCT r.lead_id FROM lead_reassignment_requests r " +
           "  INNER JOIN users u ON r.requested_by = u.user_id " +
           "  WHERE r.status = 'APPROVED' AND u.manager_id = :managerId" +
           ")", nativeQuery = true)
    List<Lead> findLeadsForAssignment(@Param("managerId") Integer managerId);
    
    // VP specific queries - count leads for executives under VP (prioritize assigned_to)
    @Query("SELECT COUNT(l) FROM Lead l WHERE l.assignedTo.userId IN :executiveIds OR (l.assignedTo IS NULL AND l.createdBy.userId IN :executiveIds)")
    long countLeadsForExecutives(@Param("executiveIds") List<Integer> executiveIds);
    
    @Query("SELECT COALESCE(SUM(l.prospectValue), 0.0) FROM Lead l WHERE l.companyName = :accountName")
    Double sumProspectValueByAccountName(@Param("accountName") String accountName);
    
    // CEO specific queries - filter leads by owner (assignedTo with createdBy fallback)
    @Query("""
       SELECT l FROM Lead l
       WHERE (l.assignedTo.userId IN :ownerIds OR (l.assignedTo IS NULL AND l.createdBy.userId IN :ownerIds))
       AND (:q IS NULL
         OR LOWER(l.firstName) LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.lastName)  LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.companyName)   LIKE LOWER(CONCAT('%',:q,'%'))
         OR LOWER(l.email)     LIKE LOWER(CONCAT('%',:q,'%')))

    """)
    List<Lead> findLeadsByOwner(@Param("q") String q, @Param("ownerIds") List<Integer> ownerIds);
    
    // For data reassignment
    List<Lead> findByCreatedBy(com.techtammina.crm.entity.Users user);
    
    // Find leads for executive based on owner logic (for Sales Manager filtering)
    @Query(value = """
        SELECT l.* FROM leads l 
        INNER JOIN users u ON l.created_by = u.user_id 
        WHERE (
            CASE 
                WHEN u.role IN ('Sales_Manager', 'Sales_VP') THEN l.created_by = :executiveId
                WHEN u.role = 'Sales_Executive' THEN 
                    CASE 
                        WHEN l.assigned_to IS NOT NULL THEN l.assigned_to = :executiveId
                        ELSE l.created_by = :executiveId
                    END
                ELSE l.created_by = :executiveId
            END
        )
        AND (:q IS NULL 
            OR LOWER(l.first_name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(l.last_name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(l.company_name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(l.email) LIKE LOWER(CONCAT('%', :q, '%')))
        """, nativeQuery = true)
    List<Lead> findLeadsForExecutiveByOwner(@Param("q") String q, @Param("executiveId") Integer executiveId);
    
    // JPA version with proper joins for CEO module
    @Query(value = """
        SELECT l.* FROM leads l 
        INNER JOIN users u ON l.created_by = u.user_id 
        LEFT JOIN users a ON l.assigned_to = a.user_id
        WHERE (
            CASE 
                WHEN u.role IN ('Sales_Manager', 'Sales_VP') THEN l.created_by = :executiveId
                WHEN u.role = 'Sales_Executive' THEN 
                    CASE 
                        WHEN l.assigned_to IS NOT NULL THEN l.assigned_to = :executiveId
                        ELSE l.created_by = :executiveId
                    END
                ELSE l.created_by = :executiveId
            END
        )
        AND (:q IS NULL 
            OR LOWER(l.first_name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(l.last_name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(l.company_name) LIKE LOWER(CONCAT('%', :q, '%'))
            OR LOWER(l.email) LIKE LOWER(CONCAT('%', :q, '%')))
        """, nativeQuery = true)
    List<Lead> findLeadsForExecutiveByOwnerWithJoins(@Param("q") String q, @Param("executiveId") Integer executiveId);
    
    // Find all leads with proper joins for CEO module
    @Query(value = "SELECT l.* FROM leads l INNER JOIN users u ON l.created_by = u.user_id LEFT JOIN users a ON l.assigned_to = a.user_id", nativeQuery = true)
    List<Lead> findAllWithJoins();
    
    // Count leads by status for conversion rate calculation
    @Query(value = "SELECT COUNT(*) FROM leads WHERE LOWER(lead_status) = LOWER(:status)", nativeQuery = true)
    long countByStatus(@Param("status") String status);
    
    // For synchronization - find leads by converted IDs
    List<Lead> findByConvertedAccountId(Integer accountId);
    List<Lead> findByConvertedContactId(Integer contactId);
}

