package com.techtammina.crm.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import jakarta.servlet.http.HttpServletRequest;

@Controller
public class FrontendController {
    
    /**
     * Forward all non-API routes to React's index.html
     * This allows React Router to handle client-side routing
     */
    @RequestMapping(value = {
        "/", 
        "/crm/**", 
        "/login", 
        "/signup", 
        "/forgot-password",
        "/settings/**",
        "/profile/**"
    })
    public String forward(HttpServletRequest request) {
        // Don't forward API requests or static assets
        String path = request.getRequestURI();
        if (path.startsWith("/api/") || path.startsWith("/assets/")) {
            return null;
        }
        return "forward:/index.html";
    }
    
    /**
     * Serve favicon with correct content type
     */
    @GetMapping("/favicon.svg")
    public ResponseEntity<Resource> favicon() {
        Resource resource = new ClassPathResource("static/favicon.svg");
        return ResponseEntity.ok()
                .contentType(MediaType.valueOf("image/svg+xml"))
                .body(resource);
    }
}

