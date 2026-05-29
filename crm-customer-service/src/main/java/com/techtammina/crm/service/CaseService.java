package com.techtammina.crm.service;

import com.techtammina.crm.dto.CaseDTO;
import com.techtammina.crm.dto.CaseCommentDTO;
import com.techtammina.crm.entity.*;
import com.techtammina.crm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class CaseService {

    private final CaseRepository caseRepository;
    private final CaseCommentRepository caseCommentRepository;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final UsersRepository usersRepository;
    private final DealRepository dealRepository;
    private final SLAService slaService;

    public CaseService(CaseRepository caseRepository, CaseCommentRepository caseCommentRepository,
                      AccountRepository accountRepository, ContactRepository contactRepository,
                      UsersRepository usersRepository, DealRepository dealRepository,
                      SLAService slaService) {
        this.caseRepository = caseRepository;
        this.caseCommentRepository = caseCommentRepository;
        this.accountRepository = accountRepository;
        this.contactRepository = contactRepository;
        this.usersRepository = usersRepository;
        this.dealRepository = dealRepository;
        this.slaService = slaService;
    }

    public CaseDTO createCase(CaseDTO caseDTO, Integer userId) {
        Case caseEntity = new Case();
        
        // Set relationships
        Account account = accountRepository.findById(caseDTO.getAccountId())
            .orElseThrow(() -> new RuntimeException("Account not found"));
        caseEntity.setAccount(account);
        
        if (caseDTO.getContactId() != null) {
            Contact contact = contactRepository.findById(caseDTO.getContactId())
                .orElseThrow(() -> new RuntimeException("Contact not found"));
            caseEntity.setContact(contact);
        }
        
        Users createdBy = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        caseEntity.setCreatedBy(createdBy);
        
        if (caseDTO.getRelatedDealId() != null) {
            Deal deal = dealRepository.findById(caseDTO.getRelatedDealId())
                .orElseThrow(() -> new RuntimeException("Deal not found"));
            caseEntity.setRelatedDeal(deal);
        }
        
        // Generate case number
        String caseNumber = generateCaseNumber();
        caseEntity.setCaseNumber(caseNumber);
        
        // Set other fields
        caseEntity.setSubject(caseDTO.getSubject());
        caseEntity.setDescription(caseDTO.getDescription());
        caseEntity.setPriority(Case.Priority.valueOf(caseDTO.getPriority()));
        caseEntity.setType(Case.Type.valueOf(caseDTO.getType()));
        caseEntity.setCategory(caseDTO.getCategory());
        caseEntity.setStatus(Case.Status.New);
        
        caseEntity = caseRepository.save(caseEntity);
        
        // Create SLA tracking
        slaService.createCaseSLA(caseEntity);
        
        return convertToDTO(caseEntity);
    }

    /**
     * Generate unique case number in format: CS-YYYY-MM-####
     * This method is synchronized to prevent duplicate case numbers in concurrent scenarios
     */
    private synchronized String generateCaseNumber() {
        LocalDate now = LocalDate.now();
        String prefix = String.format("CS-%04d-%02d-", now.getYear(), now.getMonthValue());
        
        // Find the highest case number for current month
        String maxCaseNumber = caseRepository.findMaxCaseNumberForMonth(prefix);
        
        int nextNumber = 1;
        if (maxCaseNumber != null && !maxCaseNumber.isEmpty()) {
            try {
                // Extract the last 4 digits from case number
                String lastDigits = maxCaseNumber.substring(maxCaseNumber.length() - 4);
                nextNumber = Integer.parseInt(lastDigits) + 1;
            } catch (Exception e) {
                // If parsing fails, start from 1
                nextNumber = 1;
            }
        }
        
        // Generate new case number
        String newCaseNumber = String.format("%s%04d", prefix, nextNumber);
        
        // Double-check for uniqueness (safety net)
        while (caseRepository.findByCaseNumber(newCaseNumber).isPresent()) {
            nextNumber++;
            newCaseNumber = String.format("%s%04d", prefix, nextNumber);
        }
        
        return newCaseNumber;
    }

    public Page<CaseDTO> getAllCases(Pageable pageable, String status, String priority, 
                                    Integer assignedTo, Integer userId, String userRole) {
        Page<Case> cases;
        
        // Apply filters based on parameters
        if (status != null && !status.isEmpty()) {
            cases = caseRepository.findByStatus(Case.Status.valueOf(status), pageable);
        } else if (priority != null && !priority.isEmpty()) {
            cases = caseRepository.findByPriority(Case.Priority.valueOf(priority), pageable);
        } else if (assignedTo != null) {
            cases = caseRepository.findByAssignedToUserId(assignedTo, pageable);
        } else {
            cases = caseRepository.findAll(pageable);
        }
        
        return cases.map(this::convertToDTO);
    }

    public Optional<CaseDTO> getCaseById(Integer caseId, Integer userId, String userRole) {
        Optional<Case> caseOpt = caseRepository.findById(caseId);
        return caseOpt.map(this::convertToDTO);
    }

    public CaseDTO updateCase(Integer caseId, CaseDTO caseDTO, Integer userId, String userRole) {
        Case caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new RuntimeException("Case not found"));
        
        // Update fields
        caseEntity.setSubject(caseDTO.getSubject());
        caseEntity.setDescription(caseDTO.getDescription());
        caseEntity.setPriority(Case.Priority.valueOf(caseDTO.getPriority()));
        caseEntity.setCategory(caseDTO.getCategory());
        
        if (caseDTO.getAssignedToId() != null) {
            Users assignee = usersRepository.findById(caseDTO.getAssignedToId())
                .orElseThrow(() -> new RuntimeException("Assignee not found"));
            caseEntity.setAssignedTo(assignee);
        }
        
        caseEntity = caseRepository.save(caseEntity);
        return convertToDTO(caseEntity);
    }

    public CaseDTO assignCase(Integer caseId, Integer assigneeId, Integer userId, String userRole) {
        Case caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new RuntimeException("Case not found"));
        
        Users assignee = usersRepository.findById(assigneeId)
            .orElseThrow(() -> new RuntimeException("Assignee not found"));
        
        caseEntity.setAssignedTo(assignee);
        if (caseEntity.getStatus() == Case.Status.New) {
            caseEntity.setStatus(Case.Status.InProgress);
        }
        
        caseEntity = caseRepository.save(caseEntity);
        return convertToDTO(caseEntity);
    }

    public CaseDTO resolveCase(Integer caseId, String resolutionDetails, String resolutionType, 
                              Integer userId, String userRole) {
        Case caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new RuntimeException("Case not found"));
        
        caseEntity.setStatus(Case.Status.Resolved);
        caseEntity.setResolvedDate(LocalDateTime.now());
        caseEntity.setResolutionDetails(resolutionDetails);
        
        if (resolutionType != null) {
            caseEntity.setResolutionType(Case.ResolutionType.valueOf(resolutionType));
        }
        
        caseEntity = caseRepository.save(caseEntity);
        
        // Update SLA tracking
        slaService.markResolutionMet(caseId);
        
        return convertToDTO(caseEntity);
    }

    public CaseDTO closeCase(Integer caseId, Integer userId, String userRole) {
        Case caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new RuntimeException("Case not found"));
        
        caseEntity.setStatus(Case.Status.Closed);
        caseEntity.setClosedDate(LocalDateTime.now());
        
        caseEntity = caseRepository.save(caseEntity);
        return convertToDTO(caseEntity);
    }

    public CaseDTO reopenCase(Integer caseId, Integer userId, String userRole) {
        Case caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new RuntimeException("Case not found"));
        
        caseEntity.setStatus(Case.Status.Reopened);
        caseEntity.setClosedDate(null);
        caseEntity.setResolvedDate(null);
        
        caseEntity = caseRepository.save(caseEntity);
        return convertToDTO(caseEntity);
    }

    public CaseDTO escalateCase(Integer caseId, Integer userId, String userRole) {
        Case caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new RuntimeException("Case not found"));
        
        caseEntity.setEscalationLevel(caseEntity.getEscalationLevel() + 1);
        
        // Auto-escalate priority if needed
        if (caseEntity.getPriority() == Case.Priority.Low) {
            caseEntity.setPriority(Case.Priority.Medium);
        } else if (caseEntity.getPriority() == Case.Priority.Medium) {
            caseEntity.setPriority(Case.Priority.High);
        } else if (caseEntity.getPriority() == Case.Priority.High) {
            caseEntity.setPriority(Case.Priority.Critical);
        }
        
        caseEntity = caseRepository.save(caseEntity);
        return convertToDTO(caseEntity);
    }

    public CaseCommentDTO addComment(Integer caseId, CaseCommentDTO commentDTO, Integer userId, String userRole) {
        Case caseEntity = caseRepository.findById(caseId)
            .orElseThrow(() -> new RuntimeException("Case not found"));
        
        Users user = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        CaseComment comment = new CaseComment();
        comment.setCaseEntity(caseEntity);
        comment.setUser(user);
        comment.setComment(commentDTO.getComment());
        comment.setIsInternal(commentDTO.getIsInternal());
        
        comment = caseCommentRepository.save(comment);
        
        // Mark first response SLA as met if this is the first response
        if (caseEntity.getStatus() == Case.Status.New) {
            caseEntity.setStatus(Case.Status.InProgress);
            caseRepository.save(caseEntity);
            slaService.markFirstResponseMet(caseId);
        }
        
        return convertCommentToDTO(comment);
    }

    public List<CaseDTO> getCasesByAccountId(Integer accountId) {
        List<Case> cases = caseRepository.findByAccountAccountId(accountId);
        return cases.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    public List<CaseDTO> getMyCases(Integer userId) {
        List<Case> cases = caseRepository.findOpenCasesByAssignee(userId);
        return cases.stream().map(this::convertToDTO).collect(Collectors.toList());
    }

    private CaseDTO convertToDTO(Case caseEntity) {
        CaseDTO dto = new CaseDTO();
        dto.setCaseId(caseEntity.getCaseId());
        dto.setCaseNumber(caseEntity.getCaseNumber());
        dto.setAccountId(caseEntity.getAccount().getAccountId());
        dto.setAccountName(caseEntity.getAccount().getAccountName());
        
        if (caseEntity.getContact() != null) {
            dto.setContactId(caseEntity.getContact().getContactId());
            dto.setContactName(caseEntity.getContact().getFirstName() + " " + caseEntity.getContact().getLastName());
        }
        
        dto.setSubject(caseEntity.getSubject());
        dto.setDescription(caseEntity.getDescription());
        dto.setPriority(caseEntity.getPriority().name());
        dto.setStatus(caseEntity.getStatus().name());
        dto.setType(caseEntity.getType().name());
        dto.setCategory(caseEntity.getCategory());
        
        if (caseEntity.getAssignedTo() != null) {
            dto.setAssignedToId(caseEntity.getAssignedTo().getUserId());
            dto.setAssignedToName(caseEntity.getAssignedTo().getFirstName() + " " + caseEntity.getAssignedTo().getLastName());
        }
        
        dto.setCreatedById(caseEntity.getCreatedBy().getUserId());
        dto.setCreatedByName(caseEntity.getCreatedBy().getFirstName() + " " + caseEntity.getCreatedBy().getLastName());
        dto.setCreatedDate(caseEntity.getCreatedDate());
        dto.setModifiedDate(caseEntity.getModifiedDate());
        dto.setResolvedDate(caseEntity.getResolvedDate());
        dto.setClosedDate(caseEntity.getClosedDate());
        dto.setResolutionDetails(caseEntity.getResolutionDetails());
        
        if (caseEntity.getResolutionType() != null) {
            dto.setResolutionType(caseEntity.getResolutionType().name());
        }
        
        if (caseEntity.getRelatedDeal() != null) {
            dto.setRelatedDealId(caseEntity.getRelatedDeal().getDealId());
            dto.setRelatedDealName(caseEntity.getRelatedDeal().getDealName());
        }
        
        dto.setEscalationLevel(caseEntity.getEscalationLevel());
        
        // Load comments
        List<CaseComment> comments = caseCommentRepository.findByCaseIdOrderByCreatedDate(caseEntity.getCaseId());
        dto.setComments(comments.stream().map(this::convertCommentToDTO).collect(Collectors.toList()));
        
        return dto;
    }

    private CaseCommentDTO convertCommentToDTO(CaseComment comment) {
        CaseCommentDTO dto = new CaseCommentDTO();
        dto.setCommentId(comment.getCommentId());
        dto.setCaseId(comment.getCaseEntity().getCaseId());
        dto.setUserId(comment.getUser().getUserId());
        dto.setUserName(comment.getUser().getFirstName() + " " + comment.getUser().getLastName());
        dto.setComment(comment.getComment());
        dto.setIsInternal(comment.getIsInternal());
        dto.setCreatedDate(comment.getCreatedDate());
        return dto;
    }
}

