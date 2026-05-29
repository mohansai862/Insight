package com.techtammina.crm.config;

import com.techtammina.crm.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    
    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    
    private final JwtUtil jwtUtil;
    
    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
            throws ServletException, IOException {
        
        // Skip JWT processing for public endpoints
        String requestPath = request.getRequestURI();
        if (requestPath.startsWith("/api/signup") || 
            requestPath.startsWith("/api/auth/login") ||
            requestPath.startsWith("/api/calls") ||
            requestPath.startsWith("/api/settings") ||
            requestPath.startsWith("/api/users/sales-managers") ||
            requestPath.startsWith("/api/users/sales-vps") ||
            requestPath.startsWith("/api/users/sales-executives") ||
            requestPath.startsWith("/api/quotes") ||
            requestPath.startsWith("/api/products")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String clientIp = getClientIpAddress(request);
            
            try {
                if (jwtUtil.validateToken(token)) {
                    String username = jwtUtil.getUsernameFromToken(token);
                    String role = jwtUtil.getRoleFromToken(token);
                    Integer userId = jwtUtil.getUserIdFromToken(token);
                    
                    // Set authentication context
                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                        username, null, Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    
                    // Add user info to request headers for controllers
                    request.setAttribute("userId", userId);
                    request.setAttribute("userRole", role);
                    
                    log.debug("JWT Authentication successful - user: {} (ID: {}), role: {}, IP: {}, path: {}", 
                             username, userId, role, clientIp, requestPath);
                } else {
                    log.warn("JWT Authentication failed - Invalid token from IP: {}, path: {}", clientIp, requestPath);
                }
            } catch (Exception e) {
                log.error("JWT Authentication error from IP: {}, path: {}", clientIp, requestPath, e);
            }
        } else if (!isPublicEndpoint(requestPath)) {
            String clientIp = getClientIpAddress(request);
            log.debug("No JWT token provided for protected endpoint - IP: {}, path: {}", clientIp, requestPath);
        }
        
        filterChain.doFilter(request, response);
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
    
    private boolean isPublicEndpoint(String requestPath) {
        return requestPath.startsWith("/api/signup") || 
               requestPath.startsWith("/api/auth/login") ||
               requestPath.startsWith("/api/calls") ||
               requestPath.startsWith("/api/settings") ||
               requestPath.startsWith("/api/users/sales-managers") ||
               requestPath.startsWith("/api/users/sales-vps") ||
               requestPath.startsWith("/api/users/sales-executives") ||
               requestPath.startsWith("/api/quotes") ||
               requestPath.startsWith("/api/products");
    }
}

