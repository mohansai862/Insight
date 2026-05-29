package com.techtammina.crm.mapper;

import com.techtammina.crm.dto.ActivityDTO;
import com.techtammina.crm.entity.Activity;
import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class ActivityMapper {

    private final LeadRepository leadRepository;
    private final UsersRepository usersRepository;

    @Autowired
    public ActivityMapper(LeadRepository leadRepository, 
                         UsersRepository usersRepository) {
        this.leadRepository = leadRepository;
        this.usersRepository = usersRepository;
    }

    public ActivityDTO toDTO(Activity activity) {
        ActivityDTO dto = new ActivityDTO();
        dto.setActivityId(activity.getActivityId());
        dto.setLeadId(activity.getLead() != null ? activity.getLead().getLeadId() : null);
        dto.setActivityType(activity.getActivityType() != null ? activity.getActivityType().name() : null);
        dto.setSubject(activity.getSubject());
        dto.setDescription(activity.getDescription());
        dto.setActivityDate(activity.getActivityDate());
        dto.setCreatedBy(activity.getCreatedBy() != null ? activity.getCreatedBy().getUserId() : null);
        dto.setCreatedAt(activity.getCreatedAt());
        return dto;
    }

    public Activity toEntity(ActivityDTO dto) {
        Activity activity = new Activity();
        activity.setActivityId(dto.getActivityId());
        
        // Lead is required
        if (dto.getLeadId() != null) {
            Optional<Lead> lead = leadRepository.findById(dto.getLeadId());
            if (lead.isPresent()) {
                activity.setLead(lead.get());
            } else {
                throw new RuntimeException("Lead not found with ID: " + dto.getLeadId());
            }
        } else {
            throw new RuntimeException("Lead ID is required");
        }
        
        // Activity type is required
        if (dto.getActivityType() != null && !dto.getActivityType().trim().isEmpty()) {
            try {
                activity.setActivityType(Activity.ActivityType.valueOf(dto.getActivityType().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid activity type: " + dto.getActivityType());
            }
        } else {
            activity.setActivityType(Activity.ActivityType.CALL); // Default
        }
        
        activity.setSubject(dto.getSubject());
        activity.setDescription(dto.getDescription());
        activity.setActivityDate(dto.getActivityDate());
        
        // CreatedBy is required
        if (dto.getCreatedBy() != null) {
            Optional<Users> user = usersRepository.findById(dto.getCreatedBy());
            if (user.isPresent()) {
                activity.setCreatedBy(user.get());
            } else {
                throw new RuntimeException("Created by user not found with ID: " + dto.getCreatedBy());
            }
        } else {
            // Try to find a default user (ID 1) if none specified
            Optional<Users> defaultUser = usersRepository.findById(1);
            if (defaultUser.isPresent()) {
                activity.setCreatedBy(defaultUser.get());
            } else {
                throw new RuntimeException("Created by user is required");
            }
        }
        
        return activity;
    }
}

