package com.techtammina.crm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.lang.management.ManagementFactory;
import java.lang.management.MemoryMXBean;
import java.lang.management.MemoryUsage;

/**
 * Service for monitoring memory usage and providing alerts
 */
@Service
public class MemoryMonitoringService {
    
    private static final Logger log = LoggerFactory.getLogger(MemoryMonitoringService.class);
    
    private final MemoryMXBean memoryBean = ManagementFactory.getMemoryMXBean();
    
    /**
     * Monitor memory usage every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    public void monitorMemoryUsage() {
        try {
            MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
            MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();
            
            long heapUsed = heapUsage.getUsed();
            long heapMax = heapUsage.getMax();
            long nonHeapUsed = nonHeapUsage.getUsed();
            long nonHeapMax = nonHeapUsage.getMax();
            
            double heapUsagePercent = (double) heapUsed / heapMax * 100;
            double nonHeapUsagePercent = nonHeapMax > 0 ? (double) nonHeapUsed / nonHeapMax * 100 : 0;
            
            // Log memory usage
            log.debug("Memory Usage - Heap: {:.1f}% ({} MB / {} MB), Non-Heap: {:.1f}% ({} MB / {} MB)",
                    heapUsagePercent, heapUsed / (1024 * 1024), heapMax / (1024 * 1024),
                    nonHeapUsagePercent, nonHeapUsed / (1024 * 1024), 
                    nonHeapMax > 0 ? nonHeapMax / (1024 * 1024) : 0);
            
            // Alert on high memory usage
            if (heapUsagePercent > 85) {
                log.warn("HIGH MEMORY USAGE ALERT: Heap usage at {:.1f}% ({} MB / {} MB)",
                        heapUsagePercent, heapUsed / (1024 * 1024), heapMax / (1024 * 1024));
                
                // Suggest garbage collection
                if (heapUsagePercent > 90) {
                    log.warn("CRITICAL MEMORY USAGE: Requesting garbage collection");
                    System.gc();
                }
            }
            
            if (nonHeapUsagePercent > 80 && nonHeapMax > 0) {
                log.warn("HIGH NON-HEAP MEMORY USAGE: {:.1f}% ({} MB / {} MB)",
                        nonHeapUsagePercent, nonHeapUsed / (1024 * 1024), nonHeapMax / (1024 * 1024));
            }
            
        } catch (Exception e) {
            log.error("Error monitoring memory usage", e);
        }
    }
    
    /**
     * Get current memory status
     */
    public MemoryStatus getCurrentMemoryStatus() {
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        MemoryUsage nonHeapUsage = memoryBean.getNonHeapMemoryUsage();
        
        return new MemoryStatus(
                heapUsage.getUsed(),
                heapUsage.getMax(),
                nonHeapUsage.getUsed(),
                nonHeapUsage.getMax()
        );
    }
    
    /**
     * Check if memory usage is critical
     */
    public boolean isMemoryCritical() {
        MemoryUsage heapUsage = memoryBean.getHeapMemoryUsage();
        double heapUsagePercent = (double) heapUsage.getUsed() / heapUsage.getMax() * 100;
        return heapUsagePercent > 90;
    }
    
    /**
     * Force garbage collection with logging
     */
    public void forceGarbageCollection(String reason) {
        log.info("Forcing garbage collection - Reason: {}", reason);
        long beforeUsed = memoryBean.getHeapMemoryUsage().getUsed();
        
        System.gc();
        
        // Wait a bit for GC to complete
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        long afterUsed = memoryBean.getHeapMemoryUsage().getUsed();
        long freed = beforeUsed - afterUsed;
        
        log.info("Garbage collection completed - Freed: {} MB", freed / (1024 * 1024));
    }
    
    /**
     * Memory status data class
     */
    public static class MemoryStatus {
        private final long heapUsed;
        private final long heapMax;
        private final long nonHeapUsed;
        private final long nonHeapMax;
        
        public MemoryStatus(long heapUsed, long heapMax, long nonHeapUsed, long nonHeapMax) {
            this.heapUsed = heapUsed;
            this.heapMax = heapMax;
            this.nonHeapUsed = nonHeapUsed;
            this.nonHeapMax = nonHeapMax;
        }
        
        public double getHeapUsagePercent() {
            return (double) heapUsed / heapMax * 100;
        }
        
        public double getNonHeapUsagePercent() {
            return nonHeapMax > 0 ? (double) nonHeapUsed / nonHeapMax * 100 : 0;
        }
        
        public long getHeapUsedMB() {
            return heapUsed / (1024 * 1024);
        }
        
        public long getHeapMaxMB() {
            return heapMax / (1024 * 1024);
        }
        
        public long getNonHeapUsedMB() {
            return nonHeapUsed / (1024 * 1024);
        }
        
        public long getNonHeapMaxMB() {
            return nonHeapMax / (1024 * 1024);
        }
        
        public boolean isCritical() {
            return getHeapUsagePercent() > 90;
        }
        
        public boolean isHigh() {
            return getHeapUsagePercent() > 80;
        }
    }
}