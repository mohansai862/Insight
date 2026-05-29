package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "dashboard_metrics")
public class DashboardMetric {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "metric_id")
    private Integer metricId;

    @Column(name = "metric_name", nullable = false)
    private String metricName;

    @Column(name = "metric_value", precision = 15, scale = 2)
    private BigDecimal metricValue;

    @Column(name = "calculated_date", nullable = false)
    private LocalDate calculatedDate;

    @Column(name = "metric_type", nullable = false)
    private String metricType;

    // Getters and Setters
    public Integer getMetricId() { return metricId; }
    public void setMetricId(Integer metricId) { this.metricId = metricId; }
    public String getMetricName() { return metricName; }
    public void setMetricName(String metricName) { this.metricName = metricName; }
    public BigDecimal getMetricValue() { return metricValue; }
    public void setMetricValue(BigDecimal metricValue) { this.metricValue = metricValue; }
    public LocalDate getCalculatedDate() { return calculatedDate; }
    public void setCalculatedDate(LocalDate calculatedDate) { this.calculatedDate = calculatedDate; }
    public String getMetricType() { return metricType; }
    public void setMetricType(String metricType) { this.metricType = metricType; }
}

