package com.techtammina.crm.service;

import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SettingsService {

    public Map<String, Object> getSettingsForRole(String role) {
        Map<String, Object> settings = new HashMap<>();
        List<Map<String, Object>> options = new ArrayList<>();
        
        String normalizedRole = role.toLowerCase().replace(" ", "_");

        switch (normalizedRole) {
            case "sales_executive":
                options.add(createOption("personal_details", "Update Personal Details", "Manage your name, contact information, and phone number", "user"));
                options.add(createOption("change_password", "Change Password", "Update your account password for security", "lock"));
                break;

            case "sales_manager":
                options.add(createOption("team_reports", "Team Performance Reports", "View and manage team performance analytics", "chart-bar"));
                options.add(createOption("profile", "Update Profile", "Manage your profile information and details", "user"));
                options.add(createOption("change_password", "Change Password", "Update your account password for security", "lock"));
                break;

            case "sales_vp":
                options.add(createOption("user_roles", "User Roles & Permissions", "Manage user access levels and permissions", "users"));
                options.add(createOption("system_settings", "System-wide Settings", "Configure global system preferences and policies", "settings"));
                options.add(createOption("analytics_access", "Analytics Access Control", "Control access to analytics and reporting features", "chart-line"));
                options.add(createOption("change_password", "Change Password", "Update your account password for security", "lock"));
                break;

            default:
                // Fallback for unknown roles - minimal access
                options.add(createOption("change_password", "Change Password", "Update your account password for security", "lock"));
                break;
        }

        settings.put("role", normalizedRole);
        settings.put("originalRole", role);
        settings.put("options", options);
        settings.put("timestamp", System.currentTimeMillis());
        settings.put("optionsCount", options.size());

        return settings;
    }

    public boolean canAccessRole(String userRole, String requestedRole) {
        if (userRole == null || requestedRole == null) {
            return false;
        }
        
        String normalizedUserRole = userRole.toLowerCase().replace(" ", "_");
        String normalizedRequestedRole = requestedRole.toLowerCase().replace(" ", "_");
        
        // Users can only access settings for their own role
        // Exception: Sales VP can access all roles for administrative purposes
        if ("sales_vp".equals(normalizedUserRole)) {
            return true; // VP can access any role's settings
        }
        
        return normalizedUserRole.equals(normalizedRequestedRole);
    }

    private Map<String, Object> createOption(String key, String title, String description, String icon) {
        Map<String, Object> option = new HashMap<>();
        option.put("key", key);
        option.put("title", title);
        option.put("description", description);
        option.put("icon", icon);
        option.put("enabled", true);
        return option;
    }
}

