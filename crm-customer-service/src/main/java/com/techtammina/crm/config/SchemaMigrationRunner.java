package com.techtammina.crm.config;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

// @Component
// @ConditionalOnBean(JdbcTemplate.class)
public class SchemaMigrationRunner implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    public SchemaMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Drop old unique index on contacts.email if it exists
        try {
            jdbcTemplate.execute("ALTER TABLE contacts DROP INDEX UK728mksvqr0n907kujew6p3jc0");
        } catch (Exception ignored) {
            // Index not found or already dropped
        }

        // Create composite unique index on (account_id, email)
        try {
            jdbcTemplate.execute("CREATE UNIQUE INDEX uk_contact_account_email ON contacts (account_id, email)");
        } catch (Exception ignored) {
            // Index already exists
        }

        // Backfill: align deals.account_id with the contact's account_id where mismatched
        try {
            jdbcTemplate.update(
                "UPDATE deals d " +
                "JOIN contacts c ON d.contact_id = c.contact_id " +
                "SET d.account_id = c.account_id " +
                "WHERE d.contact_id IS NOT NULL AND d.account_id <> c.account_id"
            );
        } catch (Exception e) {
            // Backfill failed or not required
        }
    }
}

