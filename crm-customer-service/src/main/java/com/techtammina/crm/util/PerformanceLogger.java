package com.techtammina.crm.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Performance logging utility for tracking execution times and resource usage
 */
@Component
public class PerformanceLogger {
    
    private static final Logger log = LoggerFactory.getLogger(PerformanceLogger.class);
    
    /**
     * Log execution time for an operation
     */
    public void logExecutionTime(String operation, long startTime, Object... context) {
        long duration = System.currentTimeMillis() - startTime;
        
        if (duration > 5000) { // Log as warning if operation takes more than 5 seconds
            log.warn("PERFORMANCE: {} completed in {}ms (SLOW) - context: {}", operation, duration, formatContext(context));
        } else if (duration > 1000) { // Log as info if operation takes more than 1 second
            log.info("PERFORMANCE: {} completed in {}ms - context: {}", operation, duration, formatContext(context));
        } else {
            log.debug("PERFORMANCE: {} completed in {}ms - context: {}", operation, duration, formatContext(context));
        }
    }
    
    /**
     * Log memory usage during bulk operations
     */
    public void logMemoryUsage(String operation, Object... context) {
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        double memoryUsagePercent = (double) usedMemory / maxMemory * 100;
        
        if (memoryUsagePercent > 80) {
            log.warn("MEMORY: {} - High memory usage: {:.1f}% ({} MB used of {} MB max) - context: {}", 
                    operation, memoryUsagePercent, usedMemory / 1024 / 1024, maxMemory / 1024 / 1024, formatContext(context));
        } else if (memoryUsagePercent > 60) {
            log.info("MEMORY: {} - Memory usage: {:.1f}% ({} MB used of {} MB max) - context: {}", 
                    operation, memoryUsagePercent, usedMemory / 1024 / 1024, maxMemory / 1024 / 1024, formatContext(context));
        } else {
            log.debug("MEMORY: {} - Memory usage: {:.1f}% ({} MB used of {} MB max) - context: {}", 
                    operation, memoryUsagePercent, usedMemory / 1024 / 1024, maxMemory / 1024 / 1024, formatContext(context));
        }
    }
    
    /**
     * Log database operation performance
     */
    public void logDatabaseOperation(String operation, long startTime, int recordCount, Object... context) {
        long duration = System.currentTimeMillis() - startTime;
        double recordsPerSecond = recordCount > 0 ? (recordCount * 1000.0) / duration : 0;
        
        if (duration > 2000 || recordsPerSecond < 10) {
            log.warn("DATABASE: {} processed {} records in {}ms ({:.1f} records/sec) (SLOW) - context: {}", 
                    operation, recordCount, duration, recordsPerSecond, formatContext(context));
        } else {
            log.debug("DATABASE: {} processed {} records in {}ms ({:.1f} records/sec) - context: {}", 
                    operation, recordCount, duration, recordsPerSecond, formatContext(context));
        }
    }
    
    /**
     * Start timing an operation
     */
    public long startTiming() {
        return System.currentTimeMillis();
    }
    
    /**
     * Format context parameters for logging
     */
    private String formatContext(Object... context) {
        if (context == null || context.length == 0) {
            return "none";
        }
        
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < context.length; i++) {
            if (i > 0) sb.append(", ");
            sb.append(context[i]);
        }
        return sb.toString();
    }
}