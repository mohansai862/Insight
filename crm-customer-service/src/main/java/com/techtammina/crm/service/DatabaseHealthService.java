package com.techtammina.crm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
public class DatabaseHealthService {

    private static final Logger log = LoggerFactory.getLogger(DatabaseHealthService.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    /**
     * Check and fix auto-increment sequences for all CRM tables
     */
    public void checkAndFixAutoIncrementSequences() {
        log.info("Ã°Å¸â€Â Checking auto-increment sequences for CRM tables...");
        
        try {
            // Check and fix accounts table
            fixAutoIncrementForTable("accounts", "account_id");
            
            // Check and fix contacts table
            fixAutoIncrementForTable("contacts", "contact_id");
            
            // Check and fix deals table
            fixAutoIncrementForTable("deals", "deal_id");
            
            // Check and fix leads table
            fixAutoIncrementForTable("leads", "lead_id");
            
            log.info("Ã¢Å“â€¦ Auto-increment sequence check completed successfully");
            
        } catch (Exception e) {
            log.error("Ã¢ÂÅ’ Failed to check/fix auto-increment sequences", e);
            throw new RuntimeException("Database health check failed: " + e.getMessage(), e);
        }
    }
    
    /**
     * Fix auto-increment sequence for a specific table
     */
    private void fixAutoIncrementForTable(String tableName, String idColumn) {
        try {
            // Get current auto-increment value
            String autoIncrementQuery = "SELECT AUTO_INCREMENT FROM information_schema.TABLES " +
                                      "WHERE TABLE_SCHEMA = 'crm_db' AND TABLE_NAME = ?";
            Long currentAutoIncrement = jdbcTemplate.queryForObject(autoIncrementQuery, Long.class, tableName);
            
            // Get maximum ID in the table
            String maxIdQuery = "SELECT COALESCE(MAX(" + idColumn + "), 0) FROM " + tableName;
            Long maxId = jdbcTemplate.queryForObject(maxIdQuery, Long.class);
            
            Long nextId = maxId + 1;
            
            log.info("Ã°Å¸â€œÅ  Table: {}, Current AUTO_INCREMENT: {}, Max ID: {}, Next ID should be: {}", 
                       tableName, currentAutoIncrement, maxId, nextId);
            
            // Fix auto-increment if it's incorrect
            if (currentAutoIncrement == null || currentAutoIncrement <= maxId) {
                String fixQuery = "ALTER TABLE " + tableName + " AUTO_INCREMENT = " + nextId;
                jdbcTemplate.execute(fixQuery);
                log.info("Ã°Å¸â€Â§ Fixed AUTO_INCREMENT for table {} to {}", tableName, nextId);
            } else {
                log.info("Ã¢Å“â€¦ AUTO_INCREMENT for table {} is correct", tableName);
            }
            
        } catch (Exception e) {
            log.error("Ã¢ÂÅ’ Failed to fix auto-increment for table {}: {}", tableName, e.getMessage());
            throw new RuntimeException("Failed to fix auto-increment for table " + tableName, e);
        }
    }
    
    /**
     * Get database health status
     */
    public Map<String, Object> getDatabaseHealthStatus() {
        try {
            Map<String, Object> status = new java.util.HashMap<>();
            
            // Check auto-increment values for all tables
            String[] tables = {"accounts", "contacts", "deals", "leads"};
            String[] idColumns = {"account_id", "contact_id", "deal_id", "lead_id"};
            
            for (int i = 0; i < tables.length; i++) {
                String tableName = tables[i];
                String idColumn = idColumns[i];
                
                // Get current auto-increment value
                String autoIncrementQuery = "SELECT AUTO_INCREMENT FROM information_schema.TABLES " +
                                          "WHERE TABLE_SCHEMA = 'crm_db' AND TABLE_NAME = ?";
                Long currentAutoIncrement = jdbcTemplate.queryForObject(autoIncrementQuery, Long.class, tableName);
                
                // Get maximum ID in the table
                String maxIdQuery = "SELECT COALESCE(MAX(" + idColumn + "), 0) FROM " + tableName;
                Long maxId = jdbcTemplate.queryForObject(maxIdQuery, Long.class);
                
                // Get record count
                String countQuery = "SELECT COUNT(*) FROM " + tableName;
                Long recordCount = jdbcTemplate.queryForObject(countQuery, Long.class);
                
                Map<String, Object> tableStatus = new java.util.HashMap<>();
                tableStatus.put("autoIncrement", currentAutoIncrement);
                tableStatus.put("maxId", maxId);
                tableStatus.put("recordCount", recordCount);
                tableStatus.put("isHealthy", currentAutoIncrement != null && currentAutoIncrement > maxId);
                
                status.put(tableName, tableStatus);
            }
            
            return status;
            
        } catch (Exception e) {
            log.error("Ã¢ÂÅ’ Failed to get database health status", e);
            throw new RuntimeException("Failed to get database health status: " + e.getMessage(), e);
        }
    }
    
    /**
     * Clean up orphaned records (records with invalid foreign key references)
     */
    public void cleanupOrphanedRecords() {
        log.info("Ã°Å¸Â§Â¹ Cleaning up orphaned records...");
        
        try {
            // Clean up leads with invalid account references
            int orphanedLeadAccounts = jdbcTemplate.update(
                "UPDATE leads l LEFT JOIN accounts a ON l.converted_account_id = a.account_id " +
                "SET l.converted_account_id = NULL " +
                "WHERE l.converted_account_id IS NOT NULL AND a.account_id IS NULL"
            );
            
            // Clean up leads with invalid contact references
            int orphanedLeadContacts = jdbcTemplate.update(
                "UPDATE leads l LEFT JOIN contacts c ON l.converted_contact_id = c.contact_id " +
                "SET l.converted_contact_id = NULL " +
                "WHERE l.converted_contact_id IS NOT NULL AND c.contact_id IS NULL"
            );
            
            // Clean up leads with invalid deal references
            int orphanedLeadDeals = jdbcTemplate.update(
                "UPDATE leads l LEFT JOIN deals d ON l.converted_deal_id = d.deal_id " +
                "SET l.converted_deal_id = NULL " +
                "WHERE l.converted_deal_id IS NOT NULL AND d.deal_id IS NULL"
            );
            
            log.info("Ã¢Å“â€¦ Cleanup completed - Fixed {} lead->account, {} lead->contact, {} lead->deal references", 
                       orphanedLeadAccounts, orphanedLeadContacts, orphanedLeadDeals);
            
        } catch (Exception e) {
            log.error("Ã¢ÂÅ’ Failed to cleanup orphaned records", e);
            throw new RuntimeException("Failed to cleanup orphaned records: " + e.getMessage(), e);
        }
    }
}


