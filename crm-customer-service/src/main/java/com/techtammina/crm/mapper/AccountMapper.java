package com.techtammina.crm.mapper;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.AccountDTO;
import com.techtammina.crm.entity.Account;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Slf4j
@Component
public class AccountMapper {
    private static final Logger log = LoggerFactory.getLogger(AccountMapper.class);
    
    private static UsersRepository usersRepository;

    @Autowired
    public AccountMapper(UsersRepository usersRepository) {
        AccountMapper.usersRepository = usersRepository;
    }
    public static AccountDTO toDTO(Account e) {
        AccountDTO d = new AccountDTO();
        d.setAccountId(e.getAccountId());
        d.setAccountName(e.getAccountName());
        d.setIndustry(e.getIndustry());
        d.setCountry(e.getCountry());
        d.setCompanyLocation(e.getCompanyLocation());
        d.setReassignTo(e.getReassignTo() != null ? e.getReassignTo().getUserId() : null);
        
        d.setContactName(e.getContactName());
        d.setEmail(e.getEmail());
        d.setPhoneNumber(e.getPhoneNumber());
        d.setJobTitle(e.getJobTitle());
        d.setWebsite(e.getWebsite());
        d.setNumberOfEmployees(e.getNumberOfEmployees());
        d.setCreatedBy(e.getCreatedBy() != null ? e.getCreatedBy().getUserId() : null);
        d.setCreatedAt(e.getCreatedAt());
        d.setUpdatedAt(e.getUpdatedAt());
        d.setType(e.getType() != null ? e.getType().name().toLowerCase() : null);
        d.setStatus(e.getStatus() != null ? e.getStatus().name().toLowerCase() : null);
        
        log.debug("📄 ACCOUNT DTO MAPPING - ID: {}, Name: {}", d.getAccountId(), d.getAccountName());
        log.debug("   Website: {}, CompanyLocation: {}", d.getWebsite(), d.getCompanyLocation());
        log.debug("   Country: {}, Industry: {}", d.getCountry(), d.getIndustry());
        log.debug("   ReassignTo: {}, CreatedBy: {}", d.getReassignTo(), d.getCreatedBy());
        return d;
    }

    public static Account toEntity(AccountDTO d) {
        Account e = new Account();
        e.setAccountId(d.getAccountId());
        e.setAccountName(d.getAccountName());
        e.setIndustry(d.getIndustry());
        e.setCountry(d.getCountry());
        e.setCompanyLocation(d.getCompanyLocation());
        
        if (d.getReassignTo() != null && usersRepository != null) {
            Optional<Users> reassignTo = usersRepository.findById(d.getReassignTo());
            reassignTo.ifPresent(e::setReassignTo);
        }
        
        e.setContactName(d.getContactName());
        e.setEmail(d.getEmail());
        e.setPhoneNumber(d.getPhoneNumber());
        e.setJobTitle(d.getJobTitle());
        e.setWebsite(d.getWebsite());
        e.setNumberOfEmployees(d.getNumberOfEmployees());
        
        if (d.getCreatedBy() != null && usersRepository != null) {
            Optional<Users> createdBy = usersRepository.findById(d.getCreatedBy());
            createdBy.ifPresent(e::setCreatedBy);
        }
        
        if (d.getType() != null) {
            try {
                e.setType(Account.AccountType.valueOf(d.getType().toLowerCase()));
            } catch (IllegalArgumentException ex) {
                e.setType(Account.AccountType.lead); // Default fallback
            }
        }
        if (d.getStatus() != null) {
            try {
                e.setStatus(Account.AccountStatus.valueOf(d.getStatus().toLowerCase()));
            } catch (IllegalArgumentException ex) {
                e.setStatus(Account.AccountStatus.active); // Default fallback
            }
        }
        
        log.debug("📄 ACCOUNT ENTITY MAPPING - Name: {}, Email: {}", e.getAccountName(), e.getEmail());
        return e;
    }
}