package com.techtammina.crm.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import lombok.extern.slf4j.Slf4j;

import com.techtammina.crm.entity.Email;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private static final String RECIPIENT_EMAIL = "crms-noreply@tammina.in";

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendContactMessage(String name, String email, String message) {
        try {
            log.info("Attempting to send contact message from: {} to: {}", email, RECIPIENT_EMAIL);
            
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            
            mailMessage.setTo(RECIPIENT_EMAIL);
            mailMessage.setSubject("New Contact Form Message - Tech Tammina CRM");
            mailMessage.setText(
                "New contact form submission:\n\n" +
                "Name: " + name + "\n" +
                "Email: " + email + "\n" +
                "Message:\n" + message + "\n\n" +
                "---\n" +
                "This message was sent from the Tech Tammina CRM website contact form."
            );
            mailMessage.setFrom("crms-noreply@tammina.in");
            mailMessage.setReplyTo(email);

            mailSender.send(mailMessage);
            log.info("Contact message sent successfully to: {}", RECIPIENT_EMAIL);
            
        } catch (Exception e) {
            log.error("Failed to send contact message: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    // Legacy methods for backward compatibility
    public void sendEmail(String to, String cc, String subject, String body) {
        try {
            log.info("Attempting to send email to: {} with subject: {}", to, subject);
            
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(to);
            if (cc != null && !cc.trim().isEmpty()) helper.setCc(cc);
            helper.setSubject(subject);
            helper.setFrom("crms-noreply@tammina.in");
            
            // Convert plain text to HTML with proper formatting
            String htmlBody = convertTextToHtml(body);
            helper.setText(htmlBody, true);
            
            log.info("Sending email via mail server...");
            mailSender.send(mimeMessage);
            log.info("Email sent successfully to: {}", to);
        } catch (org.springframework.mail.MailException e) {
            log.error("Mail server error when sending to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Mail server connection failed: " + e.getMessage(), e);
        } catch (jakarta.mail.MessagingException e) {
            log.error("Email messaging error when sending to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Email formatting error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("Unexpected error when sending email to {}: {}", to, e.getMessage(), e);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    public Email saveDraft(Email email) {
        try {
            log.info("Saving email draft: {} to {}", email.getSubject(), email.getToAddresses());
            email.setStatus(Email.Status.Draft);
            return email;
        } catch (Exception e) {
            log.error("Failed to save email draft: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save draft: " + e.getMessage(), e);
        }
    }

    public Email sendEmail(Email email) {
        try {
            log.info("Sending email: {} to {}", email.getSubject(), email.getToAddresses());
            
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            
            helper.setTo(email.getToAddresses());
            helper.setSubject(email.getSubject());
            helper.setFrom(email.getFromAddress() != null ? email.getFromAddress() : "crms-noreply@tammina.in");
            
            // Add CC if provided
            if (email.getCcAddresses() != null && !email.getCcAddresses().trim().isEmpty()) {
                helper.setCc(email.getCcAddresses());
            }
            
            // Convert plain text to HTML with proper formatting
            String htmlBody = convertTextToHtml(email.getBody());
            helper.setText(htmlBody, true);
            
            // Send the email
            mailSender.send(mimeMessage);
            log.info("Email sent successfully to: {}", email.getToAddresses());
            
            // Update email status
            email.setStatus(Email.Status.Sent);
            email.setSentDate(java.time.LocalDateTime.now());
            return email;
        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage(), e);
            email.setStatus(Email.Status.Failed);
            throw new RuntimeException("Failed to send email: " + e.getMessage(), e);
        }
    }

    public List<Email> getEmailsByEntity(String entityType, Integer entityId) {
        // Stub implementation - return empty list for now
        log.info("Getting emails for entity: {} with ID: {}", entityType, entityId);
        return List.of();
    }

    public List<Email> getEmailThread(String threadId) {
        // Stub implementation - return empty list for now
        log.info("Getting email thread: {}", threadId);
        return List.of();
    }

    public void trackEmailOpen(String trackingCode) {
        // Stub implementation - log email open tracking
        log.info("Email opened with tracking code: {}", trackingCode);
    }

    public String previewTemplate(Integer templateId, Map<String, Object> variables) {
        // Stub implementation - return empty string for now
        log.info("Previewing template: {} with variables: {}", templateId, variables);
        return "";
    }

    public void sendEmailFromTemplate(Integer templateId, String to, String subject, Map<String, Object> variables) {
        // Stub implementation - log template email sending
        log.info("Sending email from template: {} to: {} with subject: {}", templateId, to, subject);
    }
    
    public List<Email> getEmailsByUserId(Integer userId) {
        // Stub implementation - return empty list for now
        log.info("Getting emails for user ID: {}", userId);
        return List.of();
    }
    
    private String convertTextToHtml(String text) {
        if (text == null) return "";
        
        // Replace escaped newlines with actual newlines first
        text = text.replace("\\n", "\n");
        
        // Escape HTML special characters
        text = text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;");
        
        // Convert newlines to <br> tags
        text = text.replace("\n", "<br>");
        
        // Decode HTML entities that were already in the text
        text = text.replace("&amp;quot;", "&quot;")
                   .replace("&amp;#39;", "&#39;")
                   .replace("&amp;amp;", "&amp;");
        
        // Build HTML email with proper styling
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<meta charset='UTF-8'>" +
               "<style>" +
               "body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "<div style='max-width: 600px; margin: 0 auto; padding: 20px;'>" +
               text +
               "</div>" +
               "</body>" +
               "</html>";
    }
}


