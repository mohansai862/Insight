package com.techtammina.crm.exception;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.validation.FieldError;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex, HttpServletRequest request) {
        if (isDocumentEndpoint(request)) {
            return null;
        }
        
        String errorId = UUID.randomUUID().toString().substring(0, 8);
        String uri = request.getRequestURI();
        String method = request.getMethod();
        
        log.error("Runtime exception [{}] on {} {}: {}", errorId, method, uri, ex.getMessage(), ex);
        
        Map<String, String> error = new HashMap<>();
        
        // Check for duplicate email constraint in runtime exceptions too
        String message = ex.getMessage();
        if (message != null && (message.contains("contacts.email") || 
                               (message.contains("Duplicate entry") && message.contains("email")))) {
            error.put("message", "Email already exists");
        } else {
            error.put("message", ex.getMessage());
        }
        
        error.put("errorId", errorId);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception ex, HttpServletRequest request) {
        if (isDocumentEndpoint(request)) {
            return null;
        }
        
        String errorId = UUID.randomUUID().toString().substring(0, 8);
        String uri = request.getRequestURI();
        String method = request.getMethod();
        
        log.error("Unexpected exception [{}] on {} {}: {}", errorId, method, uri, ex.getMessage(), ex);
        
        Map<String, String> error = new HashMap<>();
        
        // Check for duplicate email constraint in any exception message
        String message = ex.getMessage();
        if (message != null && (message.contains("contacts.email") || 
                               (message.contains("Duplicate entry") && message.contains("email")))) {
            error.put("message", "Email already exists");
        } else {
            error.put("message", "An error occurred: " + ex.getMessage());
        }
        
        error.put("errorId", errorId);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String errorId = UUID.randomUUID().toString().substring(0, 8);
        String uri = request.getRequestURI();
        
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        
        log.warn("Validation error [{}] on {}: {}", errorId, uri, fieldErrors);
        
        Map<String, Object> error = new HashMap<>();
        error.put("message", "Validation failed");
        error.put("errors", fieldErrors);
        error.put("errorId", errorId);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrityViolation(DataIntegrityViolationException ex, HttpServletRequest request) {
        String errorId = UUID.randomUUID().toString().substring(0, 8);
        String uri = request.getRequestURI();
        
        log.error("Data integrity violation [{}] on {}: {}", errorId, uri, ex.getMessage(), ex);
        
        Map<String, String> error = new HashMap<>();
        
        // Handle specific constraint violations - check multiple patterns
        String message = ex.getMessage();
        if (message != null && (message.contains("contacts.email") || 
                               message.contains("Duplicate entry") && message.contains("email"))) {
            error.put("message", "Email already exists");
        } else {
            error.put("message", "Data integrity constraint violation");
        }
        
        error.put("errorId", errorId);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        String errorId = UUID.randomUUID().toString().substring(0, 8);
        String uri = request.getRequestURI();
        String userAgent = request.getHeader("User-Agent");
        String remoteAddr = request.getRemoteAddr();
        
        log.warn("Access denied [{}] on {} from {} ({}): {}", errorId, uri, remoteAddr, userAgent, ex.getMessage());
        
        Map<String, String> error = new HashMap<>();
        error.put("message", "Access denied");
        error.put("errorId", errorId);
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleAsyncRequestNotUsable(AsyncRequestNotUsableException ex, HttpServletRequest request) {
        // Client aborted the request (navigated away, closed tab, etc.)
        // This is normal behavior, log at DEBUG level only
        log.debug("Client aborted request on {} {}", request.getMethod(), request.getRequestURI());
        // Don't return a response - connection is already closed
    }

    private boolean isDocumentEndpoint(HttpServletRequest request) {
        String uri = request.getRequestURI();
        return uri.contains("/documents/view/") || uri.contains("/documents/") && request.getMethod().equals("GET");
    }
}
