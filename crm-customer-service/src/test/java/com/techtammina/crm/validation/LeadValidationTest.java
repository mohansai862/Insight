package com.techtammina.crm.validation;

import com.techtammina.crm.dto.LeadDTO;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

public class LeadValidationTest {

    private Validator validator;

    @BeforeEach
    public void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Test
    public void testValidLead() {
        LeadDTO lead = new LeadDTO();
        lead.setFirstName("John");
        lead.setLastName("Doe");
        lead.setCompanyName("Tech Company");
        lead.setDesignation("Manager");
        lead.setEmail("john.doe@example.com");
        lead.setCountry("India");

        Set<ConstraintViolation<LeadDTO>> violations = validator.validate(lead);
        assertTrue(violations.isEmpty(), "Valid lead should not have validation errors");
    }

    @Test
    public void testFirstNameWithNumbers() {
        LeadDTO lead = new LeadDTO();
        lead.setFirstName("John123");
        lead.setLastName("Doe");
        lead.setCompanyName("Tech Company");
        lead.setDesignation("Manager");
        lead.setEmail("john.doe@example.com");
        lead.setCountry("India");

        Set<ConstraintViolation<LeadDTO>> violations = validator.validate(lead);
        assertFalse(violations.isEmpty(), "First name with numbers should have validation errors");
        
        boolean hasFirstNameError = violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("firstName"));
        assertTrue(hasFirstNameError, "Should have firstName validation error");
    }

    @Test
    public void testFirstNameWithOnlySpaces() {
        LeadDTO lead = new LeadDTO();
        lead.setFirstName("   ");
        lead.setLastName("Doe");
        lead.setCompanyName("Tech Company");
        lead.setDesignation("Manager");
        lead.setEmail("john.doe@example.com");
        lead.setCountry("India");

        Set<ConstraintViolation<LeadDTO>> violations = validator.validate(lead);
        assertFalse(violations.isEmpty(), "First name with only spaces should have validation errors");
    }

    @Test
    public void testEmailWithOnlySpaces() {
        LeadDTO lead = new LeadDTO();
        lead.setFirstName("John");
        lead.setLastName("Doe");
        lead.setCompanyName("Tech Company");
        lead.setDesignation("Manager");
        lead.setEmail("   ");
        lead.setCountry("India");

        Set<ConstraintViolation<LeadDTO>> violations = validator.validate(lead);
        assertFalse(violations.isEmpty(), "Email with only spaces should have validation errors");
    }

    @Test
    public void testPhoneNumberWithOnlySpaces() {
        LeadDTO lead = new LeadDTO();
        lead.setFirstName("John");
        lead.setLastName("Doe");
        lead.setCompanyName("Tech Company");
        lead.setDesignation("Manager");
        lead.setEmail("john.doe@example.com");
        lead.setCountry("India");
        lead.setPhoneNumber("   ");

        Set<ConstraintViolation<LeadDTO>> violations = validator.validate(lead);
        assertFalse(violations.isEmpty(), "Phone number with only spaces should have validation errors");
    }

    @Test
    public void testRequiredFieldsEmpty() {
        LeadDTO lead = new LeadDTO();
        // Leave all required fields empty

        Set<ConstraintViolation<LeadDTO>> violations = validator.validate(lead);
        assertFalse(violations.isEmpty(), "Empty required fields should have validation errors");
        
        // Should have errors for firstName, lastName, companyName, designation, email, country
        assertTrue(violations.size() >= 6, "Should have at least 6 validation errors for required fields");
    }
}