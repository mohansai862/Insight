package com.techtammina.crm.repository;
 
 
import com.techtammina.crm.entity.Users;
 
import java.util.List;
import java.util.Optional;
 
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
 
public interface UsersRepository extends JpaRepository<Users, Integer> {
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
 
    // Case-sensitive username lookup
    @Query(value = "SELECT * FROM users WHERE BINARY username = :username", nativeQuery = true)
    Optional<Users> findByUsername(@Param("username") String username);
 
    // Case-sensitive email lookup
    @Query(value = "SELECT * FROM users WHERE BINARY email = :email", nativeQuery = true)
    Optional<Users> findByEmail(@Param("email") String email);
 
    // new: find users by role for task assignment
    List<Users> findByRole(String role);
    List<Users> findByRole(Users.Role role);
 
    // find users who report to a manager
    List<Users> findByManagerId(Integer managerId);
   
    // find sales executives under a specific manager
    @Query("SELECT u FROM Users u WHERE u.managerId = :managerId AND u.role = 'Sales_Executive'")
    List<Users> findSalesExecutivesByManagerId(@Param("managerId") Integer managerId);
 
    // case-insensitive lookup by username or email
    @Query("SELECT u FROM Users u WHERE LOWER(u.username) = LOWER(:id) OR LOWER(u.email) = LOWER(:id)")
    Optional<Users> findByIdentifierIgnoreCase(@Param("id") String id);
   
    // Find users by manager ID and role
    @Query("SELECT u FROM Users u WHERE u.managerId = :managerId AND u.role = :role")
    List<Users> findByManagerIdAndRole(@Param("managerId") Integer managerId, @Param("role") String role);
   
    // Find managers under a VP
    @Query("SELECT u FROM Users u WHERE u.role = 'Sales_Manager' AND u.managerId = :vpId")
    List<Users> findManagersByVpId(@Param("vpId") Integer vpId);
   
    // Find user by empid
    Users findByEmpid(String empid);
    
    // Find all users excluding IT_Admin role
    @Query("SELECT u FROM Users u WHERE u.role IN ('Sales_Executive', 'Sales_Manager', 'Sales_VP')")
    List<Users> findAllSalesUsers();
}
 