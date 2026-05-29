package com.techtammina.crm.controller;

import com.techtammina.crm.dto.QuoteDTO;
import com.techtammina.crm.entity.Quote;
import com.techtammina.crm.service.QuoteService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpHeaders;

@RestController
@RequestMapping("/api/quotes")
public class QuoteController {

    private final QuoteService quoteService;

    public QuoteController(QuoteService quoteService) {
        this.quoteService = quoteService;
    }

    @PostMapping
    public ResponseEntity<QuoteDTO> createQuote(@RequestBody QuoteDTO quoteDTO, HttpServletRequest request) {
        Integer userId = (Integer) request.getAttribute("userId");
        QuoteDTO result = quoteService.createQuote(quoteDTO, userId);
        return ResponseEntity.ok(result);
    }

    @GetMapping
    public ResponseEntity<Page<QuoteDTO>> getAllQuotes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdDate") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        // Validate sortBy parameter to prevent SQL injection
        String validatedSortBy = validateSortField(sortBy);
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
            Sort.by(validatedSortBy).descending() : Sort.by(validatedSortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<QuoteDTO> quotes = quoteService.getAllQuotes(pageable, userId, userRole);
        return ResponseEntity.ok(quotes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuoteDTO> getQuoteById(@PathVariable Integer id,
                                                @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        return quoteService.getQuoteById(id, userId, userRole)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<QuoteDTO> updateQuote(@PathVariable Integer id, 
                                               @RequestBody QuoteDTO quoteDTO,
                                               @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                               @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        QuoteDTO result = quoteService.updateQuote(id, quoteDTO, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuote(@PathVariable Integer id,
                                           @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                           @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        quoteService.deleteQuote(id, userId, userRole);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/send")
    public ResponseEntity<QuoteDTO> sendQuote(@PathVariable Integer id,
                                             @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                             @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        QuoteDTO result = quoteService.updateQuoteStatus(id, Quote.QuoteStatus.Sent, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<QuoteDTO> acceptQuote(@PathVariable Integer id,
                                               @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                               @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        QuoteDTO result = quoteService.updateQuoteStatus(id, Quote.QuoteStatus.Accepted, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<QuoteDTO> rejectQuote(@PathVariable Integer id,
                                               @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                               @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        QuoteDTO result = quoteService.updateQuoteStatus(id, Quote.QuoteStatus.Rejected, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/deal/{dealId}")
    public ResponseEntity<List<QuoteDTO>> getQuotesByDeal(@PathVariable Integer dealId) {
        List<QuoteDTO> quotes = quoteService.getQuotesByDealId(dealId);
        return ResponseEntity.ok(quotes);
    }

    @PostMapping("/{id}/convert-to-deal")
    public ResponseEntity<String> convertQuoteToDeal(@PathVariable Integer id,
                                                    @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                    @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        String result = quoteService.convertQuoteToDeal(id, userId, userRole);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> generateQuotePDF(@PathVariable Integer id,
                                                  @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                  @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        byte[] pdfBytes = quoteService.generateQuotePDF(id, userId, userRole);
        return ResponseEntity.ok()
            .header("Content-Type", "application/pdf")
            .header("Content-Disposition", "attachment; filename=quote-" + id + ".pdf")
            .body(pdfBytes);
    }

    @PostMapping("/{id}/duplicate")
    public ResponseEntity<QuoteDTO> duplicateQuote(@PathVariable Integer id,
                                                  @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                  @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Default values for testing
        if (userId == null) userId = 1;
        if (userRole == null) userRole = "Sales_Manager";
        
        QuoteDTO result = quoteService.duplicateQuote(id, userId, userRole);
        return ResponseEntity.ok(result);
    }

    private String validateSortField(String sortBy) {
        // Whitelist of allowed sort fields to prevent SQL injection
        java.util.Set<String> allowedFields = java.util.Set.of(
            "createdDate", "modifiedDate", "quoteName", "totalAmount", "status"
        );
        return allowedFields.contains(sortBy) ? sortBy : "createdDate";
    }
}

