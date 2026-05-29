package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, Integer> {
    boolean existsByEmail(String email);
    boolean existsByAccount_AccountIdAndEmail(Integer accountId, String email);
    Optional<Contact> findByAccount_AccountIdAndEmail(Integer accountId, String email);
    List<Contact> findByAccount_AccountId(Integer accountId);
    
    // Manager filtering - contacts created by executives under a manager
    @Query("SELECT c FROM Contact c WHERE c.createdBy IS NOT NULL AND c.createdBy.managerId = :managerId")
    List<Contact> findByManagerId(@Param("managerId") Integer managerId);
    
    @Query("SELECT c FROM Contact c WHERE c.createdBy IS NOT NULL AND c.createdBy.managerId = :managerId AND (c.firstName LIKE %:search% OR c.lastName LIKE %:search% OR c.email LIKE %:search%)")
    List<Contact> findByManagerIdAndSearch(@Param("managerId") Integer managerId, @Param("search") String search);
    
    // Alternative native query for debugging
    @Query(value = "SELECT c.* FROM contacts c " +
           "INNER JOIN users u ON c.created_by = u.user_id " +
           "WHERE u.manager_id = :managerId", nativeQuery = true)
    List<Contact> findByManagerIdNative(@Param("managerId") Integer managerId);
    
    @Query(value = "SELECT c.* FROM contacts c " +
           "INNER JOIN users u ON c.created_by = u.user_id " +
           "WHERE u.manager_id = :managerId " +
           "AND (c.first_name LIKE %:search% OR c.last_name LIKE %:search% OR c.email LIKE %:search%)", nativeQuery = true)
    List<Contact> findByManagerIdAndSearchNative(@Param("managerId") Integer managerId, @Param("search") String search);

    // For data reassignment
    List<Contact> findByCreatedBy(com.techtammina.crm.entity.Users user);
    
    // Find contacts by reassignTo user
    List<Contact> findByReassignTo_UserId(Integer userId);
    
    // Find contacts by createdBy user ID
    List<Contact> findByCreatedBy_UserId(Integer userId);
    
    // Find contacts created by user where reassignTo is null
    List<Contact> findByCreatedBy_UserIdAndReassignToIsNull(Integer userId);
    
    // Simple native query for executive contacts - TESTING
    @Query(value = "SELECT * FROM contacts WHERE reassign_to = :executiveId", nativeQuery = true)
    List<Contact> findContactsAssignedToExecutive(@Param("executiveId") Integer executiveId);
    
    // Combined query for executive - both assigned and created
    @Query(value = "SELECT * FROM contacts WHERE reassign_to = :executiveId OR (created_by = :executiveId AND reassign_to IS NULL)", nativeQuery = true)
    List<Contact> findAllContactsForExecutiveNative(@Param("executiveId") Integer executiveId);
    
    // Native query to debug reassignTo field
    @Query(value = "SELECT * FROM contacts WHERE reassign_to = :userId", nativeQuery = true)
    List<Contact> findByReassignToNative(@Param("userId") Integer userId);

    // VP filtering - contacts belonging to executives under VP hierarchy
    @Query("SELECT c FROM Contact c WHERE " +
           "(c.createdBy IS NOT NULL AND c.createdBy.userId IN :executiveIds) OR " +
           "(c.reassignTo IS NOT NULL AND c.reassignTo.userId IN :executiveIds)")
    List<Contact> findContactsBelongingToExecutives(@Param("executiveIds") List<Integer> executiveIds);

    @Query("SELECT c FROM Contact c WHERE " +
           "((c.createdBy IS NOT NULL AND c.createdBy.userId IN :executiveIds) OR " +
           "(c.reassignTo IS NOT NULL AND c.reassignTo.userId IN :executiveIds)) AND " +
           "(:q IS NULL OR :q = '' OR " +
           "LOWER(c.firstName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.lastName) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.email) LIKE LOWER(CONCAT('%', :q, '%')) OR " +
           "LOWER(c.account.accountName) LIKE LOWER(CONCAT('%', :q, '%')))")
    List<Contact> findContactsBelongingToExecutivesWithSearch(@Param("q") String q, @Param("executiveIds") List<Integer> executiveIds);
    
    // Debug: Check all contacts with reassignTo field populated
    @Query(value = "SELECT c.contact_id, c.first_name, c.last_name, c.email, c.created_by, c.reassign_to, " +
           "u1.first_name as creator_name, u1.role as creator_role, " +
           "u2.first_name as assignee_name, u2.role as assignee_role " +
           "FROM contacts c " +
           "LEFT JOIN users u1 ON c.created_by = u1.user_id " +
           "LEFT JOIN users u2 ON c.reassign_to = u2.user_id " +
           "WHERE c.reassign_to IS NOT NULL", nativeQuery = true)
    List<Object[]> debugAllAssignedContacts();
    

    


}

