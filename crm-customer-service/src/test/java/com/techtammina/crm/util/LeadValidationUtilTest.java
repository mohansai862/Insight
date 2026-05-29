package com.techtammina.crm.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

public class LeadValidationUtilTest {

    @Test
    public void testValidEmail() {
        assertTrue(LeadValidationUtil.isValidEmail("test@example.com"));
        assertTrue(LeadValidationUtil.isValidEmail("user.name@domain.co.uk"));
        assertFalse(LeadValidationUtil.isValidEmail("invalid-email"));
        assertFalse(LeadValidationUtil.isValidEmail("@domain.com"));
        assertFalse(LeadValidationUtil.isValidEmail("user@"));
    }

    @Test
    public void testValidPhoneNumber() {
        assertTrue(LeadValidationUtil.isValidPhoneNumber("1234567890"));
        assertTrue(LeadValidationUtil.isValidPhoneNumber("+1-234-567-8900"));
        assertTrue(LeadValidationUtil.isValidPhoneNumber("(123) 456-7890"));
        assertFalse(LeadValidationUtil.isValidPhoneNumber("dfghdsgfs"));
        assertFalse(LeadValidationUtil.isValidPhoneNumber("123abc"));
    }

    @Test
    public void testValidName() {
        assertTrue(LeadValidationUtil.isValidName("John"));
        assertTrue(LeadValidationUtil.isValidName("Mary Jane"));
        assertTrue(LeadValidationUtil.isValidName("O'Connor"));
        assertTrue(LeadValidationUtil.isValidName("Jean-Pierre"));
        assertFalse(LeadValidationUtil.isValidName("John123"));
        assertFalse(LeadValidationUtil.isValidName("John@Smith"));
    }

    @Test
    public void testValidationErrors() {
        // Test invalid name with numbers
        String error = LeadValidationUtil.validateAndGetError("John123", null, null, null, null);
        assertNotNull(error);
        assertTrue(error.contains("Invalid first name format"));

        // Test invalid phone number
        error = LeadValidationUtil.validateAndGetError(null, null, null, "dfghdsgfs", null);
        assertNotNull(error);
        assertTrue(error.contains("Invalid phone number format"));

        // Test invalid email
        error = LeadValidationUtil.validateAndGetError(null, null, "invalid-email", null, null);
        assertNotNull(error);
        assertTrue(error.contains("Invalid email format"));

        // Test valid data
        error = LeadValidationUtil.validateAndGetError("John", "Doe", "john@example.com", "1234567890", "TechCorp");
        assertNull(error);
    }
}