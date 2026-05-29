package com.techtammina.crm.service;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.repository.LeadRepository;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class LeadReminderService {
    private static final Logger log = LoggerFactory.getLogger(LeadReminderService.class);

    private final LeadRepository leadRepository;
    private final EmailService emailService;

    public LeadReminderService(LeadRepository leadRepository, EmailService emailService) {
        this.leadRepository = leadRepository;
        this.emailService = emailService;
    }

    // @Scheduled(cron = "0 5 11 * * ?") // Daily at 11:05 AM DISABLED
    public void sendDailyLeadReminders() {
        log.debug("📄 Starting daily lead reminder process...");
        
        // Find all leads that are not converted
        List<Lead> unconvertedLeads = leadRepository.findByLeadStatusNot(Lead.LeadStatus.Converted);
        
        log.debug("📧 Found {} unconverted leads", unconvertedLeads.size());
        
        for (Lead lead : unconvertedLeads) {
            if (lead.getEmail() != null && !lead.getEmail().trim().isEmpty()) {
                sendReminderEmail(lead);
            }
        }
        
        log.debug("✅ Daily lead reminder process completed");
    }

    private void sendReminderEmail(Lead lead) {
        try {
            String subject = "🚀 Don't Miss Out - Tech Tammina is Here to Help!";
            String body = String.format(
                "Dear %s %s,\\n\\n" +
                "We hope this message finds you well!\\n\\n" +
                "We noticed you showed interest in Tech Tammina, and we wanted to follow up with you. " +
                "Our team is ready to help you achieve your business goals with our innovative solutions.\\n\\n" +
                "Why choose Tech Tammina?\\n" +
                "✅ Cutting-edge technology solutions\\n" +
                "✅ Expert support team\\n" +
                "✅ Proven track record of success\\n" +
                "✅ Customized solutions for your needs\\n\\n" +
                "Your Details:\\n" +
                "- Company: %s\\n" +
                "- Industry: %s\\n" +
                "- Status: %s\\n\\n" +
                "Ready to take the next step?\\n" +
                "📞 Call us: +1-800-TECH-CRM\\n" +
                "📧 Email us: sales@techtammina.com\\n" +
                "🌐 Visit: www.techtammina.com\\n\\n" +
                "Don't let this opportunity slip away. Let's discuss how Tech Tammina can transform your business!\\n\\n" +
                "Best regards,\\n" +
                "Tech Tammina Sales Team\\n" +
                "Delivering Excellence in Every Customer Interaction",
                lead.getFirstName() != null ? lead.getFirstName() : "",
                lead.getLastName() != null ? lead.getLastName() : "",
                lead.getCompanyName() != null ? lead.getCompanyName() : "Your Company",
                lead.getIndustry() != null ? lead.getIndustry() : "Technology",
                lead.getLeadStatus() != null ? lead.getLeadStatus().toString() : "New"
            );
            
            emailService.sendEmail(lead.getEmail(), null, subject, body);
            log.debug("📧 Reminder sent to: {}", lead.getEmail());
            
        } catch (Exception e) {
        }
    }

    // Manual trigger for testing
    public void sendRemindersNow() {
        log.debug("🧪 Manual trigger: Sending reminders now...");
        sendDailyLeadReminders();
    }
}