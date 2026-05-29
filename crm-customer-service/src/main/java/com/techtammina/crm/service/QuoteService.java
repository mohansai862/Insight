package com.techtammina.crm.service;

import com.techtammina.crm.dto.QuoteDTO;
import com.techtammina.crm.dto.QuoteLineItemDTO;
import com.techtammina.crm.entity.*;
import com.techtammina.crm.mapper.QuoteMapper;
import com.techtammina.crm.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.techtammina.crm.entity.Deal;

@Service
@Transactional
public class QuoteService {

    private final QuoteRepository quoteRepository;
    private final QuoteLineItemRepository lineItemRepository;
    private final AccountRepository accountRepository;
    private final ContactRepository contactRepository;
    private final DealRepository dealRepository;
    private final UsersRepository usersRepository;
    private final ProductRepository productRepository;
    private final QuoteMapper quoteMapper;

    public QuoteService(QuoteRepository quoteRepository, QuoteLineItemRepository lineItemRepository,
                       AccountRepository accountRepository, ContactRepository contactRepository,
                       DealRepository dealRepository, UsersRepository usersRepository,
                       ProductRepository productRepository, QuoteMapper quoteMapper) {
        this.quoteRepository = quoteRepository;
        this.lineItemRepository = lineItemRepository;
        this.accountRepository = accountRepository;
        this.contactRepository = contactRepository;
        this.dealRepository = dealRepository;
        this.usersRepository = usersRepository;
        this.productRepository = productRepository;
        this.quoteMapper = quoteMapper;
    }

    public QuoteDTO createQuote(QuoteDTO quoteDTO, Integer userId) {
        Quote quote = new Quote();
        
        // Set relationships
        Account account = accountRepository.findById(quoteDTO.getAccountId())
            .orElseThrow(() -> new RuntimeException("Account not found"));
        quote.setAccount(account);
        
        if (quoteDTO.getContactId() != null) {
            Contact contact = contactRepository.findById(quoteDTO.getContactId())
                .orElseThrow(() -> new RuntimeException("Contact not found"));
            quote.setContact(contact);
        }
        
        if (quoteDTO.getDealId() != null) {
            Deal deal = dealRepository.findById(quoteDTO.getDealId())
                .orElseThrow(() -> new RuntimeException("Deal not found"));
            quote.setDeal(deal);
        }
        
        Users user = usersRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        quote.setCreatedBy(user);
        
        // Generate quote number
        String quoteNumber = generateQuoteNumber();
        quote.setQuoteNumber(quoteNumber);
        
        // Set other fields
        quote.setExpirationDate(quoteDTO.getExpirationDate());
        quote.setTerms(quoteDTO.getTerms());
        quote.setNotes(quoteDTO.getNotes());
        quote.setValidUntil(quoteDTO.getValidUntil());
        quote.setStatus(Quote.QuoteStatus.Draft);
        
        quote = quoteRepository.save(quote);
        
        // Save line items
        if (quoteDTO.getLineItems() != null) {
            for (QuoteLineItemDTO lineItemDTO : quoteDTO.getLineItems()) {
                createLineItem(quote, lineItemDTO);
            }
        }
        
        // Calculate totals
        calculateQuoteTotals(quote);
        
        return quoteMapper.toDTO(quote);
    }

