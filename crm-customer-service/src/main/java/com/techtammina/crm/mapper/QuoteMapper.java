package com.techtammina.crm.mapper;

import com.techtammina.crm.dto.QuoteDTO;
import com.techtammina.crm.dto.QuoteLineItemDTO;
import com.techtammina.crm.entity.Quote;
import com.techtammina.crm.entity.QuoteLineItem;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
public class QuoteMapper {

    public QuoteDTO toDTO(Quote quote) {
        if (quote == null) return null;
        
        QuoteDTO dto = new QuoteDTO();
        dto.setQuoteId(quote.getQuoteId());
        dto.setQuoteNumber(quote.getQuoteNumber());
        dto.setDealId(quote.getDeal() != null ? quote.getDeal().getDealId() : null);
        dto.setDealName(quote.getDeal() != null ? quote.getDeal().getDealName() : null);
        dto.setAccountId(quote.getAccount().getAccountId());
        dto.setAccountName(quote.getAccount().getAccountName());
        dto.setContactId(quote.getContact() != null ? quote.getContact().getContactId() : null);
        dto.setContactName(quote.getContact() != null ? 
            quote.getContact().getFirstName() + " " + quote.getContact().getLastName() : null);
        dto.setCreatedById(quote.getCreatedBy().getUserId());
        dto.setCreatedByName(quote.getCreatedBy().getFirstName() + " " + quote.getCreatedBy().getLastName());
        dto.setCreatedDate(quote.getCreatedDate());
        dto.setExpirationDate(quote.getExpirationDate());
        dto.setStatus(quote.getStatus().name());
        dto.setTotalAmount(quote.getTotalAmount());
        dto.setDiscount(quote.getDiscount());
        dto.setTax(quote.getTax());
        dto.setGrandTotal(quote.getGrandTotal());
        dto.setTerms(quote.getTerms());
        dto.setNotes(quote.getNotes());
        dto.setValidUntil(quote.getValidUntil());
        
        if (quote.getLineItems() != null) {
            dto.setLineItems(quote.getLineItems().stream()
                .map(this::toLineItemDTO)
                .collect(Collectors.toList()));
        }
        
        return dto;
    }

    public QuoteLineItemDTO toLineItemDTO(QuoteLineItem lineItem) {
        if (lineItem == null) return null;
        
        QuoteLineItemDTO dto = new QuoteLineItemDTO();
        dto.setLineItemId(lineItem.getLineItemId());
        dto.setQuoteId(lineItem.getQuote().getQuoteId());
        dto.setProductId(lineItem.getProduct() != null ? lineItem.getProduct().getProductId() : null);
        dto.setProductName(lineItem.getProduct() != null ? lineItem.getProduct().getProductName() : null);
        dto.setProductCode(lineItem.getProduct() != null ? lineItem.getProduct().getProductCode() : null);
        dto.setDescription(lineItem.getDescription());
        dto.setQuantity(lineItem.getQuantity());
        dto.setUnitPrice(lineItem.getUnitPrice());
        dto.setDiscount(lineItem.getDiscount());
        dto.setLineTotal(lineItem.getLineTotal());
        dto.setSortOrder(lineItem.getSortOrder());
        
        return dto;
    }

    public List<QuoteDTO> toDTOList(List<Quote> quotes) {
        return quotes.stream().map(this::toDTO).collect(Collectors.toList());
    }
}

