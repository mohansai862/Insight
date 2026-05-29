package com.techtammina.crm.controller;

import com.techtammina.crm.dto.*;
import com.techtammina.crm.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private static final Logger log = LoggerFactory.getLogger(AuthController.class);
    private final AuthService authService;
    
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIpAddress(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        
        log.info("Login attempt for email: {} from IP: {} ({})", request.getEmail(), clientIp, userAgent);
        
        try {
            LoginResponse response = authService.login(request);
            log.info("Login successful for user: {} (ID: {}) from IP: {}", response.getUsername(), response.getUserId(), clientIp);
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            if (e.getStatusCode().value() == 428 && "FIRST_LOGIN_PASSWORD_RESET_REQUIRED".equals(e.getReason())) {
                log.info("First login password reset required for email: {} from IP: {}", request.getEmail(), clientIp);
                Map<String, String> response = new HashMap<>();
                response.put("message", "FIRST_LOGIN_PASSWORD_RESET_REQUIRED");
                return ResponseEntity.status(428).body(response);
            }
            if (e.getStatusCode().value() == 403) {
                log.warn("Login failed for email: {} from IP: {} - {}", request.getEmail(), clientIp, e.getReason());
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("message", e.getReason());
                return ResponseEntity.status(403).body(errorResponse);
            }
            log.warn("Login failed for email: {} from IP: {} - {}", request.getEmail(), clientIp, e.getReason());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during login for email: {} from IP: {}", request.getEmail(), clientIp, e);
            throw e;
        }
    }
    
    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIpAddress(httpRequest);
        
        log.info("Password reset requested for email: {} from IP: {}", request.getEmail(), clientIp);
        
        try {
            authService.sendPasswordResetOtp(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "OTP sent to your email address");
            log.info("Password reset OTP sent successfully for email: {}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            log.warn("Password reset failed for email: {} from IP: {} - {}", request.getEmail(), clientIp, e.getReason());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getReason());
            return ResponseEntity.status(e.getStatusCode()).body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error during password reset for email: {} from IP: {}", request.getEmail(), clientIp, e);
            throw e;
        }
    }
    
    @PostMapping("/verify-otp")
    public ResponseEntity<Map<String, String>> verifyOtp(@Valid @RequestBody VerifyOtpRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIpAddress(httpRequest);
        
        log.info("OTP verification attempt for email: {} from IP: {}", request.getEmail(), clientIp);
        
        try {
            authService.verifyOtp(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "OTP verified successfully");
            log.info("OTP verified successfully for email: {}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            log.warn("OTP verification failed for email: {} from IP: {} - {}", request.getEmail(), clientIp, e.getReason());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during OTP verification for email: {} from IP: {}", request.getEmail(), clientIp, e);
            throw e;
        }
    }
    
    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@Valid @RequestBody ResetPasswordRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIpAddress(httpRequest);
        
        log.info("Password reset attempt for email: {} from IP: {}", request.getEmail(), clientIp);
        
        try {
            authService.resetPassword(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password reset successfully");
            log.info("Password reset completed successfully for email: {}", request.getEmail());
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            log.warn("Password reset failed for email: {} from IP: {} - {}", request.getEmail(), clientIp, e.getReason());
            throw e;
        } catch (Exception e) {
            log.error("Unexpected error during password reset for email: {} from IP: {}", request.getEmail(), clientIp, e);
            throw e;
        }
    }
    
    @PostMapping("/first-login-reset-password")
    public ResponseEntity<Map<String, String>> firstLoginResetPassword(@Valid @RequestBody FirstLoginPasswordResetRequest request, HttpServletRequest httpRequest) {
        String clientIp = getClientIpAddress(httpRequest);
        
        log.info("First login password reset attempt for identifier: {} from IP: {}", request.getIdentifier(), clientIp);
        
        try {
            authService.resetFirstLoginPassword(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password updated successfully. You can now login with your new password.");
            log.info("First login password reset completed successfully for identifier: {}", request.getIdentifier());
            return ResponseEntity.ok(response);
        } catch (ResponseStatusException e) {
            log.warn("First login password reset failed for identifier: {} from IP: {} - {}", request.getIdentifier(), clientIp, e.getReason());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getReason());
            return ResponseEntity.status(e.getStatusCode()).body(errorResponse);
        } catch (Exception e) {
            log.error("Unexpected error during first login password reset for identifier: {} from IP: {}", request.getIdentifier(), clientIp, e);
            throw e;
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
}

