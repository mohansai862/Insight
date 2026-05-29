package com.techtammina.crm.util;

import org.slf4j.Logger;
import org.slf4j.MDC;

/**
 * Utility class for consistent logging patterns across the CRM application
 */
public class LoggingUtil {
    
    // MDC Keys for structured logging
    public static final String USER_ID = "userId";
    public static final String USER_ROLE = "userRole";
    public static final String OPERATION = "operation";
    public static final String ENTITY_TYPE = "entityType";
    public static final String ENTITY_ID = "entityId";
    public static final String CLIENT_IP = "clientIp";
    
    /**
     * Set user context for logging
     */
    public static void setUserContext(Integer userId, String userRole) {
        if (userId != null) {
            MDC.put(USER_ID, userId.toString());
        }
        if (userRole != null) {
            MDC.put(USER_ROLE, userRole);
        }
    }
    
    /**
     * Set operation context for logging
     */
    public static void setOperationContext(String operation, String entityType, Integer entityId) {
        if (operation != null) {
            MDC.put(OPERATION, operation);
        }
        if (entityType != null) {
            MDC.put(ENTITY_TYPE, entityType);
        }
        if (entityId != null) {
            MDC.put(ENTITY_ID, entityId.toString());
        }
    }
    
    /**
     * Set client IP for security logging
     */
    public static void setClientIp(String clientIp) {
        if (clientIp != null) {
            MDC.put(CLIENT_IP, clientIp);
        }
    }
    
    /**
     * Clear all MDC context
     */
    public static void clearContext() {
        MDC.clear();
    }
    
    /**
     * Log business operation start
     */
    public static void logBusinessOperationStart(Logger logger, String operation, String entityType, Integer entityId) {
        setOperationContext(operation, entityType, entityId);
        logger.info("Starting {} operation for {} with ID: {}", operation, entityType, entityId);
    }
    
    /**
     * Log business operation success
     */
    public static void logBusinessOperationSuccess(Logger logger, String operation, String entityType, Integer entityId) {
        logger.info("Successfully completed {} operation for {} with ID: {}", operation, entityType, entityId);
    }
    
    /**
     * Log business operation failure
     */
    public static void logBusinessOperationFailure(Logger logger, String operation, String entityType, Integer entityId, Exception e) {
        logger.error("Failed {} operation for {} with ID: {}", operation, entityType, entityId, e);
    }
    
    /**
     * Log security event
     */
    public static void logSecurityEvent(Logger logger, String event, String username, String clientIp, boolean success) {
        setClientIp(clientIp);
        if (success) {
            logger.info("Security event: {} successful for user: {} from IP: {}", event, username, clientIp);
        } else {
            logger.warn("Security event: {} failed for user: {} from IP: {}", event, username, clientIp);
        }
    }
    
    /**
     * Log performance metrics
     */
    public static void logPerformanceMetric(Logger logger, String operation, long durationMs) {
        if (durationMs > 1000) {
            logger.warn("Slow operation: {} took {}ms", operation, durationMs);
        } else {
            logger.debug("Operation: {} completed in {}ms", operation, durationMs);
        }
    }
    
    /**
     * Log data validation error
     */
    public static void logValidationError(Logger logger, String entityType, String field, String value, String error) {
        logger.warn("Validation error for {}.{}: '{}' - {}", entityType, field, value, error);
    }
    
    /**
     * Log database operation
     */
    public static void logDatabaseOperation(Logger logger, String operation, String table, Integer recordId, boolean success) {
        if (success) {
            logger.debug("Database {}: {} record ID: {}", operation, table, recordId);
        } else {
            logger.error("Database {} failed: {} record ID: {}", operation, table, recordId);
        }
    }
    
    /**
     * Log email operation
     */
    public static void logEmailOperation(Logger logger, String operation, String recipient, String subject, boolean success) {
        if (success) {
            logger.info("Email {}: sent to {} with subject: {}", operation, recipient, subject);
        } else {
            logger.error("Email {} failed: recipient {} with subject: {}", operation, recipient, subject);
        }
    }
    
    /**
     * Log API request
     */
    public static void logApiRequest(Logger logger, String method, String endpoint, Integer userId, String clientIp) {
        setUserContext(userId, null);
        setClientIp(clientIp);
        logger.info("API Request: {} {} by user: {} from IP: {}", method, endpoint, userId, clientIp);
    }
    
    /**
     * Log API response
     */
    public static void logApiResponse(Logger logger, String method, String endpoint, int statusCode, long durationMs) {
        logger.info("API Response: {} {} returned {} in {}ms", method, endpoint, statusCode, durationMs);
    }
}