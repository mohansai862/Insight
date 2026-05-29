package com.techtammina.crm.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "deals")
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "deal_id")
    private Integer dealId;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "account_id", referencedColumnName = "account_id", nullable = false)
    private Account account;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "contact_id", referencedColumnName = "contact_id")
    private Contact contact;

    @Column(name = "deal_name", length = 200, nullable = false)
    @Pattern(regexp = "^(?!.*^[^a-zA-Z0-9\\s]+$).*", message = "Deal name cannot contain only special characters")
    private String dealName;

    @Column(name = "deal_value", precision = 19, scale = 2)
    private BigDecimal dealValue;

    @Convert(converter = StageConverter.class)
    @Column(name = "stage", length = 50)
    private Stage stage;

    @Column(name = "probability")
    private Integer probability;

    @Column(name = "expected_close_date")
    private LocalDate expectedCloseDate;

    @Column(name = "closed_date")
    private LocalDate closedDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by", referencedColumnName = "user_id", nullable = false)
    private Users createdBy;
 
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reassign_to", referencedColumnName = "user_id")
    private Users reassignTo;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        // Do not set updatedAt during creation - it should remain NULL
        if (stage == null) stage = Stage.Qualification;
        if (probability == null) probability = 0;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Stage {
        Qualification("Qualification"), 
        Proposal("Proposal"), 
        Negotiation("Negotiation"), 
        Closed_Won("Closed Won"), 
        Closed_Lost("Closed Lost"), 
        Unknown("Unknown");

        private final String displayName;

        Stage(String displayName) {
            this.displayName = displayName;
        }

        public String getDisplayName() {
            return displayName;
        }

        public static Stage fromString(String value) {
            if (value == null || value.trim().isEmpty()) {
                return Unknown;
            }
            try {
                return valueOf(value.trim());
            } catch (IllegalArgumentException e) {
                return Unknown;
            }
        }
    }

    // Getters and Setters
    public Integer getDealId() { return dealId; }
    public void setDealId(Integer dealId) { this.dealId = dealId; }
    public Account getAccount() { return account; }
    public void setAccount(Account account) { this.account = account; }
    public Contact getContact() { return contact; }
    public void setContact(Contact contact) { this.contact = contact; }
    public String getDealName() { return dealName; }
    public void setDealName(String dealName) { this.dealName = dealName; }
    public BigDecimal getDealValue() { return dealValue; }
    public void setDealValue(BigDecimal dealValue) { this.dealValue = dealValue; }
    public Stage getStage() { return stage; }
    public void setStage(Stage stage) { this.stage = stage; }
    public Integer getProbability() { return probability; }
    public void setProbability(Integer probability) { this.probability = probability; }
    public LocalDate getExpectedCloseDate() { return expectedCloseDate; }
    public void setExpectedCloseDate(LocalDate expectedCloseDate) { this.expectedCloseDate = expectedCloseDate; }
    public LocalDate getClosedDate() { return closedDate; }
    public void setClosedDate(LocalDate closedDate) { this.closedDate = closedDate; }
    public Users getCreatedBy() { return createdBy; }
    public void setCreatedBy(Users createdBy) { this.createdBy = createdBy; }
    public Users getReassignTo() { return reassignTo; }
    public void setReassignTo(Users reassignTo) { this.reassignTo = reassignTo; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    @Converter
    public static class StageConverter implements AttributeConverter<Stage, String> {
        @Override
        public String convertToDatabaseColumn(Stage stage) {
            return stage != null ? stage.name() : null;
        }

        @Override
        public Stage convertToEntityAttribute(String dbData) {
            if (dbData == null || dbData.trim().isEmpty()) {
                return Stage.Unknown;
            }
            try {
                return Stage.valueOf(dbData.trim());
            } catch (IllegalArgumentException e) {
                return Stage.Unknown;
            }
        }
    }
}

