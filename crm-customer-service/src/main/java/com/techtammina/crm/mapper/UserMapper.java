package com.techtammina.crm.mapper;

import com.techtammina.crm.dto.UserDTO;
import com.techtammina.crm.entity.Users;

public class UserMapper {
    public static UserDTO toDTO(Users e) {
        UserDTO d = new UserDTO();
        d.setUserId(e.getUserId());
        d.setUsername(e.getUsername());
        d.setEmail(e.getEmail());
        d.setRole(e.getRole());
        d.setManagerId(e.getManagerId());
        d.setCreatedAt(e.getCreatedAt());
        
        // Map profile fields
        d.setFirstName(e.getFirstName());
        d.setLastName(e.getLastName());
        d.setMiddleName(e.getMiddleName());
        d.setCountryCode(e.getCountryCode());
        d.setPhoneNumber(e.getPhoneNumber());
        if (e.getGender() != null) {
            d.setGender(e.getGender().toString());
        }
        
        // Create full name from first and last name
        String fullName = "";
        if (e.getFirstName() != null && !e.getFirstName().trim().isEmpty()) {
            fullName = e.getFirstName().trim();
        }
        if (e.getLastName() != null && !e.getLastName().trim().isEmpty()) {
            if (!fullName.isEmpty()) {
                fullName += " " + e.getLastName().trim();
            } else {
                fullName = e.getLastName().trim();
            }
        }
        // If no name available, use username
        if (fullName.isEmpty()) {
            fullName = e.getUsername();
        }
        d.setFullName(fullName);
        
        return d;
    }

    public static Users toEntity(UserDTO d) {
        Users e = new Users();
        e.setUserId(d.getUserId());
        e.setUsername(d.getUsername());
        e.setEmail(d.getEmail());
        e.setRole(d.getRole());
        e.setManagerId(d.getManagerId());
        e.setCreatedAt(d.getCreatedAt());
        
        // Map profile fields
        e.setFirstName(d.getFirstName());
        e.setLastName(d.getLastName());
        e.setMiddleName(d.getMiddleName());
        e.setCountryCode(d.getCountryCode());
        e.setPhoneNumber(d.getPhoneNumber());
        if (d.getGender() != null) {
            try {
                e.setGender(Users.Gender.valueOf(d.getGender()));
            } catch (IllegalArgumentException ex) {
                // Invalid gender value, ignore
            }
        }
        
        return e;
    }
}

