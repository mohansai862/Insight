package com.techtammina.crm.dto;

public class SalesExecutiveResponse {
    private Long id;
    private String name;
    private String email;
    private String contactNo;
    private int leadsCount;
    private int tasksCount;
    private int communicationsCount;

    public SalesExecutiveResponse() {}

    public SalesExecutiveResponse(Long id, String name, String email, String contactNo, int leadsCount, int tasksCount, int communicationsCount) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.contactNo = contactNo;
        this.leadsCount = leadsCount;
        this.tasksCount = tasksCount;
        this.communicationsCount = communicationsCount;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getContactNo() { return contactNo; }
    public void setContactNo(String contactNo) { this.contactNo = contactNo; }

    public int getLeadsCount() { return leadsCount; }
    public void setLeadsCount(int leadsCount) { this.leadsCount = leadsCount; }

    public int getTasksCount() { return tasksCount; }
    public void setTasksCount(int tasksCount) { this.tasksCount = tasksCount; }

    public int getCommunicationsCount() { return communicationsCount; }
    public void setCommunicationsCount(int communicationsCount) { this.communicationsCount = communicationsCount; }
}

