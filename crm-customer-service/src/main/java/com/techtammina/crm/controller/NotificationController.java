package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.entity.Notification;
import com.techtammina.crm.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@Slf4j
public class NotificationController {
    private static final Logger log = LoggerFactory.getLogger(NotificationController.class);

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<Notification>> getUserNotifications(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        log.debug("=== NOTIFICATION CONTROLLER GET ===");
        log.debug("Received userId: {}", userId);
        
        if (userId == null) {
            log.debug("ERROR: userId is null, returning bad request");
            return ResponseEntity.badRequest().build();
        }
        
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        log.debug("Found {} notifications for user {}", notifications.size(), userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        List<Notification> notifications = notificationService.getUnreadNotifications(userId);
        return ResponseEntity.ok(notifications);
    }

    @GetMapping("/count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        log.debug("=== NOTIFICATION COUNT CONTROLLER ===");
        log.debug("Received userId for count: {}", userId);
        
        if (userId == null) {
            log.debug("ERROR: userId is null for count, returning bad request");
            return ResponseEntity.badRequest().build();
        }
        
        long count = notificationService.getUnreadCount(userId);
        log.debug("Unread count for user {}: {}", userId, count);
        
        Map<String, Object> response = new HashMap<>();
        response.put("count", count);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{notificationId}/read")
    public ResponseEntity<Map<String, Object>> markAsRead(@PathVariable Integer notificationId) {
        notificationService.markAsRead(notificationId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/mark-all-read")
    public ResponseEntity<Map<String, Object>> markAllAsRead(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        notificationService.markAllAsRead(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/clear-all")
    public ResponseEntity<Map<String, Object>> clearAllNotifications(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId) {
        if (userId == null) {
            return ResponseEntity.badRequest().build();
        }
        notificationService.clearAllUserNotifications(userId);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/debug/{userId}")
    public ResponseEntity<Map<String, Object>> debugNotifications(@PathVariable Integer userId) {
        log.debug("=== DEBUG ENDPOINT CALLED ===");
        log.debug("Debug userId: {}", userId);
        
        List<Notification> notifications = notificationService.getUserNotifications(userId);
        long count = notificationService.getUnreadCount(userId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("userId", userId);
        response.put("notifications", notifications);
        response.put("count", count);
        response.put("total", notifications.size());
        
        log.debug("Debug response: {}", response);
        return ResponseEntity.ok(response);
    }
}