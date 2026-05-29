package com.techtammina.crm.repository;

import com.techtammina.crm.entity.Signup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface SignupRepository extends JpaRepository<Signup, Integer> {
	Optional<Signup> findByUsername(String username);

	Optional<Signup> findByEmail(String email);

	List<Signup> findByRoleAndStatus(Signup.Role role, Signup.Status status);

	List<Signup> findByReportingToAndStatus(Integer reportingTo, Signup.Status status);

	List<Signup> findByStatus(Signup.Status status);

	@Query("SELECT s FROM Signup s WHERE s.status = ?1 AND s.role IN ('Sales_Executive', 'Sales_Manager', 'Sales_VP')")
	List<Signup> findApprovedSalesUsers(Signup.Status status);
}

