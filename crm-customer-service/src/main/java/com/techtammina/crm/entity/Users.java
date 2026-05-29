package com.techtammina.crm.entity;
 
import java.time.LocalDateTime;
 
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
 
@Entity
@Table(name = "users")
public class Users {
 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Integer userId;
 
    @Column(name = "empid", length = 25)
    private String empid;
 
    @Column(name = "first_name", length = 100)
    private String firstName;
 
    @Column(name = "middle_name", length = 100)
    private String middleName;
 
    @Column(name = "last_name", length = 100)
    private String lastName;
 
    @Column(name = "username", nullable = false, unique = true, length = 100)
    private String username;
 
    @Column(name = "password", nullable = false, length = 255)
    private String password;
 
    @Column(name = "email", nullable = false, unique = true, length = 100)
    private String email;
 
    @Enumerated(EnumType.STRING)
    @Column(name = "gender")
    private Gender gender;
 
    @Column(name = "country_code", length = 8)
    private String countryCode;
 
    @Column(name = "phone_number", length = 20)
    private String phoneNumber;
 
    @Column(name = "role", length = 50)
    private String role;
 
    @Column(name = "manager_id")
    private Integer managerId;
 
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
 
    @Column(name = "reporting_empid", length = 25)
    private String reportingEmpid;
 
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
    
    @Column(name = "first_login", nullable = false)
    private Boolean firstLogin = true;
 
    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
 
    public enum Gender {
        Male, Female, Other
    }
 
    public enum Role {
        CEO("CEO"),
        Sales_VP("Sales VP"),
        Sales_Manager("Sales Manager"),
        Sales_Executive("Sales Executive"),
        IT_Admin("IT Admin");
 
        private final String displayName;
 
        Role(String displayName) {
            this.displayName = displayName;
        }
 
        public String getDisplayName() {
            return displayName;
        }
    }
 
    // getters & setters
    public Integer getUserId() {
        return userId;
    }
    public void setUserId(Integer userId) {
        this.userId = userId;
    }
 
    public String getUsername() {
        return username;
    }
    public void setUsername(String username) {
        this.username = username;
    }
    public String getPassword() {
        return password;
    }
    public void setPassword(String password) {
        this.password = password;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }
    public String getRole() {
        return role;
    }
    public void setRole(String role) {
        this.role = role;
    }
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    public Integer getManagerId() {
        return managerId;
    }
    public void setManagerId(Integer managerId) {
        this.managerId = managerId;
    }
 
    // New profile field getters and setters
    public String getFirstName() { return firstName; }
    public void setFirstName(String firstName) { this.firstName = firstName; }
 
    public String getMiddleName() { return middleName; }
    public void setMiddleName(String middleName) { this.middleName = middleName; }
 
    public String getLastName() { return lastName; }
    public void setLastName(String lastName) { this.lastName = lastName; }
 
    public Gender getGender() { return gender; }
    public void setGender(Gender gender) { this.gender = gender; }
 
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
 
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
 
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
 
    public String getEmpid() { return empid; }
    public void setEmpid(String empid) { this.empid = empid; }
 
    public String getReportingEmpid() { return reportingEmpid; }
    public void setReportingEmpid(String reportingEmpid) { this.reportingEmpid = reportingEmpid; }
    
    public Boolean getFirstLogin() { return firstLogin; }
    public void setFirstLogin(Boolean firstLogin) { this.firstLogin = firstLogin; }
}