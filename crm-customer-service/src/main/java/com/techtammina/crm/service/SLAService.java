package com.techtammina.crm.service;

import com.techtammina.crm.entity.Case;
import com.techtammina.crm.entity.CaseSLA;
import com.techtammina.crm.entity.SLA;
import com.techtammina.crm.repository.CaseSLARepository;
import com.techtammina.crm.repository.SLARepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SLAService {

    private final SLARepository slaRepository;
    private final CaseSLARepository caseSLARepository;

    public SLAService(SLARepository slaRepository, CaseSLARepository caseSLARepository) {
        this.slaRepository = slaRepository;
        this.caseSLARepository = caseSLARepository;
    }

    public void createCaseSLA(Case caseEntity) {
        Optional<SLA> slaOpt = slaRepository.findByPriorityAndIsActiveTrue(caseEntity.getPriority());
        
        if (slaOpt.isPresent()) {
            SLA sla = slaOpt.get();
            CaseSLA caseSLA = new CaseSLA();
            caseSLA.setCaseEntity(caseEntity);
            caseSLA.setSla(sla);
            
            LocalDateTime now = LocalDateTime.now();
            caseSLA.setFirstResponseDue(now.plusMinutes(sla.getFirstResponseTime()));
            caseSLA.setResolutionDue(now.plusMinutes(sla.getResolutionTime()));
            
            caseSLARepository.save(caseSLA);
        }
    }

    public void markFirstResponseMet(Integer caseId) {
        Optional<CaseSLA> caseSLAOpt = caseSLARepository.findByCaseEntityCaseId(caseId);
        if (caseSLAOpt.isPresent()) {
            CaseSLA caseSLA = caseSLAOpt.get();
            caseSLA.setFirstResponseMet(true);
            caseSLARepository.save(caseSLA);
        }
    }

    public void markResolutionMet(Integer caseId) {
        Optional<CaseSLA> caseSLAOpt = caseSLARepository.findByCaseEntityCaseId(caseId);
        if (caseSLAOpt.isPresent()) {
            CaseSLA caseSLA = caseSLAOpt.get();
            caseSLA.setResolutionMet(true);
            caseSLARepository.save(caseSLA);
        }
    }

    public List<CaseSLA> getBreachedFirstResponse() {
        return caseSLARepository.findBreachedFirstResponse(LocalDateTime.now());
    }

    public List<CaseSLA> getBreachedResolution() {
        return caseSLARepository.findBreachedResolution(LocalDateTime.now());
    }
}

