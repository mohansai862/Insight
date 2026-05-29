package com.techtammina.crm.controller;

import com.techtammina.crm.dto.ContactFormDTO;
import com.techtammina.crm.service.ContactFormService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.Map;

@RestController
@RequestMapping("/api/contact-form")
@CrossOrigin(origins = "*")
public class ContactFormController {

    @Autowired
    private ContactFormService contactFormService;

    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitContactForm(@Valid @RequestBody ContactFormDTO contactFormDTO) {
        try {
            contactFormService.processContactForm(contactFormDTO);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Thank you for your message! We'll get back to you within 24 hours."
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "Failed to send message. Please try again."
            ));
        }
    }
}

