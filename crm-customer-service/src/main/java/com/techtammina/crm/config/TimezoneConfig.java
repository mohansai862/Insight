package com.techtammina.crm.config;

import org.springframework.context.annotation.Configuration;
import jakarta.annotation.PostConstruct;
import java.util.TimeZone;

@Configuration
public class TimezoneConfig {
    
    @PostConstruct
    public void init() {
        // Set default timezone to IST for the entire application
        TimeZone.setDefault(TimeZone.getTimeZone("Asia/Kolkata"));
    }
}