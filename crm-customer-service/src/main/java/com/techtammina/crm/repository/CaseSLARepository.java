package com.techtammina.crm.repository;

import com.techtammina.crm.entity.CaseSLA;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface CaseSLARepository extends JpaRepository<CaseSLA, Integer> {
    
    Optional<CaseSLA> findByCaseEntityCaseId(Integer caseId);
    
    @Query("SELECT cs FROM CaseSLA cs WHERE cs.firstResponseDue < :now AND cs.firstResponseMet = false")
    List<CaseSLA> findBreachedFirstResponse(@Param("now") LocalDateTime now);
    
    @Query("SELECT cs FROM CaseSLA cs WHERE cs.resolutionDue < :now AND cs.resolutionMet = false")
    List<CaseSLA> findBreachedResolution(@Param("now") LocalDateTime now);
}

