package com.techtammina.crm.dto;

import java.util.List;

public class ExcelUploadResultDTO {
    private int totalRecords;
    private int successfulRecords;
    private int failedRecords;
    private List<String> errors;
    private List<LeadDTO> createdLeads;
    private boolean success;
    private String message;
    
    public ExcelUploadResultDTO() {}
    
    public ExcelUploadResultDTO(int totalRecords, int successfulRecords, int failedRecords, 
                               List<String> errors, List<LeadDTO> createdLeads) {
        this.totalRecords = totalRecords;
        this.successfulRecords = successfulRecords;
        this.failedRecords = failedRecords;
        this.errors = errors;
        this.createdLeads = createdLeads;
        this.success = failedRecords == 0;
        this.message = success ? "Leads successfully imported." : "Invalid fields found — data not imported.";
    }
    
    public int getTotalRecords() { return totalRecords; }
    public void setTotalRecords(int totalRecords) { this.totalRecords = totalRecords; }
    
    public int getSuccessfulRecords() { return successfulRecords; }
    public void setSuccessfulRecords(int successfulRecords) { this.successfulRecords = successfulRecords; }
    
    public int getFailedRecords() { return failedRecords; }
    public void setFailedRecords(int failedRecords) { this.failedRecords = failedRecords; }
    
    public List<String> getErrors() { return errors; }
    public void setErrors(List<String> errors) { this.errors = errors; }
    
    public List<LeadDTO> getCreatedLeads() { return createdLeads; }
    public void setCreatedLeads(List<LeadDTO> createdLeads) { this.createdLeads = createdLeads; }
    
    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }
    
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}

