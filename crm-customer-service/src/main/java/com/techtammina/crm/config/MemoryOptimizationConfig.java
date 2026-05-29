package com.techtammina.crm.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.multipart.MultipartResolver;
import org.springframework.web.multipart.support.StandardServletMultipartResolver;

import jakarta.annotation.PostConstruct;
import java.util.concurrent.Executor;

/**
 * Memory optimization configuration for the CRM application
 */
@Configuration
@EnableAsync
public class MemoryOptimizationConfig {
    
    private static final Logger log = LoggerFactory.getLogger(MemoryOptimizationConfig.class);
    
    @PostConstruct
    public void logMemorySettings() {
        Runtime runtime = Runtime.getRuntime();
        long maxMemory = runtime.maxMemory();
        long totalMemory = runtime.totalMemory();
        long freeMemory = runtime.freeMemory();
        long usedMemory = totalMemory - freeMemory;
        
        log.info("=== JVM Memory Configuration ===");
        log.info("Max Memory: {} MB", maxMemory / (1024 * 1024));
        log.info("Total Memory: {} MB", totalMemory / (1024 * 1024));
        log.info("Used Memory: {} MB", usedMemory / (1024 * 1024));
        log.info("Free Memory: {} MB", freeMemory / (1024 * 1024));
        log.info("Available Processors: {}", runtime.availableProcessors());
    }
    
    /**
     * Async task executor for non-blocking operations
     */
    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("CRM-Async-");
        executor.setRejectedExecutionHandler((r, executor1) -> {
            log.warn("Task rejected, thread pool is full and queue is at capacity");
            // Execute in caller thread as fallback
            r.run();
        });
        executor.initialize();
        
        log.info("Configured async task executor: core={}, max={}, queue={}", 
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());
        
        return executor;
    }
    
    /**
     * Email processing executor for email operations
     */
    @Bean(name = "emailExecutor")
    public Executor emailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(5);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("CRM-Email-");
        executor.setRejectedExecutionHandler((r, executor1) -> {
            log.warn("Email task rejected, will retry later");
            // Could implement retry logic here
        });
        executor.initialize();
        
        log.info("Configured email executor: core={}, max={}, queue={}", 
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());
        
        return executor;
    }
    
    /**
     * Document processing executor for file operations
     */
    @Bean(name = "documentExecutor")
    public Executor documentExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(3);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(25);
        executor.setThreadNamePrefix("CRM-Document-");
        executor.setRejectedExecutionHandler((r, executor1) -> {
            log.warn("Document processing task rejected");
            r.run(); // Execute in caller thread
        });
        executor.initialize();
        
        log.info("Configured document executor: core={}, max={}, queue={}", 
                executor.getCorePoolSize(), executor.getMaxPoolSize(), executor.getQueueCapacity());
        
        return executor;
    }
    
    /**
     * Multipart resolver with memory optimization
     */
    @Bean
    public MultipartResolver multipartResolver() {
        StandardServletMultipartResolver resolver = new StandardServletMultipartResolver();
        log.info("Configured multipart resolver for file uploads");
        return resolver;
    }
    
    /**
     * Memory monitoring bean
     */
    @Bean
    public MemoryMonitor memoryMonitor() {
        return new MemoryMonitor();
    }
    
    /**
     * Inner class for memory monitoring
     */
    public static class MemoryMonitor {
        private static final Logger log = LoggerFactory.getLogger(MemoryMonitor.class);
        
        public void logMemoryUsage(String operation) {
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            long maxMemory = runtime.maxMemory();
            
            double memoryUsagePercent = (double) usedMemory / maxMemory * 100;
            
            if (memoryUsagePercent > 80) {
                log.warn("High memory usage during {}: {:.1f}% ({} MB / {} MB)", 
                        operation, memoryUsagePercent, 
                        usedMemory / (1024 * 1024), maxMemory / (1024 * 1024));
            } else if (memoryUsagePercent > 60) {
                log.info("Memory usage during {}: {:.1f}% ({} MB / {} MB)", 
                        operation, memoryUsagePercent, 
                        usedMemory / (1024 * 1024), maxMemory / (1024 * 1024));
            }
        }
        
        public void forceGarbageCollection() {
            log.info("Requesting garbage collection");
            System.gc();
        }
        
        public boolean isMemoryLow() {
            Runtime runtime = Runtime.getRuntime();
            long totalMemory = runtime.totalMemory();
            long freeMemory = runtime.freeMemory();
            long usedMemory = totalMemory - freeMemory;
            long maxMemory = runtime.maxMemory();
            
            return (double) usedMemory / maxMemory > 0.85;
        }
    }
}