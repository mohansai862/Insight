package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Integer> {
    boolean existsByEmail(String email);
    Optional<Account> findByEmail(String email);

    // Enhanced account lookup methods for better deduplication
    Optional<Account> findByAccountNameIgnoreCase(String accountName);
    List<Account> findByAccountNameContainingIgnoreCase(String accountName);
    boolean existsByAccountNameIgnoreCase(String accountName);

    // Find accounts by domain for better company matching
    List<Account> findByEmailContainingIgnoreCase(String domain);
    
    // Manager filtering - accounts created by executives under a manager
    @Query("SELECT a FROM Account a INNER JOIN a.createdBy u WHERE u.managerId = :managerId")
List<Account> findByManagerId(@Param("managerId") Integer managerId);

@Query("""
    SELECT a FROM Account a 
    INNER JOIN a.createdBy u 
    WHERE u.managerId = :managerId 
    AND (LOWER(a.accountName) LIKE LOWER(CONCAT('%', :search, '%')) 
      OR LOWER(a.email) LIKE LOWER(CONCAT('%', :search, '%')))
""")
List<Account> findByManagerIdAndSearch(@Param("managerId") Integer managerId, @Param("search") String search);

    // For data reassignment
    List<Account> findByCreatedBy(com.techtammina.crm.entity.Users user);
    List<Account> findByReassignTo(com.techtammina.crm.entity.Users user);

}

