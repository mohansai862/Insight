package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.entity.Activity;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.Account;
import com.techtammina.crm.entity.Contact;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.ActivityRepository;
import com.techtammina.crm.repository.DealRepository;
import com.techtammina.crm.repository.AccountRepository;
import com.techtammina.crm.repository.ContactRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reports")
@Slf4j
public class ReportsController {
    private static final Logger log = LoggerFactory.getLogger(ReportsController.class);

    private final DealRepository dealRepository;
    private final ActivityRepository activityRepository;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final UsersRepository usersRepository;

    @Autowired
    public ReportsController(DealRepository dealRepository, ActivityRepository activityRepository,
                           AccountRepository accountRepository, ContactRepository contactRepository,
                           UsersRepository usersRepository) {
        this.dealRepository = dealRepository;
        this.activityRepository = activityRepository;
        this.accountRepository = accountRepository;
        this.contactRepository = contactRepository;
        this.usersRepository = usersRepository;
    }

    @GetMapping("/sales")
    public ResponseEntity<Map<String, Object>> sales(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            HttpServletRequest request
    ) {
        try {
        Integer userId = (Integer) request.getAttribute("userId");
        String userRole = (String) request.getAttribute("userRole");
        
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        boolean filterByDate = (startDate != null && !startDate.isEmpty()) || (endDate != null && !endDate.isEmpty());
        LocalDate start = startDate != null && !startDate.isEmpty() ? LocalDate.parse(startDate) : LocalDate.now().minusYears(100);
        LocalDate end = endDate != null && !endDate.isEmpty() ? LocalDate.parse(endDate) : LocalDate.now().plusYears(100);

        Map<String, Long> byStage;
        BigDecimal totalValue;
        long totalDeals;
        long wonDeals;
        long lostDeals;
        Map<String, Long> dealsPerMonth;

        // Get deals based on hierarchical filtering
        List<Deal> hierarchicalDeals = getDealsForRole(userId, userRole);
        
        if (!filterByDate) {
            // Count deals by stage from hierarchical deals
            byStage = hierarchicalDeals.stream()
                .collect(Collectors.groupingBy(
                    d -> d.getStage() != null ? d.getStage().name() : "Unknown",
                    Collectors.counting()
                ));
            
            totalDeals = hierarchicalDeals.size();
            wonDeals = hierarchicalDeals.stream()
                .mapToLong(d -> d.getStage() == Deal.Stage.Closed_Won ? 1 : 0)
                .sum();
            lostDeals = hierarchicalDeals.stream()
                .mapToLong(d -> d.getStage() == Deal.Stage.Closed_Lost ? 1 : 0)
                .sum();
            
            // Total value only from Closed_Won deals with closed_date
            totalValue = hierarchicalDeals.stream()
                .filter(d -> d.getStage() == Deal.Stage.Closed_Won)
                .filter(d -> d.getClosedDate() != null)
                .filter(d -> d.getDealValue() != null)
                .map(Deal::getDealValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Per-month breakdown - only Closed_Won deals
            dealsPerMonth = hierarchicalDeals.stream()
                .filter(d -> d.getStage() == Deal.Stage.Closed_Won)
                .filter(d -> d.getClosedDate() != null)
                .collect(Collectors.groupingBy(d -> {
                    LocalDate date = d.getClosedDate();
                    return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
                }, Collectors.counting()));
        } else {
            // Filter hierarchical deals by date
            List<Deal> filteredDeals = hierarchicalDeals.stream()
                .filter(d -> {
                    LocalDate dealDate = null;
                    if (d.getClosedDate() != null) {
                        dealDate = d.getClosedDate();
                    } else if (d.getExpectedCloseDate() != null) {
                        dealDate = d.getExpectedCloseDate();
                    } else if (d.getCreatedAt() != null) {
                        dealDate = d.getCreatedAt().toLocalDate();
                    }
                    if (dealDate == null) return false;
                    boolean afterStart = !dealDate.isBefore(start);
                    boolean beforeEnd = !dealDate.isAfter(end);
                    return afterStart && beforeEnd;
                })
                .collect(Collectors.toList());
            
            byStage = filteredDeals.stream()
                .collect(Collectors.groupingBy(
                    d -> d.getStage() != null ? d.getStage().name() : "Unknown",
                    Collectors.counting()
                ));
            
            totalDeals = filteredDeals.size();
            wonDeals = filteredDeals.stream()
                .mapToLong(d -> d.getStage() == Deal.Stage.Closed_Won ? 1 : 0)
                .sum();
            lostDeals = filteredDeals.stream()
                .mapToLong(d -> d.getStage() == Deal.Stage.Closed_Lost ? 1 : 0)
                .sum();
            
            totalValue = filteredDeals.stream()
                .filter(d -> d.getStage() == Deal.Stage.Closed_Won)
                .filter(d -> d.getDealValue() != null)
                .map(Deal::getDealValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            // Group by month using closed_date
            dealsPerMonth = filteredDeals.stream()
                .filter(d -> d.getStage() == Deal.Stage.Closed_Won)
                .filter(d -> d.getClosedDate() != null)
                .collect(Collectors.groupingBy(d -> {
                    LocalDate date = d.getClosedDate();
                    return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
                }, Collectors.counting()));
        }

        double winRate = totalDeals > 0 ? (wonDeals * 100.0 / totalDeals) : 0.0;

        Map<String, Object> result = new HashMap<>();
        result.put("byStage", byStage);
        result.put("totalValue", totalValue);
        result.put("totalDeals", totalDeals);
        result.put("wonDeals", wonDeals);
        result.put("lostDeals", lostDeals);
        result.put("winRate", winRate);
        result.put("dealsPerMonth", dealsPerMonth);
        return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("byStage", new HashMap<>());
            errorResult.put("totalValue", 0);
            errorResult.put("totalDeals", 0);
            errorResult.put("wonDeals", 0);
            errorResult.put("lostDeals", 0);
            errorResult.put("winRate", 0.0);
            errorResult.put("dealsPerMonth", new HashMap<>());
            return ResponseEntity.ok(errorResult);
        }
    }

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> revenue(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        LocalDate start = startDate != null && !startDate.isEmpty() ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null && !endDate.isEmpty() ? LocalDate.parse(endDate) : null;
        
        log.debug("=== REVENUE DATE FILTERING ===");
        log.debug("Start Date: {}, End Date: {}", start, end);
        
        List<Deal> allDeals;
        if ("Sales_Manager".equals(userRole)) {
            allDeals = dealRepository.findByManagerId(userId);
        } else if ("Sales_VP".equals(userRole)) {
            // Get all deals from managers under this VP
            List<Users> managers = usersRepository.findByManagerId(userId);
            allDeals = new ArrayList<>();
            for (Users manager : managers) {
                List<Users> executives = usersRepository.findSalesExecutivesByManagerId(manager.getUserId());
                for (Users exec : executives) {
                    allDeals.addAll(dealRepository.findByCreatedBy(exec));
                }
            }
        } else {
            allDeals = dealRepository.findAll();
        }
        
        // Filter for only Closed_Won deals with closed_date not null for revenue analysis
        List<Deal> deals = allDeals.stream()
            .filter(d -> d.getStage() == Deal.Stage.Closed_Won) // Only Closed_Won deals
            .filter(d -> d.getClosedDate() != null) // Only deals with closed_date
            .filter(d -> d.getDealValue() != null && d.getDealValue().compareTo(BigDecimal.ZERO) > 0)
            .filter(d -> {
                if (start == null && end == null) return true;
                
                LocalDate dealDate = d.getCreatedAt() != null ? d.getCreatedAt().toLocalDate() : 
                                   d.getClosedDate() != null ? d.getClosedDate() : 
                                   d.getExpectedCloseDate() != null ? d.getExpectedCloseDate() : null;
                
                if (dealDate == null) return false;
                
                boolean afterStart = start == null || !dealDate.isBefore(start);
                boolean beforeEnd = end == null || !dealDate.isAfter(end);
                return afterStart && beforeEnd;
            })
            .collect(Collectors.toList());
        
        log.debug("Deals after filter: {}", deals.size());
        
        Map<String, List<Deal>> dealsByMonth = deals.stream()
            .collect(Collectors.groupingBy(d -> {
                LocalDate date = d.getCreatedAt() != null ? d.getCreatedAt().toLocalDate() : 
                               d.getClosedDate() != null ? d.getClosedDate() : 
                               d.getExpectedCloseDate() != null ? d.getExpectedCloseDate() : LocalDate.now();
                return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
            }));
        
        // Generate all months in the date range
        List<Map<String, Object>> revenueData = new ArrayList<>();
        BigDecimal currentRevenue = BigDecimal.ZERO;
        
        if (start != null && end != null) {
            // Generate all months between start and end
            LocalDate current = start.withDayOfMonth(1);
            LocalDate endMonth = end.withDayOfMonth(1);
            
            while (!current.isAfter(endMonth)) {
                String monthKey = current.getYear() + "-" + String.format("%02d", current.getMonthValue());
                List<Deal> monthDeals = dealsByMonth.getOrDefault(monthKey, new ArrayList<>());
                
                BigDecimal monthTotal = monthDeals.stream()
                    .map(Deal::getDealValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                currentRevenue = currentRevenue.add(monthTotal);
                
                Map<String, Object> monthData = new HashMap<>();
                monthData.put("period", monthKey);
                monthData.put("total", monthTotal.doubleValue());
                monthData.put("revenue", monthTotal.doubleValue());
                
                revenueData.add(monthData);
                log.debug("Month: {}, Revenue: ${}", monthKey, monthTotal);
                
                current = current.plusMonths(1);
            }
        } else {
            // No date filter - show last 6 months for VP and Manager
            if ("Sales_VP".equals(userRole) || "Sales_Manager".equals(userRole)) {
                LocalDate vpEndDate = LocalDate.now();
                LocalDate vpStartDate = vpEndDate.minusMonths(6);
                
                LocalDate current = vpStartDate.withDayOfMonth(1);
                LocalDate endMonth = vpEndDate.withDayOfMonth(1);
                
                while (!current.isAfter(endMonth)) {
                    String monthKey = current.getYear() + "-" + String.format("%02d", current.getMonthValue());
                    List<Deal> monthDeals = dealsByMonth.getOrDefault(monthKey, new ArrayList<>());
                    
                    BigDecimal monthTotal = monthDeals.stream()
                        .map(Deal::getDealValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    currentRevenue = currentRevenue.add(monthTotal);
                    
                    Map<String, Object> monthData = new HashMap<>();
                    monthData.put("period", monthKey);
                    monthData.put("total", monthTotal.doubleValue());
                    monthData.put("revenue", monthTotal.doubleValue());
                    
                    revenueData.add(monthData);
                    current = current.plusMonths(1);
                }
            } else {
                // For other roles, return only months with data
                for (Map.Entry<String, List<Deal>> entry : dealsByMonth.entrySet()) {
                    String month = entry.getKey();
                    List<Deal> monthDeals = entry.getValue();
                    
                    BigDecimal monthTotal = monthDeals.stream()
                        .map(Deal::getDealValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                    
                    currentRevenue = currentRevenue.add(monthTotal);
                    
                    Map<String, Object> monthData = new HashMap<>();
                    monthData.put("period", month);
                    monthData.put("total", monthTotal.doubleValue());
                    monthData.put("revenue", monthTotal.doubleValue());
                    
                    revenueData.add(monthData);
                }
                revenueData.sort((a, b) -> ((String) a.get("period")).compareTo((String) b.get("period")));
            }
        }
        
        log.debug("Total months returned: {}", revenueData.size());
        log.debug("=================================");
        
        // Calculate total revenue based on filtered deals for VP
        BigDecimal globalTotalRevenue;
        if ("Sales_VP".equals(userRole)) {
            globalTotalRevenue = deals.stream()
                .filter(d -> d.getDealValue() != null && d.getDealValue().compareTo(BigDecimal.ZERO) > 0)
                .map(Deal::getDealValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        } else {
            globalTotalRevenue = allDeals.stream()
                .filter(d -> d.getDealValue() != null && d.getDealValue().compareTo(BigDecimal.ZERO) > 0)
                .map(Deal::getDealValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
        
        // Calculate VP-specific metrics
        int totalManagers = 0;
        int totalExecutives = 0;
        if ("Sales_VP".equals(userRole)) {
            List<Users> managers = usersRepository.findByManagerId(userId);
            totalManagers = managers.size();
            // Count all executives under all managers
            for (Users manager : managers) {
                totalExecutives += usersRepository.findSalesExecutivesByManagerId(manager.getUserId()).size();
            }
            log.info("=== VP DATA VERIFICATION ===");
            log.info("VP ID: {}", userId);
            log.info("Managers under VP: {}", totalManagers);
            log.info("Total Executives: {}", totalExecutives);
            log.info("Total Revenue: ${}", globalTotalRevenue);
            log.info("Total Deals: {}", deals.size());
            log.info("Avg Revenue per Manager: ${}", totalManagers > 0 ? globalTotalRevenue.divide(BigDecimal.valueOf(totalManagers), 2, BigDecimal.ROUND_HALF_UP) : BigDecimal.ZERO);
            log.info("==============================");
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("revenueData", revenueData);
        result.put("currentRevenue", currentRevenue.doubleValue());
        result.put("totalRevenue", globalTotalRevenue.doubleValue());
        result.put("globalTotalRevenue", globalTotalRevenue.doubleValue());
        result.put("totalDeals", deals.size());
        result.put("totalManagers", totalManagers);
        result.put("totalExecutives", totalExecutives);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sales-executives")
    public ResponseEntity<List<Map<String, Object>>> salesExecutives(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestHeader(value = "X-User-Id", required = false) Integer managerId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        LocalDate start = startDate != null && !startDate.isEmpty() ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null && !endDate.isEmpty() ? LocalDate.parse(endDate) : null;
        if (managerId == null) managerId = 1;
        if (!"Sales_Manager".equals(userRole)) {
            return ResponseEntity.ok(new ArrayList<>());
        }

        // Debug: Check what we're looking for
        log.debug("=== SALES EXECUTIVES QUERY ===");
        log.debug("Manager ID: {}", managerId);
        log.debug("User Role: {}", userRole);
        
        // First try to get executives by manager ID
        List<Users> executives = usersRepository.findSalesExecutivesByManagerId(managerId);
        log.debug("Executives found by manager ID: {}", executives.size());
        
        // If no executives found by manager ID, get all Sales_Executive users
        if (executives.isEmpty()) {
            executives = usersRepository.findByRole("Sales_Executive");
            log.debug("All Sales_Executive users: {}", executives.size());
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Users exec : executives) {
            log.debug("Processing executive: {} {} (ID: {}, Manager ID: {})", 
                exec.getFirstName(), exec.getLastName(), exec.getUserId(), exec.getManagerId());
            
            // Count leads and calculate revenue with date filtering (only Closed_Won deals with closed_date)
            List<Deal> execDeals = dealRepository.findAll().stream()
                .filter(d -> {
                    // Executive gets revenue credit only if they are the current owner (reassignTo takes priority over createdBy)
                    if (d.getReassignTo() != null) {
                        return d.getReassignTo().getUserId().equals(exec.getUserId());
                    } else {
                        return d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(exec.getUserId());
                    }
                })
                .collect(Collectors.toList());
            
            List<Deal> filteredDeals = execDeals.stream()
                .filter(d -> d.getStage() == Deal.Stage.Closed_Won) // Only Closed_Won deals
                .filter(d -> d.getClosedDate() != null) // Only deals with closed_date
                .filter(d -> d.getDealValue() != null && d.getDealValue().compareTo(BigDecimal.ZERO) > 0)
                .filter(d -> {
                    if (start == null && end == null) return true;
                    LocalDate dealDate = d.getClosedDate(); // Use closed_date for revenue analysis
                    if (dealDate == null) return false;
                    boolean afterStart = start == null || !dealDate.isBefore(start);
                    boolean beforeEnd = end == null || !dealDate.isAfter(end);
                    return afterStart && beforeEnd;
                })
                .collect(Collectors.toList());
            
            long leadCount = filteredDeals.size();
            BigDecimal totalRevenue = filteredDeals.stream()
                .map(Deal::getDealValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            log.debug("Executive {} - Leads: {}, Revenue: ${}", exec.getFirstName(), leadCount, totalRevenue);
            
            Map<String, Object> execData = new HashMap<>();
            execData.put("id", exec.getUserId());
            execData.put("firstName", exec.getFirstName());
            execData.put("lastName", exec.getLastName());
            execData.put("email", exec.getEmail());
            execData.put("leadCount", leadCount);
            execData.put("totalRevenue", totalRevenue.doubleValue());
            
            result.add(execData);
        }
        
        log.debug("Total executives returned: {}", result.size());
        log.debug("===============================");
        
        return ResponseEntity.ok()
            .header("Cache-Control", "no-cache, no-store, must-revalidate")
            .header("Pragma", "no-cache")
            .header("Expires", "0")
            .body(result);
    }

    @GetMapping("/manager-revenue-breakdown")
    public ResponseEntity<List<Map<String, Object>>> managerRevenueBreakdown(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        if (userId == null) userId = 1;
        LocalDate start = startDate != null && !startDate.isEmpty() ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null && !endDate.isEmpty() ? LocalDate.parse(endDate) : null;
        
        List<Users> managers;
        if ("Sales_VP".equals(userRole)) {
            // Get only managers under this VP
            managers = usersRepository.findByManagerId(userId);
        } else {
            // For other roles, get all managers
            managers = usersRepository.findByRole("Sales_Manager");
        }
        
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Users manager : managers) {
            List<Users> executives = usersRepository.findSalesExecutivesByManagerId(manager.getUserId());
            BigDecimal managerTotalRevenue = BigDecimal.ZERO;
            List<Map<String, Object>> executiveData = new ArrayList<>();
            
            for (Users exec : executives) {
                BigDecimal execRevenue;
                if (start != null || end != null) {
                    // Filter deals by date range - only Closed_Won deals
                    List<Deal> deals = dealRepository.findAll().stream()
                        .filter(d -> {
                            // Executive gets revenue credit only if they are the current owner (reassignTo takes priority over createdBy)
                            if (d.getReassignTo() != null) {
                                return d.getReassignTo().getUserId().equals(exec.getUserId());
                            } else {
                                return d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(exec.getUserId());
                            }
                        })
                        .filter(d -> d.getStage() == Deal.Stage.Closed_Won) // Only Closed_Won deals
                        .filter(d -> {
                            if (d.getDealValue() == null || d.getDealValue().compareTo(BigDecimal.ZERO) <= 0) return false;
                            LocalDate dealDate = d.getCreatedAt() != null ? d.getCreatedAt().toLocalDate() : 
                                               d.getClosedDate() != null ? d.getClosedDate() : 
                                               d.getExpectedCloseDate();
                            if (dealDate == null) return false;
                            boolean afterStart = start == null || !dealDate.isBefore(start);
                            boolean beforeEnd = end == null || !dealDate.isAfter(end);
                            return afterStart && beforeEnd;
                        })
                        .collect(Collectors.toList());
                    execRevenue = deals.stream()
                        .map(Deal::getDealValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                } else {
                    // Only sum deal values where stage = Closed_Won
                    execRevenue = dealRepository.findAll().stream()
                        .filter(d -> {
                            // Executive gets revenue credit only if they are the current owner (reassignTo takes priority over createdBy)
                            if (d.getReassignTo() != null) {
                                return d.getReassignTo().getUserId().equals(exec.getUserId());
                            } else {
                                return d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(exec.getUserId());
                            }
                        })
                        .filter(d -> d.getStage() == Deal.Stage.Closed_Won)
                        .filter(d -> d.getDealValue() != null && d.getDealValue().compareTo(BigDecimal.ZERO) > 0)
                        .map(Deal::getDealValue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);
                }
                
                managerTotalRevenue = managerTotalRevenue.add(execRevenue);
                
                Map<String, Object> execMap = new HashMap<>();
                execMap.put("id", exec.getUserId());
                execMap.put("name", exec.getFirstName() + " " + exec.getLastName());
                execMap.put("revenue", execRevenue.doubleValue());
                executiveData.add(execMap);
            }
            
            Map<String, Object> managerMap = new HashMap<>();
            managerMap.put("managerId", manager.getUserId());
            managerMap.put("managerName", manager.getFirstName() + " " + manager.getLastName());
            managerMap.put("totalRevenue", managerTotalRevenue.doubleValue());
            managerMap.put("executives", executiveData);
            result.add(managerMap);
        }
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/manager-revenue")
    public ResponseEntity<Map<String, Object>> managerRevenue(
            @RequestParam Integer managerId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Users manager = usersRepository.findById(managerId).orElse(null);
        if (manager == null) {
            return ResponseEntity.ok(Map.of("revenueData", new ArrayList<>(), "totalRevenue", 0));
        }

        LocalDate start = startDate != null && !startDate.isEmpty() ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null && !endDate.isEmpty() ? LocalDate.parse(endDate) : null;
        
        List<Users> executives = usersRepository.findSalesExecutivesByManagerId(managerId);
        List<Deal> allDeals = new ArrayList<>();
        
        for (Users exec : executives) {
            // Get deals where executive is the current owner (reassignTo takes priority over createdBy)
            List<Deal> execDeals = dealRepository.findAll().stream()
                .filter(d -> {
                    if (d.getReassignTo() != null) {
                        return d.getReassignTo().getUserId().equals(exec.getUserId());
                    } else {
                        return d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(exec.getUserId());
                    }
                })
                .collect(Collectors.toList());
            allDeals.addAll(execDeals);
        }
        
        log.info("=== MANAGER REVENUE DEBUG ===");
        log.info("Manager ID: {}", managerId);
        log.info("Total deals from executives: {}", allDeals.size());
        
        // Filter for only Closed_Won deals with closed_date for revenue analysis
        List<Deal> filteredDeals = allDeals.stream()
            .filter(d -> d.getStage() != null && "Closed_Won".equalsIgnoreCase(d.getStage().name())) // Only Closed_Won deals
            .filter(d -> d.getClosedDate() != null) // Only deals with closed_date
            .filter(d -> d.getDealValue() != null && d.getDealValue().compareTo(BigDecimal.ZERO) > 0)
            .filter(d -> {
                if (start == null && end == null) return true;
                LocalDate dealDate = d.getClosedDate(); // Use closed_date for revenue analysis
                if (dealDate == null) return false;
                boolean afterStart = start == null || !dealDate.isBefore(start);
                boolean beforeEnd = end == null || !dealDate.isAfter(end);
                return afterStart && beforeEnd;
            })
            .collect(Collectors.toList());
        
        log.info("Filtered deals: {}", filteredDeals.size());
        
        // Group deals by month using closed_date for revenue analysis
        Map<String, List<Deal>> dealsByMonth = filteredDeals.stream()
            .collect(Collectors.groupingBy(d -> {
                LocalDate date = d.getClosedDate(); // Use closed_date for revenue grouping
                return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
            }));
        
        List<Map<String, Object>> revenueData = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        
        for (Map.Entry<String, List<Deal>> entry : dealsByMonth.entrySet()) {
            String month = entry.getKey();
            List<Deal> monthDeals = entry.getValue();
            
            BigDecimal monthTotal = monthDeals.stream()
                .map(Deal::getDealValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            totalRevenue = totalRevenue.add(monthTotal);
            
            log.info("Month: {}, Deals: {}, Total: ${}", month, monthDeals.size(), monthTotal);
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("period", month);
            monthData.put("total", monthTotal.doubleValue());
            monthData.put("revenue", monthTotal.doubleValue());
            
            revenueData.add(monthData);
        }
        
        log.info("Total Revenue: ${}", totalRevenue);
        log.info("==============================");
        
        revenueData.sort((a, b) -> ((String) a.get("period")).compareTo((String) b.get("period")));
        
        Map<String, Object> result = new HashMap<>();
        result.put("revenueData", revenueData);
        result.put("totalRevenue", totalRevenue.doubleValue());
        result.put("managerName", manager.getFirstName() + " " + manager.getLastName());
        
        return ResponseEntity.ok()
            .header("Cache-Control", "no-cache, no-store, must-revalidate")
            .header("Pragma", "no-cache")
            .header("Expires", "0")
            .body(result);
    }

    @GetMapping("/executive-revenue")
    public ResponseEntity<Map<String, Object>> executiveRevenue(
            @RequestParam Integer executiveId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        Users executive = usersRepository.findById(executiveId).orElse(null);
        if (executive == null) {
            return ResponseEntity.ok(Map.of("revenueData", new ArrayList<>(), "totalRevenue", 0));
        }

        LocalDate start = startDate != null && !startDate.isEmpty() ? LocalDate.parse(startDate) : null;
        LocalDate end = endDate != null && !endDate.isEmpty() ? LocalDate.parse(endDate) : null;
        
        List<Deal> deals = dealRepository.findAll().stream()
            .filter(d -> {
                // Executive gets revenue credit only if they are the current owner (reassignTo takes priority over createdBy)
                if (d.getReassignTo() != null) {
                    return d.getReassignTo().getUserId().equals(executiveId);
                } else {
                    return d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(executiveId);
                }
            })
            .collect(Collectors.toList());
        
        // Filter for only Closed_Won deals with closed_date for revenue analysis
        List<Deal> filteredDeals = deals.stream()
            .filter(d -> d.getStage() == Deal.Stage.Closed_Won) // Only Closed_Won deals
            .filter(d -> d.getClosedDate() != null) // Only deals with closed_date
            .filter(d -> d.getDealValue() != null && d.getDealValue().compareTo(BigDecimal.ZERO) > 0)
            .filter(d -> {
                if (start == null && end == null) return true;
                LocalDate dealDate = d.getClosedDate(); // Use closed_date for revenue analysis
                if (dealDate == null) return false;
                boolean afterStart = start == null || !dealDate.isBefore(start);
                boolean beforeEnd = end == null || !dealDate.isAfter(end);
                return afterStart && beforeEnd;
            })
            .collect(Collectors.toList());
        
        // Group deals by month using closed_date for revenue analysis
        Map<String, List<Deal>> dealsByMonth = filteredDeals.stream()
            .collect(Collectors.groupingBy(d -> {
                LocalDate date = d.getClosedDate(); // Use closed_date for revenue grouping
                return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
            }));
        
        List<Map<String, Object>> revenueData = new ArrayList<>();
        BigDecimal totalRevenue = BigDecimal.ZERO;
        
        for (Map.Entry<String, List<Deal>> entry : dealsByMonth.entrySet()) {
            String month = entry.getKey();
            List<Deal> monthDeals = entry.getValue();
            
            BigDecimal monthTotal = monthDeals.stream()
                .map(Deal::getDealValue)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            
            totalRevenue = totalRevenue.add(monthTotal);
            
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("period", month);
            monthData.put("total", monthTotal.doubleValue());
            monthData.put("revenue", monthTotal.doubleValue());
            
            revenueData.add(monthData);
        }
        
        revenueData.sort((a, b) -> ((String) a.get("period")).compareTo((String) b.get("period")));
        
        // Calculate overall total revenue for this executive (only Closed_Won deals with closed_date)
        List<Deal> allExecutiveDeals = dealRepository.findAll().stream()
            .filter(d -> {
                // Executive gets revenue credit only if they are the current owner (reassignTo takes priority over createdBy)
                if (d.getReassignTo() != null) {
                    return d.getReassignTo().getUserId().equals(executiveId);
                } else {
                    return d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(executiveId);
                }
            })
            .collect(Collectors.toList());
        BigDecimal overallExecutiveRevenue = allExecutiveDeals.stream()
            .filter(d -> d.getStage() == Deal.Stage.Closed_Won) // Only Closed_Won deals
            .filter(d -> d.getClosedDate() != null) // Only deals with closed_date
            .filter(d -> d.getDealValue() != null && d.getDealValue().compareTo(BigDecimal.ZERO) > 0)
            .map(Deal::getDealValue)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        // Calculate lead count (filtered deals count)
        long leadCount = filteredDeals.size();
        long totalLeadCount = allExecutiveDeals.stream()
            .filter(d -> d.getStage() == Deal.Stage.Closed_Won)
            .filter(d -> d.getClosedDate() != null)
            .filter(d -> d.getDealValue() != null && d.getDealValue().compareTo(BigDecimal.ZERO) > 0)
            .count();
        
        Map<String, Object> result = new HashMap<>();
        result.put("revenueData", revenueData);
        result.put("currentRevenue", totalRevenue.doubleValue()); // Filtered revenue
        result.put("totalRevenue", overallExecutiveRevenue.doubleValue()); // Overall total (unfiltered)
        result.put("leadCount", leadCount); // Filtered lead count
        result.put("totalLeadCount", totalLeadCount); // Total lead count (unfiltered)
        result.put("executiveName", executive.getFirstName() + " " + executive.getLastName());
        
        return ResponseEntity.ok()
            .header("Cache-Control", "no-cache, no-store, must-revalidate")
            .header("Pragma", "no-cache")
            .header("Expires", "0")
            .body(result);
    }

    @GetMapping("/activities")
    public ResponseEntity<Map<String, Object>> activities(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        try {
            boolean filterByDate = (startDate != null && !startDate.isEmpty()) || (endDate != null && !endDate.isEmpty());
            LocalDate start = startDate != null && !startDate.isEmpty() ? LocalDate.parse(startDate) : LocalDate.now().minusYears(100);
            LocalDate end = endDate != null && !endDate.isEmpty() ? LocalDate.parse(endDate) : LocalDate.now().plusYears(100);

        List<Activity> activities;
        if ("Sales_Manager".equals(userRole)) {
            activities = activityRepository.findByCreatedBy_ManagerId(userId);
        } else {
            activities = activityRepository.findAll();
        }
        log.debug("=== ACTIVITIES DATE FILTERING ===");
        log.debug("Filter by date: {}", filterByDate);
        log.debug("Start Date: {}, End Date: {}", start, end);
        log.debug("Total activities before filter: {}", activities.size());
        
        if (filterByDate) {
            activities = activities.stream()
                .filter(a -> {
                    if (a.getActivityDate() == null) return false;
                    LocalDate activityDate = a.getActivityDate().toLocalDate();
                    boolean afterStart = !activityDate.isBefore(start);
                    boolean beforeEnd = !activityDate.isAfter(end);
                    return afterStart && beforeEnd;
                })
                .collect(Collectors.toList());
            log.debug("Activities after date filter: {}", activities.size());
        }
        log.debug("=================================");

        Map<String, Long> byType = activities.stream().collect(Collectors.groupingBy(a -> {
            if (a.getActivityType() != null) {
                try {
                    return a.getActivityType().name();
                } catch (Exception e) {
                    return "Unknown";
                }
            }
            return "Unknown";
        }, Collectors.counting()));
        Map<String, Long> byStatus = Map.of("Communication", (long) activities.size()); // No status field in new schema

        Map<String, Long> perDay = activities.stream()
            .filter(a -> a.getActivityDate() != null)
            .collect(Collectors.groupingBy(a -> a.getActivityDate().toLocalDate().toString(), Collectors.counting()));

            Map<String, Object> result = new HashMap<>();
            result.put("byType", byType);
            result.put("byStatus", byStatus);
            result.put("perDay", perDay);
            result.put("total", activities.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("byType", new HashMap<>());
            errorResult.put("byStatus", new HashMap<>());
            errorResult.put("perDay", new HashMap<>());
            errorResult.put("total", 0);
            return ResponseEntity.ok(errorResult);
        }
    }

    @PostMapping("/create-sample-data")
    public ResponseEntity<Map<String, Object>> createSampleData() {
        try {
            // Create manager and executives
            Users manager = usersRepository.findById(1).orElse(null);
            if (manager == null) {
                manager = new Users();
                manager.setFirstName("John");
                manager.setLastName("Manager");
                manager.setEmail("manager@techtammina.com");
                manager.setRole("Sales_Manager");
                manager = usersRepository.save(manager);
            }
            
            // Create sales executives under this manager
            Users exec1 = new Users();
            exec1.setFirstName("Alice");
            exec1.setLastName("Executive");
            exec1.setEmail("alice@techtammina.com");
            exec1.setRole("Sales_Executive");
            exec1.setManagerId(manager.getUserId());
            exec1 = usersRepository.save(exec1);
            
            Users exec2 = new Users();
            exec2.setFirstName("Bob");
            exec2.setLastName("Executive");
            exec2.setEmail("bob@techtammina.com");
            exec2.setRole("Sales_Executive");
            exec2.setManagerId(manager.getUserId());
            exec2 = usersRepository.save(exec2);
            
            Users defaultUser = manager;

            // Create sample accounts
            Account[] accounts = {
                createAccount("Tech Solutions Inc", "Technology", "USA", "New York", defaultUser),
                createAccount("Global Marketing Ltd", "Marketing", "UK", "London", defaultUser),
                createAccount("Innovation Corp", "Software", "Canada", "Toronto", defaultUser),
                createAccount("Enterprise Systems", "Technology", "USA", "California", defaultUser),
                createAccount("Digital Ventures", "Software", "USA", "Texas", defaultUser)
            };

            // Create sample contacts
            Contact[] contacts = {
                createContact("John", "Smith", "john@techsolutions.com", "+1-555-0101", "CTO", accounts[0], defaultUser),
                createContact("Sarah", "Johnson", "sarah@globalmarketing.com", "+44-20-7946-0958", "Marketing Director", accounts[1], defaultUser),
                createContact("Mike", "Wilson", "mike@innovation.com", "+1-416-555-0199", "CEO", accounts[2], defaultUser),
                createContact("Lisa", "Brown", "lisa@enterprise.com", "+1-555-0202", "VP Sales", accounts[3], defaultUser),
                createContact("David", "Davis", "david@digital.com", "+1-555-0303", "CTO", accounts[4], defaultUser)
            };

            // Create comprehensive sample deals with varied revenue data across multiple months
            // January 2024 - Lower values (created by executives)
            createDeal("CRM Implementation", new BigDecimal("15000"), accounts[0], contacts[0], exec1, "2024-01-05");
            createDeal("Marketing Setup", new BigDecimal("8000"), accounts[1], contacts[1], exec2, "2024-01-12");
            createDeal("Data Analytics", new BigDecimal("22000"), accounts[3], contacts[3], exec1, "2024-01-18");
            createDeal("Consulting", new BigDecimal("12000"), accounts[2], contacts[2], exec2, "2024-01-25");
            
            // February 2024 - Medium values
            createDeal("Software Development", new BigDecimal("45000"), accounts[2], contacts[2], exec1, "2024-02-08");
            createDeal("IT Infrastructure", new BigDecimal("32000"), accounts[0], contacts[0], exec2, "2024-02-15");
            createDeal("Security Audit", new BigDecimal("18000"), accounts[4], contacts[4], exec1, "2024-02-22");
            createDeal("Training Program", new BigDecimal("25000"), accounts[1], contacts[1], exec2, "2024-02-28");
            
            // March 2024 - Higher values
            createDeal("Cloud Migration", new BigDecimal("65000"), accounts[1], contacts[1], defaultUser, "2024-03-05");
            createDeal("Mobile App", new BigDecimal("85000"), accounts[2], contacts[2], defaultUser, "2024-03-12");
            createDeal("ERP Integration", new BigDecimal("95000"), accounts[3], contacts[3], defaultUser, "2024-03-18");
            createDeal("Platform Upgrade", new BigDecimal("55000"), accounts[0], contacts[0], defaultUser, "2024-03-25");
            
            // April 2024 - Peak values
            createDeal("AI Implementation", new BigDecimal("120000"), accounts[4], contacts[4], defaultUser, "2024-04-08");
            createDeal("Database Optimization", new BigDecimal("75000"), accounts[0], contacts[0], defaultUser, "2024-04-15");
            createDeal("Web Portal", new BigDecimal("88000"), accounts[1], contacts[1], defaultUser, "2024-04-22");
            createDeal("Enterprise Solution", new BigDecimal("110000"), accounts[2], contacts[2], defaultUser, "2024-04-28");
            
            // May 2024 - Varied values
            createDeal("Business Intelligence", new BigDecimal("92000"), accounts[2], contacts[2], defaultUser, "2024-05-10");
            createDeal("System Integration", new BigDecimal("68000"), accounts[3], contacts[3], defaultUser, "2024-05-18");
            createDeal("Digital Transformation", new BigDecimal("135000"), accounts[4], contacts[4], defaultUser, "2024-05-25");
            createDeal("Support Package", new BigDecimal("45000"), accounts[1], contacts[1], defaultUser, "2024-05-30");
            
            // June 2024 - High summer values
            createDeal("Cloud Infrastructure", new BigDecimal("78000"), accounts[0], contacts[0], defaultUser, "2024-06-05");
            createDeal("Data Analytics Platform", new BigDecimal("105000"), accounts[1], contacts[1], defaultUser, "2024-06-15");
            createDeal("Security Enhancement", new BigDecimal("62000"), accounts[2], contacts[2], defaultUser, "2024-06-25");
            
            // July 2024 - Mid-year performance
            createDeal("Mobile Development", new BigDecimal("89000"), accounts[3], contacts[3], defaultUser, "2024-07-08");
            createDeal("API Integration", new BigDecimal("54000"), accounts[4], contacts[4], defaultUser, "2024-07-18");
            createDeal("Performance Optimization", new BigDecimal("71000"), accounts[0], contacts[0], defaultUser, "2024-07-28");
            
            // August 2024 - Summer peak
            createDeal("E-commerce Platform", new BigDecimal("96000"), accounts[1], contacts[1], defaultUser, "2024-08-05");
            createDeal("Backup Solutions", new BigDecimal("43000"), accounts[2], contacts[2], defaultUser, "2024-08-15");
            createDeal("Network Upgrade", new BigDecimal("67000"), accounts[3], contacts[3], defaultUser, "2024-08-25");

            return ResponseEntity.ok(Map.of(
                "message", "Comprehensive sample data created successfully", 
                "deals", dealRepository.count(),
                "accounts", accountRepository.count(),
                "contacts", contactRepository.count()
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    private Account createAccount(String name, String industry, String country, String companyLocation, Users user) {
        Account account = new Account();
        account.setAccountName(name);
        account.setIndustry(industry);
        account.setCountry(country);
        account.setCompanyLocation(companyLocation);
        account.setReassignTo(user);
        account.setCreatedBy(user);
        return accountRepository.save(account);
    }

    private Contact createContact(String firstName, String lastName, String email, String phoneNumber, String designation, Account account, Users user) {
        Contact contact = new Contact();
        contact.setFirstName(firstName);
        contact.setLastName(lastName);
        contact.setEmail(email);
        contact.setPhoneNumber(phoneNumber);
        contact.setDesignation(designation);
        contact.setAccount(account);
        contact.setReassignTo(user);
        contact.setCreatedBy(user);
        return contactRepository.save(contact);
    }

    private Deal createDeal(String name, BigDecimal value, Account account, Contact contact, Users user, String dateStr) {
        Deal deal = new Deal();
        deal.setDealName(name);
        deal.setDealValue(value);
        deal.setAccount(account);
        deal.setContact(contact);
        deal.setCreatedBy(user);
        deal.setStage(Deal.Stage.Closed_Won);
        deal.setProbability(100);
        deal.setClosedDate(LocalDate.parse(dateStr));
        deal.setExpectedCloseDate(LocalDate.parse(dateStr));
        deal.setCreatedAt(LocalDate.parse(dateStr).atStartOfDay());
        return dealRepository.save(deal);
    }
    
    private List<Integer> getExecutiveIdsUnderVP(Integer vpId) {
        return usersRepository.findByManagerId(vpId).stream()
                .filter(user -> "Sales_Manager".equals(user.getRole()))
                .flatMap(manager -> usersRepository.findByManagerId(manager.getUserId()).stream())
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .map(Users::getUserId)
                .collect(Collectors.toList());
    }
    
    private List<Deal> getDealsForRole(Integer userId, String userRole) {
        String role = (userRole == null ? "" : userRole).trim();
        String normalized = role.toUpperCase().replace(' ', '_');
        
        if ("IT_ADMIN".equals(normalized)) {
            return dealRepository.findAll();
        }
        if ("SALES_VP".equals(normalized)) {
            // VP sees deals from their hierarchy
            List<Deal> vpDeals = new ArrayList<>();
            List<Users> managersUnderVP = usersRepository.findByManagerId(userId);
            
            // Add deals created by or assigned to the VP themselves
            List<Deal> allDeals = dealRepository.findAll();
            vpDeals.addAll(allDeals.stream()
                .filter(d -> (d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(userId)) ||
                            (d.getReassignTo() != null && d.getReassignTo().getUserId().equals(userId)))
                .collect(Collectors.toList()));
            
            // Add deals from managers under this VP
            for (Users manager : managersUnderVP) {
                vpDeals.addAll(allDeals.stream()
                    .filter(d -> (d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(manager.getUserId())) ||
                                (d.getReassignTo() != null && d.getReassignTo().getUserId().equals(manager.getUserId())))
                    .collect(Collectors.toList()));
                
                // Add deals from executives under this manager
                List<Users> executivesUnderManager = usersRepository.findByManagerId(manager.getUserId());
                for (Users executive : executivesUnderManager) {
                    vpDeals.addAll(allDeals.stream()
                        .filter(d -> (d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(executive.getUserId())) ||
                                    (d.getReassignTo() != null && d.getReassignTo().getUserId().equals(executive.getUserId())))
                        .collect(Collectors.toList()));
                }
            }
            
            return vpDeals.stream().distinct().collect(Collectors.toList());
        }
        if ("SALES_MANAGER".equals(normalized)) {
            // Manager sees deals from executives under them
            List<Deal> managerDeals = new ArrayList<>();
            List<Deal> allDeals = dealRepository.findAll();
            
            // Manager sees deals created by or assigned to themselves
            managerDeals.addAll(allDeals.stream()
                .filter(d -> (d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(userId)) ||
                            (d.getReassignTo() != null && d.getReassignTo().getUserId().equals(userId)))
                .collect(Collectors.toList()));
            
            // Manager sees deals from executives under them
            List<Users> executivesUnderManager = usersRepository.findByManagerId(userId);
            for (Users executive : executivesUnderManager) {
                managerDeals.addAll(allDeals.stream()
                    .filter(d -> (d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(executive.getUserId())) ||
                                (d.getReassignTo() != null && d.getReassignTo().getUserId().equals(executive.getUserId())))
                    .collect(Collectors.toList()));
            }
            
            return managerDeals.stream().distinct().collect(Collectors.toList());
        }
        if ("SALES_EXECUTIVE".equals(normalized)) {
            // Executive sees only their own deals
            List<Deal> allDeals = dealRepository.findAll();
            return allDeals.stream()
                .filter(d -> (d.getCreatedBy() != null && d.getCreatedBy().getUserId().equals(userId)) ||
                            (d.getReassignTo() != null && d.getReassignTo().getUserId().equals(userId)))
                .collect(Collectors.toList());
        }
        return List.of();
    }
}