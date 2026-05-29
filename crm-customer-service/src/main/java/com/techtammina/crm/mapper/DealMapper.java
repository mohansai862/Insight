package com.techtammina.crm.mapper;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.DealDTO;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.Account;
import com.techtammina.crm.entity.Contact;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.repository.AccountRepository;
import com.techtammina.crm.repository.ContactRepository;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.repository.LeadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
public class DealMapper {
    private static final Logger log = LoggerFactory.getLogger(DealMapper.class);

    private static AccountRepository accountRepository;
    private static ContactRepository contactRepository;
    private static UsersRepository usersRepository;
    private static LeadRepository leadRepository;

    @Autowired
    public DealMapper(AccountRepository accountRepository, 
                     ContactRepository contactRepository,
                     UsersRepository usersRepository,
                     LeadRepository leadRepository) {
        DealMapper.accountRepository = accountRepository;
        DealMapper.contactRepository = contactRepository;
        DealMapper.usersRepository = usersRepository;
        DealMapper.leadRepository = leadRepository;
    }

    public static DealDTO toDTO(Deal deal) {
        DealDTO dto = new DealDTO();
        dto.setDealId(deal.getDealId());
        dto.setAccountId(deal.getAccount() != null ? deal.getAccount().getAccountId() : null);
        
        // Debug logging for account data
        if (deal.getAccount() != null) {
            log.debug("🔍 DealMapper.toDTO - Deal: {}, Account: {}", deal.getDealName(), deal.getAccount().getAccountName());
            dto.setAccountName(deal.getAccount().getAccountName());
            dto.setAccountCompanyLocation(deal.getAccount().getCompanyLocation());
            dto.setAccountCountry(deal.getAccount().getCountry());
        } else {
            log.debug("⚠️ DealMapper.toDTO - Deal: {}, Account is NULL", deal.getDealName());
        }
        
        dto.setContactId(deal.getContact() != null ? deal.getContact().getContactId() : null);
        dto.setDealName(deal.getDealName());
        dto.setDealValue(deal.getDealValue());
        
        // Debug stage conversion
        String stageString = deal.getStage() != null ? deal.getStage().name() : null;
        log.info("🔍 DealMapper.toDTO - Deal: {}, Stage enum: {}, Stage string: {}", 
            deal.getDealName(), deal.getStage(), stageString);
        dto.setStage(stageString);
        
        dto.setProbability(deal.getProbability());
        dto.setExpectedCloseDate(deal.getExpectedCloseDate());
        dto.setClosedDate(deal.getClosedDate());
        dto.setCreatedBy(deal.getCreatedBy() != null ? deal.getCreatedBy().getUserId() : null);
        dto.setCreatedByName(deal.getCreatedBy() != null ? deal.getCreatedBy().getFirstName() + " " + deal.getCreatedBy().getLastName() : null);
        dto.setRemarks(deal.getRemarks());
        dto.setCreatedAt(deal.getCreatedAt());
        dto.setUpdatedAt(deal.getUpdatedAt());
        
        // Set lead name from contact if available, otherwise try to fetch from original converted lead
        if (deal.getContact() != null) {
            String contactName = deal.getContact().getFirstName() + " " + deal.getContact().getLastName();
            dto.setLeadName(contactName);
        } else if (deal.getDealId() != null) {
            java.util.List<Lead> convertedLeads = leadRepository.findByConvertedDealId(deal.getDealId());
            if (!convertedLeads.isEmpty()) {
                Lead originalLead = convertedLeads.get(0);
                String leadName = originalLead.getFirstName() + " " + originalLead.getLastName();
                dto.setLeadName(leadName);
            }
        }
        
        return dto;
    }

    public static Deal toEntity(DealDTO dto) {
        Deal deal = new Deal();
        deal.setDealId(dto.getDealId());
        
        if (dto.getAccountId() != null) {
            Optional<Account> account = accountRepository.findById(dto.getAccountId());
            account.ifPresent(deal::setAccount);
        }
        
        if (dto.getContactId() != null) {
            Optional<Contact> contact = contactRepository.findById(dto.getContactId());
            contact.ifPresent(deal::setContact);
        }
        
        deal.setDealName(dto.getDealName());
        deal.setDealValue(dto.getDealValue());
        
        if (dto.getStage() != null) {
            deal.setStage(Deal.Stage.valueOf(dto.getStage()));
        }
        
        deal.setProbability(dto.getProbability());
        deal.setExpectedCloseDate(dto.getExpectedCloseDate());
        deal.setClosedDate(dto.getClosedDate());
        deal.setRemarks(dto.getRemarks());

        Users userToSet = null;
        if (dto.getCreatedBy() != null) {
            Optional<Users> user = usersRepository.findById(dto.getCreatedBy());
            if (user.isPresent()) {
                userToSet = user.get();
            }
        }
        if (userToSet == null) {
            // Fallback: try to find user with ID 1
            Optional<Users> defaultUser = usersRepository.findById(1);
            if (defaultUser.isPresent()) {
                userToSet = defaultUser.get();
            } else {
                // Fallback: get any user from repository
                Iterable<Users> allUsers = usersRepository.findAll();
                if (allUsers.iterator().hasNext()) {
                    userToSet = allUsers.iterator().next();
                }
            }
        }
        if (userToSet != null) {
            deal.setCreatedBy(userToSet);
        }
        
        return deal;
    }
}
