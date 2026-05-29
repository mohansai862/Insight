package com.techtammina.crm.util;

public class LeadValidationUtil {
    
    public static boolean isValidEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return false;
        }
        return email.contains("@") && email.contains(".");
    }
    
    public static boolean isValidPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.trim().isEmpty()) {
            return true;
        }
        String trimmed = phoneNumber.trim();
        // Check if contains any letters
        for (char c : trimmed.toCharArray()) {
            if (Character.isLetter(c)) {
                return false;
            }
        }
        return true;
    }
    
    public static boolean isValidName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return true;
        }
        String trimmed = name.trim();
        // Check if contains any numbers
        for (char c : trimmed.toCharArray()) {
            if (Character.isDigit(c)) {
                return false;
            }
        }
        return true;
    }
    

    
    public static boolean isValidCompanyName(String companyName) {
        return companyName == null || companyName.trim().length() <= 150;
    }
    
    public static String validateAndGetError(String firstName, String lastName, String email, String phoneNumber, String companyName) {
        if (firstName != null && !firstName.trim().isEmpty() && !isValidName(firstName)) {
            return "Invalid first name format. Only letters, spaces, hyphens and dots are allowed.";
        }
        
        if (lastName != null && !lastName.trim().isEmpty() && !isValidName(lastName)) {
            return "Invalid last name format. Only letters, spaces, hyphens and dots are allowed.";
        }
        
        if (email != null && !email.trim().isEmpty() && !isValidEmail(email)) {
            return "Invalid email format.";
        }
        
        if (phoneNumber != null && !phoneNumber.trim().isEmpty() && !isValidPhoneNumber(phoneNumber)) {
            return "Invalid phone number format. Text like 'dfghdsgfs' is not allowed. Only numbers, spaces, hyphens, parentheses and + are allowed.";
        }
        
        if (companyName != null && !companyName.trim().isEmpty() && !isValidCompanyName(companyName)) {
            return "Invalid company name. Maximum 150 characters allowed.";
        }
        
        return null; // No validation errors
    }
}

