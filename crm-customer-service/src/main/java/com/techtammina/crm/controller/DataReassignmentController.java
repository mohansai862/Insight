package com.techtammina.crm.controller;

import com.techtammina.crm.service.DataReassignmentService;
import com.techtammina.crm.service.UsersService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/reassignment")
public class DataReassignmentController {

    @Autowired
    private DataReassignmentService reassignmentService;
    
    @Autowired
    private UsersService usersService;

    @PostMapping("/transfer")
    public ResponseEntity<?> transferUserData(@RequestBody Map<String, Integer> request) {
        try {
            Integer fromUserId = request.get("fromUserId");
            Integer toUserId = request.get("toUserId");
            
            if (fromUserId == null || toUserId == null) {
                return ResponseEntity.badRequest().body("Both fromUserId and toUserId are required");
            }
            
            reassignmentService.reassignUserData(fromUserId, toUserId);
            reassignmentService.deactivateUser(fromUserId);
            
            return ResponseEntity.ok(Map.of("message", "Data transferred successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/users")
    public ResponseEntity<?> getFilteredUsers(@RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                             @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        try {
            List<com.techtammina.crm.entity.Users> filteredUsers = new java.util.ArrayList<>();
            
            if ("Sales_Manager".equals(userRole)) {
                // Manager sees executives under them
                filteredUsers = usersService.findByManagerIdAndRole(userId, "Sales_Executive");
            } else if ("Sales_VP".equals(userRole)) {
                // VP sees managers under them
                filteredUsers = usersService.findByManagerIdAndRole(userId, "Sales_Manager");
            } else if ("IT_Admin".equals(userRole)) {
                // IT Admin sees all VPs
                filteredUsers = usersService.findByRole("Sales_VP");
            }
            
            return ResponseEntity.ok(filteredUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/to-users")
    public ResponseEntity<?> getToUsers(@RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                       @RequestHeader(value = "X-User-Role", required = false) String userRole,
                                       @RequestParam(value = "excludeUserId", required = false) Integer excludeUserId) {
        try {
            List<com.techtammina.crm.entity.Users> toUsers = new java.util.ArrayList<>();
            
            if ("Sales_Manager".equals(userRole)) {
                // Manager can assign to executives under them only
                toUsers = usersService.findByManagerIdAndRole(userId, "Sales_Executive");
            } else if ("Sales_VP".equals(userRole)) {
                // VP can assign to managers under them only
                toUsers = usersService.findByManagerIdAndRole(userId, "Sales_Manager");
            } else if ("IT_Admin".equals(userRole)) {
                // IT Admin can assign VPs to other VPs (including all VPs)
                toUsers = usersService.findByRole("Sales_VP");
            }
            
            // Filter out the excluded user if specified
            if (excludeUserId != null) {
                toUsers = toUsers.stream()
                    .filter(user -> !user.getUserId().equals(excludeUserId))
                    .collect(java.util.stream.Collectors.toList());
            }
            
            return ResponseEntity.ok(toUsers);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}