package com.techtammina.crm.service;

import com.techtammina.crm.entity.DealValueHistory;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.repository.DealValueHistoryRepository;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.repository.DealRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class DealValueTrackingService {
    
    @Autowired
    private DealValueHistoryRepository repository;
    
    @Autowired
    private UsersRepository usersRepository;
    
    @Autowired
    private DealRepository dealRepository;
    
    public static class ValueChange {
        public BigDecimal previousValue;
        public BigDecimal newValue;
        public LocalDateTime timestamp;
        
        public ValueChange(BigDecimal previousValue, BigDecimal newValue, LocalDateTime timestamp) {
            this.previousValue = previousValue;
            this.newValue = newValue;
            this.timestamp = timestamp;
        }
    }
    
    public void recordOriginalValue(Integer dealId, BigDecimal originalValue) {
        if (!repository.findOriginalValueByDealId(dealId).isPresent()) {
            DealValueHistory history = new DealValueHistory(dealId, originalValue, "CREATION");
            repository.save(history);
        }
    }
    
    public void recordValueChange(Integer dealId, BigDecimal previousValue, BigDecimal newValue) {
        if (previousValue != null && newValue != null && previousValue.compareTo(newValue) == 0) {
            return;
        }
        // Ensure original value is recorded before recording changes
        BigDecimal originalValue = getOriginalValue(dealId);
        if (originalValue == null && previousValue != null) {
            recordOriginalValue(dealId, previousValue);
        }
        DealValueHistory history = new DealValueHistory(dealId, getOriginalValue(dealId), previousValue, newValue);
        repository.save(history);
    }
    
    public List<ValueChange> getValueChanges(Integer dealId) {
        List<DealValueHistory> updates = repository.findValueUpdatesByDealId(dealId);
        List<ValueChange> changes = new ArrayList<>();
        
        for (DealValueHistory update : updates) {
            changes.add(new ValueChange(update.getPreviousValue(), update.getNewValue(), update.getChangedAt()));
        }
        
        return changes;
    }
    
    public BigDecimal getOriginalValue(Integer dealId) {
        Optional<DealValueHistory> original = repository.findOriginalValueByDealId(dealId);
        return original.map(DealValueHistory::getOriginalValue).orElse(null);
    }
    
    public String getUserNameFromDeal(Integer dealId, LocalDateTime changeTime) {
        Deal deal = dealRepository.findById(dealId).orElse(null);
        if (deal == null) return "System";
        
        Users user = deal.getReassignTo() != null ? deal.getReassignTo() : deal.getCreatedBy();
        return user != null ? user.getFirstName() + " " + user.getLastName() : "System";
    }
}