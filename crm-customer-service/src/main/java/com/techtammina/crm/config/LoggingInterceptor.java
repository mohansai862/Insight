package com.techtammina.crm.config;

import com.techtammina.crm.util.LoggingUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor for automatic API request/response logging
 */
@Component
public class LoggingInterceptor implements HandlerInterceptor {
    
    private static final Logger log = LoggerFactory.getLogger(LoggingInterceptor.class);
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        long startTime = System.currentTimeMillis();
        request.setAttribute("startTime", startTime);
        
        String method = request.getMethod();
        String uri = request.getRequestURI();
        String clientIp = getClientIpAddress(request);
        Integer userId = (Integer) request.getAttribute("userId");
        
        // Skip logging for health checks and static resources
        if (shouldSkipLogging(uri)) {
            return true;
        }
        
        LoggingUtil.logApiRequest(log, method, uri, userId, clientIp);
        
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        Long startTime = (Long) request.getAttribute("startTime");
        if (startTime == null) {
            return;
        }
        
        long duration = System.currentTimeMillis() - startTime;
        String method = request.getMethod();
        String uri = request.getRequestURI();
        int statusCode = response.getStatus();
        
        // Skip logging for health checks and static resources
        if (shouldSkipLogging(uri)) {
            return;
        }
        
        LoggingUtil.logApiResponse(log, method, uri, statusCode, duration);
        
        if (ex != null) {
            log.error("Request completed with exception: {} {}", method, uri, ex);
        }
        
        // Log slow requests
        if (duration > 1000) {
            log.warn("Slow API request: {} {} took {}ms", method, uri, duration);
        } else if (duration > 500) {
            log.info("Moderate API request: {} {} took {}ms", method, uri, duration);
        }
        
        // Clear logging context
        LoggingUtil.clearContext();
    }
    
    private boolean shouldSkipLogging(String uri) {
        return uri.contains("/actuator/") || 
               uri.contains("/health") || 
               uri.endsWith(".css") || 
               uri.endsWith(".js") || 
               uri.endsWith(".png") || 
               uri.endsWith(".jpg") || 
               uri.endsWith(".ico");
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
}