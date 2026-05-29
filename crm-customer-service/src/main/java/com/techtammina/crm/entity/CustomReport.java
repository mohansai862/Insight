package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "custom_reports")
public class CustomReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "report_id")
    private Integer reportId;

    @Column(name = "report_name", nullable = false)
    private String reportName;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "report_type", nullable = false)
    private ReportType reportType;

    @Column(name = "entity_type", nullable = false)
    private String entityType;

    @Column(name = "columns", columnDefinition = "JSON")
    private String columns;

    @Column(name = "filters", columnDefinition = "JSON")
    private String filters;

    @Column(name = "group_by")
    private String groupBy;

    @Column(name = "sort_by")
    private String sortBy;

    @Enumerated(EnumType.STRING)
    @Column(name = "chart_type")
    private ChartType chartType;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", nullable = false)
    private Users createdBy;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @Column(name = "is_public")
    private Boolean isPublic = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_frequency")
    private ScheduleFrequency scheduleFrequency = ScheduleFrequency.None;

    @PrePersist
    public void prePersist() {
        createdDate = LocalDateTime.now();
    }

    public enum ReportType {
        Table, Chart, Dashboard
    }

    public enum ChartType {
        Bar, Line, Pie, Donut, Area, Scatter, Funnel
    }

    public enum ScheduleFrequency {
        None, Daily, Weekly, Monthly
    }

    // Getters and Setters
    public Integer getReportId() { return reportId; }
    public void setReportId(Integer reportId) { this.reportId = reportId; }
    public String getReportName() { return reportName; }
    public void setReportName(String reportName) { this.reportName = reportName; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ReportType getReportType() { return reportType; }
    public void setReportType(ReportType reportType) { this.reportType = reportType; }
    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public String getColumns() { return columns; }
    public void setColumns(String columns) { this.columns = columns; }
    public String getFilters() { return filters; }
    public void setFilters(String filters) { this.filters = filters; }
    public String getGroupBy() { return groupBy; }
    public void setGroupBy(String groupBy) { this.groupBy = groupBy; }
    public String getSortBy() { return sortBy; }
    public void setSortBy(String sortBy) { this.sortBy = sortBy; }
    public ChartType getChartType() { return chartType; }
    public void setChartType(ChartType chartType) { this.chartType = chartType; }
    public Users getCreatedBy() { return createdBy; }
    public void setCreatedBy(Users createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedDate() { return createdDate; }
    public void setCreatedDate(LocalDateTime createdDate) { this.createdDate = createdDate; }
    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }
    public ScheduleFrequency getScheduleFrequency() { return scheduleFrequency; }
    public void setScheduleFrequency(ScheduleFrequency scheduleFrequency) { this.scheduleFrequency = scheduleFrequency; }
}

