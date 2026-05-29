package com.techtammina.crm.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.SignupRepository;
import com.techtammina.crm.repository.UsersRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class UsersService {
    private static final Logger log = LoggerFactory.getLogger(UsersService.class);
    
    private final SignupRepository signupRepository;
    private final LeadRepository leadRepository;
    private final UsersRepository usersRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    
    public UsersService(SignupRepository signupRepository, LeadRepository leadRepository, 
                       UsersRepository usersRepository, PasswordEncoder passwordEncoder, 
                       EmailService emailService) {
        this.signupRepository = signupRepository;
        this.leadRepository = leadRepository;
        this.usersRepository = usersRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }
    
    public List<Map<String, Object>> getSalesVPs() {
        return signupRepository.findByRoleAndStatus(
            com.techtammina.crm.entity.Signup.Role.Sales_VP,
            com.techtammina.crm.entity.Signup.Status.Approved
        ).stream().map(this::mapToUserNode).collect(Collectors.toList());
    }
    
    public List<Map<String, Object>> getSalesManagers() {
        return signupRepository.findByRoleAndStatus(
            com.techtammina.crm.entity.Signup.Role.Sales_Manager,
            com.techtammina.crm.entity.Signup.Status.Approved
        ).stream().map(this::mapToUserNode).collect(Collectors.toList());
    }
    
    public List<Map<String, Object>> getSalesExecutives() {
        return signupRepository.findByRoleAndStatus(
            com.techtammina.crm.entity.Signup.Role.Sales_Executive,
            com.techtammina.crm.entity.Signup.Status.Approved
        ).stream().map(this::mapToUserNode).collect(Collectors.toList());
    }
    
    public List<Map<String, Object>> getLeadsByExecutive(Integer executiveId) {
        log.debug("{}", "Service: Fetching real leads for executive ID: " + executiveId);
        
        try {
            List<com.techtammina.crm.entity.Lead> leads = leadRepository.findLeadsForExecutive(null, executiveId);
            log.debug("{}", "Service: Found " + leads.size() + " leads for executive " + executiveId);
            
            return leads.stream()
                .map(this::mapToLeadNode)
                .collect(Collectors.toList());
                
        } catch (Exception e) {
            e.printStackTrace();
            return new java.util.ArrayList<>();
        }
    }
    
    public List<Map<String, Object>> getAllUsers() {
        // Fetch only sales users, excluding IT_Admin
        return usersRepository.findAllSalesUsers().stream()
            .map(this::mapUserToNode)
            .collect(Collectors.toList());
    }
    
    private Map<String, Object> mapUserToNode(com.techtammina.crm.entity.Users user) {
        Map<String, Object> node = new HashMap<>();
        node.put("userId", user.getUserId());
        node.put("firstName", user.getFirstName());
        node.put("middleName", user.getMiddleName());
        node.put("lastName", user.getLastName());
        node.put("username", user.getUsername());
        node.put("email", user.getEmail());
        node.put("role", user.getRole());
        node.put("createdAt", user.getCreatedAt());
        node.put("isActive", user.getIsActive());
        return node;
    }
    
    private Map<String, Object> mapToLeadNode(com.techtammina.crm.entity.Lead lead) {
        Map<String, Object> node = new HashMap<>();
        try {
            node.put("id", lead.getLeadId());
            node.put("firstName", lead.getFirstName());
            node.put("lastName", lead.getLastName());
            node.put("email", lead.getEmail());
            node.put("companyName", lead.getCompanyName());
            node.put("status", lead.getLeadStatus() != null ? lead.getLeadStatus().name() : "New");
            node.put("createdById", lead.getCreatedBy() != null ? lead.getCreatedBy().getUserId() : null);
        } catch (Exception e) {
        }
        return node;
    }
    
    private Map<String, Object> mapToUserNode(com.techtammina.crm.entity.Signup signup) {
        Map<String, Object> node = new HashMap<>();
        node.put("userId", signup.getId());
        node.put("firstName", signup.getFirstName());
        node.put("lastName", signup.getLastName());
        node.put("fullName", (signup.getFirstName() + " " + signup.getLastName()).trim());
        node.put("username", signup.getUsername());
        node.put("email", signup.getEmail());
        node.put("phone", signup.getCountryCode() + " " + signup.getPhoneNumber());
        node.put("role", signup.getRole().name());
        node.put("roleDisplay", signup.getRole().getDisplayName());
        node.put("managerId", signup.getReportingTo());
        node.put("status", signup.getStatus().name());
        node.put("createdAt", signup.getCreatedAt());
        return node;
    }
    
    public List<com.techtammina.crm.entity.Users> findByManagerIdAndRole(Integer managerId, String role) {
        return usersRepository.findByManagerIdAndRole(managerId, role);
    }
    
    public List<com.techtammina.crm.entity.Users> findByRole(String role) {
        return usersRepository.findByRole(role);
    }
    
    public boolean toggleUserStatus(Integer userId) {
        com.techtammina.crm.entity.Users user = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        user.setIsActive(!user.getIsActive());
        usersRepository.save(user);
        
        return user.getIsActive();
    }
    
    public Map<String, Object> getOrganizationTree() {
        // Create CEO node
        Map<String, Object> ceo = new HashMap<>();
        ceo.put("userId", 0);
        ceo.put("name", "Raj Tammina");
        ceo.put("role", "CEO");
        ceo.put("email", "raj@techtammina.com");
        ceo.put("isActive", true);
        
        // Build tree recursively
        List<com.techtammina.crm.entity.Users> allUsers = usersRepository.findAll();
        ceo.put("children", buildChildren(0, allUsers));
        
        return ceo;
    }
    
    public Map<String, Object> getApprovedUsersWithFilters(String search, String status, String role, String startDate, String endDate, int page, int size) {
        List<com.techtammina.crm.entity.Users> allUsers = usersRepository.findAllSalesUsers();
        
        // Apply filters
        List<com.techtammina.crm.entity.Users> filteredUsers = allUsers.stream()
            .filter(user -> {
                // Search filter
                if (search != null && !search.trim().isEmpty()) {
                    String searchLower = search.toLowerCase();
                    String fullName = (user.getFirstName() + " " + (user.getMiddleName() != null ? user.getMiddleName() + " " : "") + user.getLastName()).toLowerCase();
                    return fullName.contains(searchLower) ||
                           user.getUsername().toLowerCase().contains(searchLower) ||
                           user.getEmail().toLowerCase().contains(searchLower) ||
                           user.getRole().toLowerCase().contains(searchLower);
                }
                return true;
            })
            .filter(user -> {
                // Status filter
                if (status != null && !status.trim().isEmpty() && !"All".equals(status)) {
                    if ("Active".equals(status)) return user.getIsActive();
                    if ("Inactive".equals(status)) return !user.getIsActive();
                }
                return true;
            })
            .filter(user -> {
                // Role filter
                if (role != null && !role.trim().isEmpty() && !"All".equals(role)) {
                    return user.getRole().equals(role);
                }
                return true;
            })
            .filter(user -> {
                // Date range filter
                if (startDate != null && !startDate.trim().isEmpty() && endDate != null && !endDate.trim().isEmpty()) {
                    try {
                        java.time.LocalDate start = java.time.LocalDate.parse(startDate);
                        java.time.LocalDate end = java.time.LocalDate.parse(endDate);
                        java.time.LocalDate userDate = user.getCreatedAt().toLocalDate();
                        return !userDate.isBefore(start) && !userDate.isAfter(end);
                    } catch (Exception e) {
                        return true;
                    }
                }
                return true;
            })
            .collect(Collectors.toList());
        
        // Sort by creation date (newest first)
        filteredUsers.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        
        // Pagination
        int totalElements = filteredUsers.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, totalElements);
        
        List<com.techtammina.crm.entity.Users> paginatedUsers = startIndex < totalElements ? 
            filteredUsers.subList(startIndex, endIndex) : new ArrayList<>();
        
        // Convert to response format
        List<Map<String, Object>> userList = paginatedUsers.stream()
            .map(this::mapUserToApprovedNode)
            .collect(Collectors.toList());
        
        // Get available roles
        List<String> availableRoles = usersRepository.findAllSalesUsers().stream()
            .map(com.techtammina.crm.entity.Users::getRole)
            .distinct()
            .sorted()
            .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("users", userList);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page);
        response.put("size", size);
        response.put("availableRoles", availableRoles);
        
        return response;
    }
    
    private Map<String, Object> mapUserToApprovedNode(com.techtammina.crm.entity.Users user) {
        Map<String, Object> node = new HashMap<>();
        node.put("id", user.getUserId());
        node.put("firstName", user.getFirstName());
        node.put("middleName", user.getMiddleName());
        node.put("lastName", user.getLastName());
        node.put("username", user.getUsername());
        node.put("email", user.getEmail());
        node.put("role", user.getRole());
        node.put("status", "Approved");
        node.put("isActive", user.getIsActive());
        node.put("createdAt", user.getCreatedAt());
        node.put("approvedAt", user.getCreatedAt());
        return node;
    }
    
    private List<Map<String, Object>> buildChildren(Integer parentId, List<com.techtammina.crm.entity.Users> allUsers) {
        List<Map<String, Object>> children = new ArrayList<>();
        
        // Find direct reports
        List<com.techtammina.crm.entity.Users> directReports;
        if (parentId == 0) {
            // For CEO, get Sales VPs and IT Admins without manager or with invalid manager
            directReports = allUsers.stream()
                .filter(u -> ("Sales_VP".equals(u.getRole()) || "IT_Admin".equals(u.getRole())) && 
                    (u.getManagerId() == null || allUsers.stream().noneMatch(m -> m.getUserId().equals(u.getManagerId()))))
                .collect(Collectors.toList());
        } else {
            directReports = allUsers.stream()
                .filter(u -> parentId.equals(u.getManagerId()))
                .collect(Collectors.toList());
        }
        
        for (com.techtammina.crm.entity.Users user : directReports) {
            Map<String, Object> child = new HashMap<>();
            child.put("userId", user.getUserId());
            child.put("name", (user.getFirstName() + " " + user.getLastName()).trim());
            child.put("role", user.getRole());
            child.put("email", user.getEmail());
            child.put("isActive", user.getIsActive());
            child.put("children", buildChildren(user.getUserId(), allUsers));
            children.add(child);
        }
        
        return children;
    }
    
    public Map<String, Object> previewUsersExcel(MultipartFile file) {
        try {
            if (file.isEmpty()) {
                throw new RuntimeException("Please select a valid Excel file");
            }
            
            String fileName = file.getOriginalFilename();
            if (fileName == null || (!fileName.toLowerCase().endsWith(".xlsx") && !fileName.toLowerCase().endsWith(".xls"))) {
                throw new RuntimeException("Please upload an Excel file (.xlsx or .xls)");
            }
            
            Workbook workbook = fileName.toLowerCase().endsWith(".xlsx") ? 
                new XSSFWorkbook(file.getInputStream()) : new HSSFWorkbook(file.getInputStream());
            
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getLastRowNum() < 1) {
                workbook.close();
                throw new RuntimeException("Excel file is empty. Please provide a file with data");
            }
            
            List<Map<String, Object>> users = new ArrayList<>();
            List<String> missingFieldErrors = new ArrayList<>();
            
            // Sets to track duplicates within Excel file
            java.util.Set<String> empIds = new java.util.HashSet<>();
            java.util.Set<String> emails = new java.util.HashSet<>();
            java.util.Set<String> usernames = new java.util.HashSet<>();
            java.util.Set<String> phoneNumbers = new java.util.HashSet<>();
            
            // Process each row (skip header)
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                try {
                    Row row = sheet.getRow(i);
                    if (row == null || isRowEmpty(row)) continue;
                    
                    Map<String, Object> user = parseUserRowWithValidation(row, i + 1, missingFieldErrors);
                    if (user != null) {
                        // Check for duplicates within Excel file
                        @SuppressWarnings("unchecked")
                        List<String> validationErrors = (List<String>) user.get("validationErrors");
                        
                        String empId = (String) user.get("empId");
                        String email = (String) user.get("email");
                        String username = (String) user.get("username");
                        String phoneNumber = (String) user.get("phoneNumber");
                        
                        if (empId != null && empIds.contains(empId.toLowerCase())) {
                            validationErrors.add("Duplicate Employee ID found in file");
                        } else if (empId != null) {
                            empIds.add(empId.toLowerCase());
                        }
                        
                        if (email != null && emails.contains(email.toLowerCase())) {
                            validationErrors.add("Duplicate email found in file");
                        } else if (email != null) {
                            emails.add(email.toLowerCase());
                        }
                        
                        if (username != null && usernames.contains(username.toLowerCase())) {
                            validationErrors.add("Duplicate username found in file");
                        } else if (username != null) {
                            usernames.add(username.toLowerCase());
                        }
                        
                        if (phoneNumber != null && phoneNumbers.contains(phoneNumber)) {
                            validationErrors.add("Duplicate phone number found in file");
                        } else if (phoneNumber != null) {
                            phoneNumbers.add(phoneNumber);
                        }
                        
                        user.put("isValid", validationErrors.isEmpty());
                        users.add(user);
                    }
                } catch (Exception e) {
                    log.error("Error processing row {}: {}", i + 1, e.getMessage());
                    // Continue processing other rows
                }
            }
            
            workbook.close();
            
            // Only block if required fields are missing
            if (!missingFieldErrors.isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "Missing required fields found");
                errorResponse.put("errors", missingFieldErrors);
                return errorResponse;
            }
            
            // Collect all validation errors in structured format
            List<Map<String, Object>> allValidationErrors = new ArrayList<>();
            for (Map<String, Object> user : users) {
                @SuppressWarnings("unchecked")
                List<String> userErrors = (List<String>) user.get("validationErrors");
                Integer rowNumber = (Integer) user.get("rowNumber");
                
                if (userErrors != null && !userErrors.isEmpty()) {
                    for (String errorMessage : userErrors) {
                        Map<String, Object> structuredError = new HashMap<>();
                        structuredError.put("row", rowNumber);
                        structuredError.put("field", extractFieldFromError(errorMessage));
                        structuredError.put("message", errorMessage); // Keep full message for better context
                        allValidationErrors.add(structuredError);
                    }
                }
            }
            
            // Always return preview with validation status
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("users", users);
            response.put("totalUsers", users.size());
            response.put("validationErrors", allValidationErrors);
            response.put("hasErrors", !allValidationErrors.isEmpty());
            return response;
            
        } catch (Exception e) {
            log.error("Excel preview failed", e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to process Excel file: " + e.getMessage());
            errorResponse.put("errors", List.of(e.getMessage()));
            return errorResponse;
        }
    }
    
    public Map<String, Object> acceptExcelPreview(List<Map<String, Object>> users) {
        List<String> validationErrors = new ArrayList<>();
        List<Map<String, Object>> createdUsers = new ArrayList<>();
        
        for (int i = 0; i < users.size(); i++) {
            Map<String, Object> userData = users.get(i);
            List<String> userErrors = validateUserData(userData, i + 1);
            
            if (!userErrors.isEmpty()) {
                validationErrors.addAll(userErrors);
            } else {
                try {
                    Users user = createUserFromData(userData);
                    createdUsers.add(mapUserToNode(user));
                } catch (Exception e) {
                    validationErrors.add("Row " + (i + 1) + ": " + e.getMessage());
                }
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        if (!validationErrors.isEmpty()) {
            response.put("success", false);
            response.put("message", "Validation errors found");
            response.put("errors", validationErrors);
        } else {
            response.put("success", true);
            response.put("message", "Successfully created " + createdUsers.size() + " users");
            response.put("createdUsers", createdUsers);
        }
        
        return response;
    }
    
    private Map<String, Object> parseUserRowWithValidation(Row row, int rowNum, List<String> missingFieldErrors) {
        Map<String, Object> user = new HashMap<>();
        List<String> validationErrors = new ArrayList<>();
        
        // Get and trim all fields
        String empId = trimValue(getCellValue(row, 0));
        String firstName = trimValue(getCellValue(row, 1));
        String middleName = trimValue(getCellValue(row, 2));
        String lastName = trimValue(getCellValue(row, 3));
        String username = trimValue(getCellValue(row, 4));
        String email = trimValue(getCellValue(row, 5));
        String gender = trimValue(getCellValue(row, 6));
        String countryCode = trimValue(getCellValue(row, 7));
        String phoneNumber = trimValue(getCellValue(row, 8));
        String role = trimValue(getCellValue(row, 9));
        String reportingId = trimValue(getCellValue(row, 10));
        
        // Check for missing required fields
        boolean hasMissingFields = false;
        if (isEmpty(empId)) { missingFieldErrors.add("Row " + rowNum + ": Employee ID is required"); hasMissingFields = true; }
        if (isEmpty(firstName)) { missingFieldErrors.add("Row " + rowNum + ": First Name is required"); hasMissingFields = true; }
        if (isEmpty(lastName)) { missingFieldErrors.add("Row " + rowNum + ": Last Name is required"); hasMissingFields = true; }
        if (isEmpty(username)) { missingFieldErrors.add("Row " + rowNum + ": Username is required"); hasMissingFields = true; }
        if (isEmpty(email)) { missingFieldErrors.add("Row " + rowNum + ": Email is required"); hasMissingFields = true; }
        if (isEmpty(gender)) { missingFieldErrors.add("Row " + rowNum + ": Gender is required"); hasMissingFields = true; }
        if (isEmpty(countryCode)) { missingFieldErrors.add("Row " + rowNum + ": Country Code is required"); hasMissingFields = true; }
        if (isEmpty(phoneNumber)) { missingFieldErrors.add("Row " + rowNum + ": Phone Number is required"); hasMissingFields = true; }
        if (isEmpty(role)) { missingFieldErrors.add("Row " + rowNum + ": Role is required"); hasMissingFields = true; }
        
        if (hasMissingFields) {
            return null;
        }
        
        // Detailed validation with exact frontend rules
        String empIdError = validateEmpIdStrict(empId);
        if (empIdError != null) validationErrors.add(empIdError);
        
        String firstNameError = validateNameStrict(firstName, "First name");
        if (firstNameError != null) validationErrors.add(firstNameError);
        
        String lastNameError = validateNameStrict(lastName, "Last name");
        if (lastNameError != null) validationErrors.add(lastNameError);
        
        if (!isEmpty(middleName)) {
            String middleNameError = validateNameStrict(middleName, "Middle name");
            if (middleNameError != null) validationErrors.add(middleNameError);
        }
        
        String usernameError = validateUsernameStrict(username);
        if (usernameError != null) validationErrors.add(usernameError);
        
        String emailError = validateEmailStrict(email);
        if (emailError != null) validationErrors.add(emailError);
        
        String genderError = validateGenderStrict(gender);
        if (genderError != null) validationErrors.add(genderError);
        
        String countryCodeError = validateCountryCodeStrict(countryCode);
        if (countryCodeError != null) validationErrors.add(countryCodeError);
        
        String phoneError = validatePhoneNumberStrict(phoneNumber, countryCode);
        if (phoneError != null) validationErrors.add(phoneError);
        
        String roleError = validateRoleStrict(role);
        if (roleError != null) validationErrors.add(roleError);
        
        String reportingError = validateReportingIdStrict(reportingId, role);
        if (reportingError != null) validationErrors.add(reportingError);
        
        // Check database duplicates
        try {
            if (usersRepository.existsByEmail(email)) {
                validationErrors.add("Email already exists in database");
            }
            if (usersRepository.existsByUsername(username)) {
                validationErrors.add("Username already exists in database");
            }
            Users existingUser = usersRepository.findByEmpid(empId);
            if (existingUser != null) {
                validationErrors.add("Employee ID already exists in database");
            }
        } catch (Exception e) {
            log.debug("Database validation skipped for row {}: {}", rowNum, e.getMessage());
        }
        
        // Build user object
        user.put("empId", empId);
        user.put("firstName", firstName);
        user.put("middleName", middleName);
        user.put("lastName", lastName);
        user.put("username", username);
        user.put("email", email);
        user.put("gender", gender);
        user.put("countryCode", countryCode);
        user.put("phoneNumber", phoneNumber);
        user.put("role", role);
        user.put("reportingId", reportingId);
        user.put("rowNumber", rowNum);
        user.put("validationErrors", validationErrors);
        user.put("isValid", validationErrors.isEmpty());
        
        return user;
    }
    
    private String trimValue(String value) {
        return value == null ? null : value.trim();
    }
    
    private String validateEmpIdStrict(String empId) {
        if (isEmpty(empId)) return "Employee ID is required";
        if (!empId.matches(".*[a-zA-Z].*")) return "Employee ID must include at least 1 alphabet";
        if (empId.matches("^\\d+$")) return "Employee ID cannot contain only numbers";
        if (empId.matches("^[^a-zA-Z0-9]+$")) return "Employee ID cannot contain only special symbols";
        return null;
    }
    
    private String validateNameStrict(String name, String fieldName) {
        if (isEmpty(name)) return fieldName + " is required";
        if (!name.matches("^[A-Za-z]+$")) return fieldName + " must contain only alphabets";
        return null;
    }
    
    private String validateUsernameStrict(String username) {
        if (isEmpty(username)) return "Username is required";
        if (username.contains(" ")) return "Username cannot contain spaces";
        if (!Character.isLetter(username.charAt(0))) return "Username must start with an alphabet";
        if (!username.matches("^[a-zA-Z][a-zA-Z0-9._-]*$")) return "Username can only contain alphabets, numbers, underscore (_), hyphen (-), and dot (.)";
        if (!username.matches(".*[a-zA-Z].*")) return "Username must contain at least one alphabet";
        return null;
    }
    
    private String validateEmailStrict(String email) {
        if (isEmpty(email)) return "Email is required";
        if (email.contains(" ")) return "Email cannot contain spaces";
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) return "Please enter a valid email address";
        return null;
    }
    
    private String validateGenderStrict(String gender) {
        if (isEmpty(gender)) return "Gender is required";
        if (!java.util.Arrays.asList("Male", "Female", "Others").contains(gender)) {
            return "Gender must be one of: Male, Female, Others";
        }
        return null;
    }
    
    private String validateCountryCodeStrict(String countryCode) {
        if (isEmpty(countryCode)) return "Country code is required";
        String normalized = countryCode.startsWith("+") ? countryCode : "+" + countryCode;
        java.util.List<String> validCodes = java.util.Arrays.asList("+91", "+1", "+44", "+49");
        if (!validCodes.contains(normalized)) {
            return "Country code must be one of: " + String.join(", ", validCodes);
        }
        return null;
    }
    
    private String validatePhoneNumberStrict(String phoneNumber, String countryCode) {
        if (isEmpty(phoneNumber)) return "Phone number is required";
        if (!phoneNumber.matches("^\\d+$")) return "Phone number can only contain digits";
        
        // Country-based length validation
        String normalizedCode = countryCode != null && countryCode.startsWith("+") ? countryCode : "+" + countryCode;
        int phoneLength = phoneNumber.length();
        
        switch (normalizedCode) {
            case "+91": // India
                if (phoneLength != 10) return "For +91, phone number must be exactly 10 digits";
                break;
            case "+1": // USA/Canada
                if (phoneLength != 10) return "For +1, phone number must be exactly 10 digits";
                break;
            case "+44": // UK
                if (phoneLength < 10 || phoneLength > 11) return "For +44, phone number must be 10-11 digits";
                break;
            case "+49": // Germany
                if (phoneLength < 10 || phoneLength > 11) return "For +49, phone number must be 10-11 digits";
                break;
            default:
                return "Invalid country code for phone validation";
        }
        
        return null;
    }
    
    private String validateRoleStrict(String role) {
        if (isEmpty(role)) return "Role is required";
        java.util.List<String> validRoles = java.util.Arrays.asList("sales_executive", "sales_manager", "sales_vp", "it_admin");
        if (!validRoles.contains(role.toLowerCase())) {
            return "Role must be one of: " + String.join(", ", validRoles);
        }
        return null;
    }
    
    private String validateReportingIdStrict(String reportingId, String role) {
        String normalizedRole = role.toLowerCase();
        if ("sales_vp".equals(normalizedRole) || "it_admin".equals(normalizedRole)) {
            return null; // Optional for VP and IT Admin
        }
        if (isEmpty(reportingId)) return "Reporting ID is required";
        return validateEmpIdStrict(reportingId); // Use same validation as Employee ID
    }
    
    private List<String> validateUserData(Map<String, Object> userData, int rowNum) {
        List<String> errors = new ArrayList<>();
        
        // Get and trim all fields
        String empId = trimValue((String) userData.get("empId"));
        String firstName = trimValue((String) userData.get("firstName"));
        String middleName = trimValue((String) userData.get("middleName"));
        String lastName = trimValue((String) userData.get("lastName"));
        String username = trimValue((String) userData.get("username"));
        String email = trimValue((String) userData.get("email"));
        String gender = trimValue((String) userData.get("gender"));
        String countryCode = trimValue((String) userData.get("countryCode"));
        String phoneNumber = trimValue((String) userData.get("phoneNumber"));
        String role = trimValue((String) userData.get("role"));
        String reportingId = trimValue((String) userData.get("reportingId"));
        
        // Validate all fields with strict rules
        String empIdError = validateEmpIdStrict(empId);
        if (empIdError != null) errors.add("Row " + rowNum + ": " + empIdError);
        
        String firstNameError = validateNameStrict(firstName, "First name");
        if (firstNameError != null) errors.add("Row " + rowNum + ": " + firstNameError);
        
        String lastNameError = validateNameStrict(lastName, "Last name");
        if (lastNameError != null) errors.add("Row " + rowNum + ": " + lastNameError);
        
        if (!isEmpty(middleName)) {
            String middleNameError = validateNameStrict(middleName, "Middle name");
            if (middleNameError != null) errors.add("Row " + rowNum + ": " + middleNameError);
        }
        
        String usernameError = validateUsernameStrict(username);
        if (usernameError != null) errors.add("Row " + rowNum + ": " + usernameError);
        
        String emailError = validateEmailStrict(email);
        if (emailError != null) errors.add("Row " + rowNum + ": " + emailError);
        
        String genderError = validateGenderStrict(gender);
        if (genderError != null) errors.add("Row " + rowNum + ": " + genderError);
        
        String countryCodeError = validateCountryCodeStrict(countryCode);
        if (countryCodeError != null) errors.add("Row " + rowNum + ": " + countryCodeError);
        
        String phoneError = validatePhoneNumberStrict(phoneNumber, countryCode);
        if (phoneError != null) errors.add("Row " + rowNum + ": " + phoneError);
        
        String roleError = validateRoleStrict(role);
        if (roleError != null) errors.add("Row " + rowNum + ": " + roleError);
        
        String reportingError = validateReportingIdStrict(reportingId, role);
        if (reportingError != null) errors.add("Row " + rowNum + ": " + reportingError);
        
        // Database duplicate checks
        if (usersRepository.existsByEmail(email)) {
            errors.add("Row " + rowNum + ": Email already exists in database");
        }
        if (usersRepository.existsByUsername(username)) {
            errors.add("Row " + rowNum + ": Username already exists in database");
        }
        Users existingUser = usersRepository.findByEmpid(empId);
        if (existingUser != null) {
            errors.add("Row " + rowNum + ": Employee ID already exists in database");
        }
        
        // Reporting hierarchy validation
        if (!isEmpty(reportingId)) {
            Users manager = usersRepository.findByEmpid(reportingId);
            if (manager == null) {
                errors.add("Row " + rowNum + ": Reporting Employee ID not found in database");
            } else {
                String validationError = validateReportingHierarchy(role, manager.getRole());
                if (validationError != null) {
                    errors.add("Row " + rowNum + ": " + validationError);
                }
            }
        }
        
        return errors;
    }
    
    private Users createUserFromData(Map<String, Object> userData) {
        Users user = new Users();
        user.setEmpid((String) userData.get("empId"));
        user.setFirstName((String) userData.get("firstName"));
        user.setMiddleName((String) userData.get("middleName"));
        user.setLastName((String) userData.get("lastName"));
        user.setUsername((String) userData.get("username"));
        user.setEmail((String) userData.get("email"));
        user.setRole((String) userData.get("role"));
        
        String gender = (String) userData.get("gender");
        if (!isEmpty(gender)) {
            user.setGender(Users.Gender.valueOf(gender));
        }
        
        user.setCountryCode((String) userData.get("countryCode"));
        user.setPhoneNumber((String) userData.get("phoneNumber"));
        
        String reportingId = (String) userData.get("reportingId");
        if (!isEmpty(reportingId)) {
            Users manager = usersRepository.findByEmpid(reportingId);
            if (manager != null) {
                user.setManagerId(manager.getUserId());
                user.setReportingEmpid(reportingId);
            }
        }
        
        user.setPassword(passwordEncoder.encode("TechTammina@123"));
        user.setCreatedAt(LocalDateTime.now());
        user.setIsActive(true);
        user.setFirstLogin(true);
        
        Users savedUser = usersRepository.save(user);
        
        // Send welcome email
        try {
            String subject = "Welcome to Tech Tammina CRM - Account Created";
            String body = String.format(
                "Dear %s %s,\n\n" +
                "Your Tech Tammina CRM account has been created.\n\n" +
                "Login Details:\n" +
                "Username: %s\n" +
                "Password: TechTammina@123\n" +
                "Employee ID: %s\n" +
                "Role: %s\n\n" +
                "Please login and change your password.\n\n" +
                "Best regards,\nTech Tammina Team",
                user.getFirstName(), user.getLastName(),
                user.getUsername(), user.getEmpid(), user.getRole()
            );
            emailService.sendEmail(user.getEmail(), null, subject, body);
        } catch (Exception e) {
            log.error("Failed to send welcome email to {}", user.getEmail(), e);
        }
        
        return savedUser;
    }
    
    private String getCellValue(Row row, int cellIndex) {
        Cell cell = row.getCell(cellIndex);
        if (cell == null) return null;
        
        switch (cell.getCellType()) {
            case STRING: 
                String value = cell.getStringCellValue().trim();
                return value.isEmpty() ? null : value;
            case NUMERIC: 
                return String.valueOf((long) cell.getNumericCellValue());
            case BOOLEAN: 
                return String.valueOf(cell.getBooleanCellValue());
            case BLANK:
                return null;
            default: 
                return null;
        }
    }
    
    private boolean isRowEmpty(Row row) {
        for (int i = 0; i < 11; i++) {
            if (!isEmpty(getCellValue(row, i))) return false;
        }
        return true;
    }
    
    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty() || "null".equalsIgnoreCase(value.trim());
    }
    
    private boolean isValidEmail(String email) {
        return email != null && email.contains("@") && email.contains(".");
    }
    
    private boolean isValidRole(String role) {
        return "Sales_VP".equals(role) || "Sales_Manager".equals(role) || 
               "Sales_Executive".equals(role) || "IT_Admin".equals(role);
    }
    
    private boolean isValidGender(String gender) {
        return "Male".equals(gender) || "Female".equals(gender) || "Others".equals(gender);
    }
    
    private boolean isValidCountryCode(String countryCode) {
        if (countryCode == null) return false;
        String normalized = countryCode.startsWith("+") ? countryCode : "+" + countryCode;
        return normalized.matches("^\\+\\d{1,4}$");
    }
    
    private String validateUsername(String username) {
        if (username == null) {
            return "Username is required";
        }
        
        // Trim spaces
        username = username.trim();
        
        if (username.isEmpty()) {
            return "Username cannot be empty";
        }
        
        // Check for spaces
        if (username.contains(" ")) {
            return "Username cannot contain spaces";
        }
        
        // Must start with alphabet
        if (!Character.isLetter(username.charAt(0))) {
            return "Username must start with an alphabet (A-Z or a-z)";
        }
        
        // Check allowed characters: alphabets, numbers, underscore, hyphen, dot
        if (!username.matches("^[a-zA-Z][a-zA-Z0-9._-]*$")) {
            return "Username can only contain alphabets, numbers, underscore (_), hyphen (-), and dot (.)";
        }
        
        // Cannot be entirely numeric (must contain at least one alphabet)
        if (username.matches("^[0-9._-]+$")) {
            return "Username cannot be entirely numeric - it must contain at least one alphabet";
        }
        
        return null; // Valid username
    }
    
    private String validateReportingHierarchy(String role, String managerRole) {
        if ("Sales_Manager".equals(role) && !"Sales_VP".equals(managerRole)) {
            return "Sales Manager must report to Sales VP";
        }
        if ("Sales_Executive".equals(role) && !"Sales_Manager".equals(managerRole)) {
            return "Sales Executive must report to Sales Manager";
        }
        return null;
    }
    
    private String extractFieldFromError(String errorMessage) {
        String lowerMessage = errorMessage.toLowerCase();
        
        // Phone number validation (check first for country-specific messages)
        if (lowerMessage.contains("phone") || lowerMessage.contains("+91") || lowerMessage.contains("+1") || 
            lowerMessage.contains("+44") || lowerMessage.contains("+49")) {
            return "phoneNumber";
        }
        
        // Country code validation
        if (lowerMessage.contains("country code") || lowerMessage.contains("country")) {
            return "countryCode";
        }
        
        // Other field mappings
        if (lowerMessage.contains("employee id") || lowerMessage.contains("empid")) return "empId";
        if (lowerMessage.contains("first name")) return "firstName";
        if (lowerMessage.contains("last name")) return "lastName";
        if (lowerMessage.contains("middle name")) return "middleName";
        if (lowerMessage.contains("username")) return "username";
        if (lowerMessage.contains("email")) return "email";
        if (lowerMessage.contains("gender")) return "gender";
        if (lowerMessage.contains("role")) return "role";
        if (lowerMessage.contains("reporting")) return "reportingId";
        
        return "validation";
    }
    
    private String cleanErrorMessage(String errorMessage) {
        // Remove field name prefixes to avoid redundancy
        return errorMessage
            .replaceFirst("^(Employee ID|First name|Last name|Middle name|Username|Email|Gender|Country code|Phone number|Role|Reporting ID)\\s*:?\\s*", "")
            .replaceFirst("^(Duplicate\\s+)?", "");
    }
    
}