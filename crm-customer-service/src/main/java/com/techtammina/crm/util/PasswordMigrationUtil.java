package com.techtammina.crm.util;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Slf4j
public class PasswordMigrationUtil {
    private static final Logger log = LoggerFactory.getLogger(PasswordMigrationUtil.class);
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        log.info("Password Migration Utility started");
        log.info("Use this utility to generate BCrypt hashes");
        log.info("Replace placeholders with actual values in your migration scripts");
        
        try {
            // Generate sample hash for demonstration
            String sampleHash = encoder.encode("sample");
            log.info("SQL Template (replace placeholders with actual values):");
            log.info("UPDATE users SET password = '<hash>' WHERE <condition>;");
            log.info("UPDATE signup SET password = '<hash>' WHERE <condition>;");
            log.info("Sample hash format: {}...", sampleHash.substring(0, 10));
            log.info("Use BCryptPasswordEncoder.encode(password) in your code");
        } catch (Exception e) {
            log.error("Error generating sample hash", e);
        }
    }
}