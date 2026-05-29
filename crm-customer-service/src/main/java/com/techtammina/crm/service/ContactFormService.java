package com.techtammina.crm.service;

import com.techtammina.crm.dto.ContactFormDTO;
import com.techtammina.crm.entity.CampaignLead;
import com.techtammina.crm.repository.CampaignLeadRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ContactFormService {

    @Autowired
    private JavaMailSender mailSender;
    
    @Autowired
    private CampaignLeadRepository campaignLeadRepository;

    public void processContactForm(ContactFormDTO contactForm) {
        // Determine source based on subject
        CampaignLead.Source source = (contactForm.getSubject() != null && !contactForm.getSubject().trim().isEmpty()) 
            ? CampaignLead.Source.CONTACT_PAGE 
            : CampaignLead.Source.HOMEPAGE_CONTACT;
        
        // Save campaign lead for marketing analytics
        CampaignLead campaignLead = new CampaignLead(
            contactForm.getName(),
            contactForm.getEmail(),
            contactForm.getMessage(),
            contactForm.getSubject(),
            source
        );
        campaignLeadRepository.save(campaignLead);
        
        // Send email to company
        sendEmailToCompany(contactForm);
        
        // Send thank you email to user
        sendThankYouEmail(contactForm);
    }

    private void sendEmailToCompany(ContactFormDTO contactForm) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo("crms-noreply@tammina.in");
        message.setSubject("New Contact Form Submission - " + (contactForm.getSubject() != null ? contactForm.getSubject() : "General Inquiry"));
        message.setText(buildCompanyEmailContent(contactForm));
        message.setReplyTo(contactForm.getEmail());
        
        mailSender.send(message);
    }

    private void sendThankYouEmail(ContactFormDTO contactForm) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(contactForm.getEmail());
        message.setSubject("Thank you for contacting Tech Tammina!");
        message.setText(buildThankYouEmailContent(contactForm));
        message.setFrom("crms-noreply@tammina.in");
        
        mailSender.send(message);
    }

    private String buildCompanyEmailContent(ContactFormDTO contactForm) {
        StringBuilder content = new StringBuilder();
        content.append("New Contact Form Submission\n");
        content.append("==========================\n\n");
        content.append("Name: ").append(contactForm.getName()).append("\n");
        content.append("Email: ").append(contactForm.getEmail()).append("\n");
        if (contactForm.getSubject() != null && !contactForm.getSubject().trim().isEmpty()) {
            content.append("Subject: ").append(contactForm.getSubject()).append("\n");
        }
        content.append("\nMessage:\n");
        content.append(contactForm.getMessage()).append("\n\n");
        content.append("--\n");
        content.append("This message was sent from the Tech Tammina CRM contact form.\n");
        content.append("Please respond to: ").append(contactForm.getEmail());
        
        return content.toString();
    }

    private String buildThankYouEmailContent(ContactFormDTO contactForm) {
        StringBuilder content = new StringBuilder();
        content.append("Dear ").append(contactForm.getName()).append(",\n\n");
        content.append("Thank you for your interest in Tech Tammina CRM!\n\n");
        content.append("We have received your message and our team will get back to you within 24 hours. ");
        content.append("We're excited to help you transform your sales process and deliver excellence.\n\n");
        content.append("Here's a summary of your message:\n");
        content.append("Subject: ").append(contactForm.getSubject() != null ? contactForm.getSubject() : "General Inquiry").append("\n");
        content.append("Message: ").append(contactForm.getMessage()).append("\n\n");
        content.append("In the meantime, feel free to:\n");
        content.append("• Explore our platform features\n");
        content.append("• Start your free trial\n");
        content.append("• Check out our documentation\n\n");
        content.append("If you have any urgent questions, please don't hesitate to call us at +91 98765 43210.\n\n");
        content.append("Best regards,\n");
        content.append("The Tech Tammina Team\n");
        content.append("Delivering Excellence in Sales Management\n\n");
        content.append("--\n");
        content.append("Tech Tammina CRM\n");
        content.append("SVS Towers, Visakhapatnam, Andhra Pradesh - 530016, India\n");
        content.append("Email: crms-noreply@tammina.in\n");
        content.append("Phone: +91 98765 43210");
        
        return content.toString();
    }
}