    private void createLineItem(Quote quote, QuoteLineItemDTO lineItemDTO) {
        QuoteLineItem lineItem = new QuoteLineItem();
        lineItem.setQuote(quote);
        
        if (lineItemDTO.getProductId() != null) {
            Product product = productRepository.findById(lineItemDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found"));
            lineItem.setProduct(product);
        }
        
        lineItem.setDescription(lineItemDTO.getDescription());
        lineItem.setQuantity(lineItemDTO.getQuantity());
        lineItem.setUnitPrice(lineItemDTO.getUnitPrice());
        lineItem.setDiscount(lineItemDTO.getDiscount() != null ? lineItemDTO.getDiscount() : BigDecimal.ZERO);
        lineItem.setSortOrder(lineItemDTO.getSortOrder());
        
        lineItemRepository.save(lineItem);
    }

    private void calculateQuoteTotals(Quote quote) {
        List<QuoteLineItem> lineItems = lineItemRepository.findByQuoteIdOrderBySortOrder(quote.getQuoteId());
        
        BigDecimal totalAmount = lineItems.stream()
            .map(item -> item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()))
                .subtract(item.getDiscount() != null ? item.getDiscount() : BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        quote.setTotalAmount(totalAmount);
        
        BigDecimal discount = quote.getDiscount() != null ? quote.getDiscount() : BigDecimal.ZERO;
        BigDecimal tax = quote.getTax() != null ? quote.getTax() : BigDecimal.ZERO;
        BigDecimal grandTotal = totalAmount.subtract(discount).add(tax);
        
        quote.setGrandTotal(grandTotal);
        quoteRepository.save(quote);
    }

    /**
     * Generate unique quote number in format: QT-YYYY-MM-####
     * This method is synchronized to prevent duplicate quote numbers in concurrent scenarios
     */
    private synchronized String generateQuoteNumber() {
        LocalDate now = LocalDate.now();
        String prefix = String.format("QT-%04d-%02d-", now.getYear(), now.getMonthValue());
        
        // Find the highest quote number for current month
        String maxQuoteNumber = quoteRepository.findMaxQuoteNumberForMonth(prefix);
        
        int nextNumber = 1;
        if (maxQuoteNumber != null && !maxQuoteNumber.isEmpty()) {
            try {
                // Extract the last 4 digits from quote number
                String lastDigits = maxQuoteNumber.substring(maxQuoteNumber.length() - 4);
                nextNumber = Integer.parseInt(lastDigits) + 1;
            } catch (Exception e) {
                // If parsing fails, start from 1
                nextNumber = 1;
            }
        }
        
        // Generate new quote number
        String newQuoteNumber = String.format("%s%04d", prefix, nextNumber);
        
        // Double-check for uniqueness (safety net)
        while (quoteRepository.findByQuoteNumber(newQuoteNumber).isPresent()) {
            nextNumber++;
            newQuoteNumber = String.format("%s%04d", prefix, nextNumber);
        }
        
        return newQuoteNumber;
    }

    public Page<QuoteDTO> getAllQuotes(Pageable pageable, Integer userId, String userRole) {
        Page<Quote> quotes;
        
        if ("Sales_Executive".equals(userRole)) {
            quotes = quoteRepository.findByCreatedByUserId(userId, pageable);
        } else {
            quotes = quoteRepository.findAll(pageable);
        }
        
        return quotes.map(quoteMapper::toDTO);
    }

    public Optional<QuoteDTO> getQuoteById(Integer quoteId, Integer userId, String userRole) {
        Optional<Quote> quote = quoteRepository.findById(quoteId);
        
        if (quote.isPresent()) {
            Quote q = quote.get();
            // Check access permissions
            if ("Sales_Executive".equals(userRole) && !q.getCreatedBy().getUserId().equals(userId)) {
                return Optional.empty();
            }
            return Optional.of(quoteMapper.toDTO(q));
        }
        
        return Optional.empty();
    }

    public QuoteDTO updateQuoteStatus(Integer quoteId, Quote.QuoteStatus status, Integer userId, String userRole) {
        Quote quote = quoteRepository.findById(quoteId)
            .orElseThrow(() -> new RuntimeException("Quote not found"));
        
        // Check permissions
        if ("Sales_Executive".equals(userRole) && !quote.getCreatedBy().getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        quote.setStatus(status);
        quote = quoteRepository.save(quote);
        
        return quoteMapper.toDTO(quote);
    }

    public List<QuoteDTO> getQuotesByDealId(Integer dealId) {
        List<Quote> quotes = quoteRepository.findByDealId(dealId);
        return quoteMapper.toDTOList(quotes);
    }

    public void deleteQuote(Integer quoteId, Integer userId, String userRole) {
        Quote quote = quoteRepository.findById(quoteId)
            .orElseThrow(() -> new RuntimeException("Quote not found"));
        
        // Check permissions
        if ("Sales_Executive".equals(userRole) && !quote.getCreatedBy().getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        quoteRepository.delete(quote);
    }

    public QuoteDTO updateQuote(Integer quoteId, QuoteDTO quoteDTO, Integer userId, String userRole) {
        Quote quote = quoteRepository.findById(quoteId)
            .orElseThrow(() -> new RuntimeException("Quote not found"));
        
        // Check permissions
        if ("Sales_Executive".equals(userRole) && !quote.getCreatedBy().getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Cannot edit sent quotes
        if (quote.getStatus() != Quote.QuoteStatus.Draft) {
            throw new RuntimeException("Cannot edit quote that has been sent");
        }
        
        // Update quote fields
        quote.setExpirationDate(quoteDTO.getExpirationDate());
        quote.setTerms(quoteDTO.getTerms());
        quote.setNotes(quoteDTO.getNotes());
        quote.setValidUntil(quoteDTO.getValidUntil());
        quote.setDiscount(quoteDTO.getDiscount());
        quote.setTax(quoteDTO.getTax());
        
        // Update line items
        if (quoteDTO.getLineItems() != null) {
            // Delete existing line items
            lineItemRepository.deleteByQuoteId(quoteId);
            
            // Add new line items
            for (QuoteLineItemDTO lineItemDTO : quoteDTO.getLineItems()) {
                createLineItem(quote, lineItemDTO);
            }
        }
        
        // Recalculate totals
        calculateQuoteTotals(quote);
        
        return quoteMapper.toDTO(quote);
    }

    public String convertQuoteToDeal(Integer quoteId, Integer userId, String userRole) {
        Quote quote = quoteRepository.findById(quoteId)
            .orElseThrow(() -> new RuntimeException("Quote not found"));
        
        // Check permissions
        if ("Sales_Executive".equals(userRole) && !quote.getCreatedBy().getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Quote must be accepted to convert
        if (quote.getStatus() != Quote.QuoteStatus.Accepted) {
            throw new RuntimeException("Only accepted quotes can be converted to deals");
        }
        
        // Create deal from quote
        Deal deal = new Deal();
        deal.setDealName("Deal from Quote " + quote.getQuoteNumber());
        deal.setAccount(quote.getAccount());
        deal.setContact(quote.getContact());
        deal.setDealValue(quote.getGrandTotal());
        deal.setCreatedBy(quote.getCreatedBy());
        deal.setStage(Deal.Stage.Proposal);
        deal.setProbability(90);
        
        deal = dealRepository.save(deal);
        
        // Link quote to deal
        quote.setDeal(deal);
        quoteRepository.save(quote);
        
        return "Quote converted to deal successfully. Deal ID: " + deal.getDealId();
    }

    public byte[] generateQuotePDF(Integer quoteId, Integer userId, String userRole) {
        Quote quote = quoteRepository.findById(quoteId)
            .orElseThrow(() -> new RuntimeException("Quote not found"));
        
        // Check permissions
        if ("Sales_Executive".equals(userRole) && !quote.getCreatedBy().getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // For now, return a simple PDF placeholder
        // In production, use iText or Apache PDFBox to generate actual PDF
        String pdfContent = "Quote PDF for " + quote.getQuoteNumber();
        return pdfContent.getBytes();
    }

    public QuoteDTO duplicateQuote(Integer quoteId, Integer userId, String userRole) {
        Quote originalQuote = quoteRepository.findById(quoteId)
            .orElseThrow(() -> new RuntimeException("Quote not found"));
        
        // Check permissions
        if ("Sales_Executive".equals(userRole) && !originalQuote.getCreatedBy().getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }
        
        // Create new quote
        Quote newQuote = new Quote();
        newQuote.setAccount(originalQuote.getAccount());
        newQuote.setContact(originalQuote.getContact());
        newQuote.setDeal(originalQuote.getDeal());
        newQuote.setCreatedBy(originalQuote.getCreatedBy());
        newQuote.setTerms(originalQuote.getTerms());
        newQuote.setNotes("Duplicated from " + originalQuote.getQuoteNumber());
        newQuote.setValidUntil(originalQuote.getValidUntil());
        newQuote.setStatus(Quote.QuoteStatus.Draft);
        
        String quoteNumber = generateQuoteNumber();
        newQuote.setQuoteNumber(quoteNumber);
        
        newQuote = quoteRepository.save(newQuote);
        
        // Duplicate line items
        List<QuoteLineItem> originalLineItems = lineItemRepository.findByQuoteIdOrderBySortOrder(quoteId);
        for (QuoteLineItem originalItem : originalLineItems) {
            QuoteLineItem newItem = new QuoteLineItem();
            newItem.setQuote(newQuote);
            newItem.setProduct(originalItem.getProduct());
            newItem.setDescription(originalItem.getDescription());
            newItem.setQuantity(originalItem.getQuantity());
            newItem.setUnitPrice(originalItem.getUnitPrice());
            newItem.setDiscount(originalItem.getDiscount());
            newItem.setSortOrder(originalItem.getSortOrder());
            
            lineItemRepository.save(newItem);
        }
        
        // Calculate totals
        calculateQuoteTotals(newQuote);
        
        return quoteMapper.toDTO(newQuote);
    }
}

