package com.techtammina.crm.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * HTTP Request Logging Interceptor
 * Logs all HTTP requests with timing and response status
 */
@Component
public class RequestLoggingInterceptor implements HandlerInterceptor {
    
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingInterceptor.class);
    private static final String START_TIME_ATTRIBUTE = "startTime";
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Skip logging for static resources and health checks
        String requestPath = request.getRequestURI();
        if (shouldSkipLogging(requestPath)) {
            return true;
        }
        
        long startTime = System.currentTimeMillis();
        request.setAttribute(START_TIME_ATTRIBUTE, startTime);
        
        String clientIp = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        String method = request.getMethod();
        
        // Log request start
        log.debug("HTTP Request started - {} {} from {} ({})", method, requestPath, clientIp, 
                 userAgent != null ? userAgent.substring(0, Math.min(50, userAgent.length())) : "unknown");
        
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String requestPath = request.getRequestURI();
        if (shouldSkipLogging(requestPath)) {
            return;
        }
        
        Long startTime = (Long) request.getAttribute(START_TIME_ATTRIBUTE);
        if (startTime != null) {
            long duration = System.currentTimeMillis() - startTime;
            String method = request.getMethod();
            int status = response.getStatus();
            String clientIp = getClientIpAddress(request);
            
            // Log based on response status and duration
            if (status >= 500) {
                log.error("HTTP Request completed - {} {} from {} - Status: {} in {}ms (SERVER ERROR)", 
                         method, requestPath, clientIp, status, duration);
            } else if (status >= 400) {
                log.warn("HTTP Request completed - {} {} from {} - Status: {} in {}ms (CLIENT ERROR)", 
                        method, requestPath, clientIp, status, duration);
            } else if (duration > 5000) {
                log.warn("HTTP Request completed - {} {} from {} - Status: {} in {}ms (SLOW)", 
                        method, requestPath, clientIp, status, duration);
            } else if (duration > 1000) {
                log.info("HTTP Request completed - {} {} from {} - Status: {} in {}ms", 
                        method, requestPath, clientIp, status, duration);
            } else {
                log.debug("HTTP Request completed - {} {} from {} - Status: {} in {}ms", 
                         method, requestPath, clientIp, status, duration);
            }
            
            // Log exception if present
            if (ex != null) {
                log.error("HTTP Request failed - {} {} from {} - Exception: {}", 
                         method, requestPath, clientIp, ex.getMessage(), ex);
            }
        }
    }
    
    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        
        return request.getRemoteAddr();
    }
    
    private boolean shouldSkipLogging(String requestPath) {
        return requestPath.startsWith("/static/") ||
               requestPath.startsWith("/assets/") ||
               requestPath.startsWith("/favicon.ico") ||
               requestPath.startsWith("/actuator/health") ||
               requestPath.endsWith(".css") ||
               requestPath.endsWith(".js") ||
               requestPath.endsWith(".png") ||
               requestPath.endsWith(".jpg") ||
               requestPath.endsWith(".gif") ||
               requestPath.endsWith(".ico");
    }
}