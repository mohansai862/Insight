package com.techtammina.crm.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/test")
public class QuoteTestController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/quotes-table")
    public ResponseEntity<Map<String, Object>> testQuotesTable() {
        Map<String, Object> result = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection()) {
            // Test if quotes table exists and has data
            PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*) as count FROM quotes");
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                result.put("quotesTableExists", true);
                result.put("quotesCount", rs.getInt("count"));
            }
            
            // Test if quote_line_items table exists
            try {
                ps = conn.prepareStatement("SELECT COUNT(*) as count FROM quote_line_items");
                rs = ps.executeQuery();
                if (rs.next()) {
                    result.put("quoteLineItemsTableExists", true);
                    result.put("quoteLineItemsCount", rs.getInt("count"));
                }
            } catch (Exception e) {
                result.put("quoteLineItemsTableExists", false);
                result.put("quoteLineItemsError", e.getMessage());
            }
            
            result.put("status", "success");
            
        } catch (Exception e) {
            result.put("status", "error");
            result.put("error", e.getMessage());
        }
        
        return ResponseEntity.ok(result);
    }
}

