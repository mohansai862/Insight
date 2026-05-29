package com.techtammina.crm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Logging Health Monitoring Service
 * Monitors log file sizes and system health for production environments
 */
@Service
public class LoggingHealthService {
    
    private static final Logger log = LoggerFactory.getLogger(LoggingHealthService.class);
    
    /**
     * Monitor log file sizes every hour
     */
    @Scheduled(fixedRate = 3600000) // Every hour
    public void monitorLogFiles() {
        try {
            log.debug("Starting log file health check");
            
            String[] logFiles = {
                "logs/crm-application.log",
                "logs/crm-errors.log", 
                "logs/crm-security.log",
                "logs/crm-business.log"
            };
            
            boolean hasIssues = false;
            long totalLogSize = 0;
            
            for (String logFile : logFiles) {
                Path logPath = Paths.get(logFile);
                if (Files.exists(logPath)) {
                    try {
                        long fileSize = Files.size(logPath);
                        totalLogSize += fileSize;
                        
                        // Convert to MB for readability
                        double fileSizeMB = fileSize / (1024.0 * 1024.0);
                        
                        if (fileSizeMB > 80) { // Warn if log file is over 80MB
                            log.warn("Log file {} is large: {:.1f} MB - consider rotation", logFile, fileSizeMB);
                            hasIssues = true;
                        } else {
                            log.debug("Log file {} size: {:.1f} MB", logFile, fileSizeMB);
                        }
                    } catch (Exception e) {
                        log.error("Failed to check size of log file: {}", logFile, e);
                        hasIssues = true;
                    }
                } else {
                    log.debug("Log file {} does not exist yet", logFile);
                }
            }
            
            // Check logs directory disk space
            File logsDir = new File("logs");
            if (logsDir.exists()) {
                long freeSpace = logsDir.getFreeSpace();
                long totalSpace = logsDir.getTotalSpace();
                double freeSpaceGB = freeSpace / (1024.0 * 1024.0 * 1024.0);
                double usagePercent = ((double)(totalSpace - freeSpace) / totalSpace) * 100;
                
                if (usagePercent > 90) {
                    log.error("Disk space critical: {:.1f}% used, {:.1f} GB free", usagePercent, freeSpaceGB);
                    hasIssues = true;
                } else if (usagePercent > 80) {
                    log.warn("Disk space warning: {:.1f}% used, {:.1f} GB free", usagePercent, freeSpaceGB);
                } else {
                    log.debug("Disk space healthy: {:.1f}% used, {:.1f} GB free", usagePercent, freeSpaceGB);
                }
            }
            
            // Summary log
            double totalLogSizeMB = totalLogSize / (1024.0 * 1024.0);
            if (hasIssues) {
                log.warn("Log health check completed with issues - Total log size: {:.1f} MB", totalLogSizeMB);
            } else {
                log.info("Log health check completed successfully - Total log size: {:.1f} MB", totalLogSizeMB);
            }
            
        } catch (Exception e) {
            log.error("Failed to complete log health check", e);
        }
    }
    
    /**
     * Log system health metrics every 30 minutes
     */
    @Scheduled(fixedRate = 1800000) // Every 30 minutes
    public void logSystemHealth() {
        try {
            Runtime runtime = Runtime.getRuntime();
            
            // Memory metrics
            long maxMemory = runtime.maxMemory();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            
            double memoryUsagePercent = (double) usedMemory / maxMemory * 100;
            double maxMemoryMB = maxMemory / (1024.0 * 1024.0);
            double usedMemoryMB = usedMemory / (1024.0 * 1024.0);
            
            // CPU metrics (approximate)
            int availableProcessors = runtime.availableProcessors();
            
            // Log system health
            if (memoryUsagePercent > 85) {
                log.warn("System Health: High memory usage {:.1f}% ({:.1f}/{:.1f} MB), {} CPUs available", 
                        memoryUsagePercent, usedMemoryMB, maxMemoryMB, availableProcessors);
            } else if (memoryUsagePercent > 70) {
                log.info("System Health: Memory usage {:.1f}% ({:.1f}/{:.1f} MB), {} CPUs available", 
                        memoryUsagePercent, usedMemoryMB, maxMemoryMB, availableProcessors);
            } else {
                log.debug("System Health: Memory usage {:.1f}% ({:.1f}/{:.1f} MB), {} CPUs available", 
                         memoryUsagePercent, usedMemoryMB, maxMemoryMB, availableProcessors);
            }
            
            // Trigger GC if memory usage is high
            if (memoryUsagePercent > 80) {
                log.info("System Health: Triggering garbage collection due to high memory usage");
                System.gc();
            }
            
        } catch (Exception e) {
            log.error("Failed to log system health metrics", e);
        }
    }
    
    /**
     * Daily log rotation check
     */
    @Scheduled(cron = "0 0 2 * * ?") // Every day at 2 AM
    public void dailyLogMaintenance() {
        try {
            log.info("Starting daily log maintenance");
            
            // Check for old archived logs
            File archivedDir = new File("logs/archived");
            if (archivedDir.exists() && archivedDir.isDirectory()) {
                File[] archivedFiles = archivedDir.listFiles();
                if (archivedFiles != null) {
                    long totalArchivedSize = 0;
                    int fileCount = 0;
                    
                    for (File file : archivedFiles) {
                        if (file.isFile()) {
                            totalArchivedSize += file.length();
                            fileCount++;
                        }
                    }
                    
                    double totalArchivedSizeMB = totalArchivedSize / (1024.0 * 1024.0);
                    log.info("Daily maintenance: {} archived log files, total size: {:.1f} MB", 
                            fileCount, totalArchivedSizeMB);
                    
                    if (totalArchivedSizeMB > 1000) { // Warn if archived logs exceed 1GB
                        log.warn("Archived logs are large: {:.1f} MB - consider cleanup", totalArchivedSizeMB);
                    }
                }
            }
            
            log.info("Daily log maintenance completed");
            
        } catch (Exception e) {
            log.error("Failed to complete daily log maintenance", e);
        }
    }
}