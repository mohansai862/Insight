package com.techtammina.crm.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired; 
import org.springframework.stereotype.Service;

import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.Lead;
import com.techtammina.crm.entity.Notification;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.DealRepository;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.NotificationRepository;
import com.techtammina.crm.repository.UsersRepository;

import lombok.extern.slf4j.Slf4j;
 
@Slf4j
@Service
public class DealService {
 
    private static final Logger log = LoggerFactory.getLogger(DealService.class);
 
    private final DealRepository dealRepository;
    private final EmailService emailService;
    private final LeadRepository leadRepository;
    private final SalesManagerService salesManagerService;
    private final CrmLifecycleService crmLifecycleService;
    private final UsersRepository usersRepository;
    private final NotificationService notificationService;
    private final NotificationRepository notificationRepository;
 
    @Autowired
    public DealService(DealRepository dealRepository, EmailService emailService, LeadRepository leadRepository,
            SalesManagerService salesManagerService, CrmLifecycleService crmLifecycleService,
            UsersRepository usersRepository, NotificationService notificationService,
            NotificationRepository notificationRepository) {
        this.dealRepository = dealRepository;
        this.emailService = emailService;
        this.leadRepository = leadRepository;
        this.salesManagerService = salesManagerService;
        this.crmLifecycleService = crmLifecycleService;
        this.usersRepository = usersRepository;
        this.notificationService = notificationService;
        this.notificationRepository = notificationRepository;
    }
 
    public List<Deal> findAll() {
        try {
            List<Deal> deals = dealRepository.findAll();
            log.info("Fetched {} deals from database", deals.size());
            // Debug: Log each deal's stage
            for (Deal deal : deals) {
                log.info("Deal: {} - Stage: {} - Account: {}", 
                    deal.getDealName(), 
                    deal.getStage(), 
                    deal.getAccount() != null ? deal.getAccount().getAccountName() : "NULL");
            }
            return deals;
        } catch (Exception e) {
            log.error("Error fetching deals from database", e);
            return java.util.List.of();
        }
    }
 
    public Optional<Deal> findById(Integer id) {
        try {
            Optional<Deal> deal = dealRepository.findByIdWithRelations(id);
            if (deal.isEmpty()) {
                // Fallback to regular findById if the custom query fails
                deal = dealRepository.findById(id);
            }
            log.debug("Fetched deal by id {}: {}", id, deal.isPresent());
            return deal;
        } catch (Exception e) {
            log.error("Error fetching deal by id {}, returning empty", id, e);
            return Optional.empty();
        }
    }
 
    public Deal save(Deal deal) {
        try {
            log.debug("Saving deal: {}", deal);
 
            Deal savedDeal = dealRepository.save(deal);
 
            // CRM Lifecycle: Handle automatic type transitions
            if (savedDeal.getStage() == Deal.Stage.Closed_Won) {
                crmLifecycleService.onDealClosed(savedDeal);
            }
 
            // Always send email if deal is Closed Won or Closed Lost (simplified approach)
            if (savedDeal.getStage() == Deal.Stage.Closed_Won || savedDeal.getStage() == Deal.Stage.Closed_Lost) {
                log.info("Deal closed with stage: {}", savedDeal.getStage());
                sendDealClosureEmail(savedDeal);
 
                if (savedDeal.getStage() == Deal.Stage.Closed_Won) {
                    sendDealWonNotifications(savedDeal);
                }
            }
 
            return savedDeal;
        } catch (Exception e) {
            log.error("Error saving deal, returning as-is", e);
            // Return the deal as-is for frontend to handle
            return deal;
        }
    }
 
    private void sendDealClosureEmail(Deal deal) {
        try {
            // Reload deal with relationships to ensure account/contact are loaded
            Deal fullDeal = dealRepository.findById(deal.getDealId()).orElse(deal);
 
            String customerEmail = null;
            String customerName = "Valued Customer";
 
            log.debug("Processing deal closure email for: {}", fullDeal.getDealName());
 
            // Try to find the original lead first (most reliable for converted leads)
            List<Lead> convertedLeads = leadRepository.findByConvertedDealId(fullDeal.getDealId());
            if (!convertedLeads.isEmpty()) {
                Lead originalLead = convertedLeads.get(0);
                if (originalLead.getEmail() != null) {
                    customerEmail = originalLead.getEmail();
                    customerName = originalLead.getFirstName() + " " + originalLead.getLastName();
                    log.debug("Using original lead email for deal closure: {}", customerEmail);
                }
            }
 
            // Fallback to contact email
            if (customerEmail == null && fullDeal.getContact() != null && fullDeal.getContact().getEmail() != null) {
                customerEmail = fullDeal.getContact().getEmail();
                customerName = fullDeal.getContact().getFirstName() + " " + fullDeal.getContact().getLastName();
                log.debug("Using contact email for deal closure: {}", customerEmail);
            }
 
            // Fallback to account email
            if (customerEmail == null && fullDeal.getAccount() != null && fullDeal.getAccount().getEmail() != null) {
                customerEmail = fullDeal.getAccount().getEmail();
                customerName = fullDeal.getAccount().getContactName();
                log.debug("Using account email for deal closure: {}", customerEmail);
            }
 
            if (customerEmail != null && !customerEmail.trim().isEmpty()) {
                if (fullDeal.getStage() == Deal.Stage.Closed_Won) {
                    sendClosedWonEmail(fullDeal, customerEmail, customerName);
                } else if (fullDeal.getStage() == Deal.Stage.Closed_Lost) {
                    sendClosedLostEmail(fullDeal, customerEmail, customerName);
                }
            } else {
                log.warn("No email found for deal closure notification: {} (checked lead, contact, account)",
                        fullDeal.getDealName());
            }
        } catch (Exception e) {
            log.error("Failed to send deal closure email for deal: {}", deal.getDealName(), e);
        }
    }
 
    private String formatCurrency(java.math.BigDecimal value) {
        if (value == null) return "N/A";
        
        long longValue = value.longValue();
        if (longValue >= 1_000_000_000) {
            return String.format("%.1fB", longValue / 1_000_000_000.0);
        } else if (longValue >= 1_000_000) {
            return String.format("%.1fM", longValue / 1_000_000.0);
        } else if (longValue >= 1_000) {
            return String.format("%.1fK", longValue / 1_000.0);
        } else {
            return longValue + "";
        }
    }

    private void sendClosedWonEmail(Deal deal, String customerEmail, String customerName) {
        String subject = "Congratulations! Your Deal is Won - Tech Tammina";
        String body = String.format(
                "Dear %s,\n\n" +
                        "Fantastic News! We're thrilled to inform you that your deal has been successfully closed!\n\n" +
                        "Deal Details:\n" +
                        "Deal Name: %s\n" +
                        "Deal Value: $%s\n" +
                        "Company: %s\n" +
                        "Closed Date: %s\n\n" +
                        "What's Next:\n" +
                        "- Our implementation team will contact you within 24 hours\n" +
                        "- You'll receive detailed project timeline and milestones\n" +
                        "- Dedicated project manager will be assigned\n" +
                        "- Welcome package with all necessary resources\n\n" +
                        "We're excited to start this journey with you and deliver exceptional results!\n\n" +
                        "Thank you for choosing Tech Tammina!\n\n" +
                        "Best regards,\n" +
                        "Tech Tammina Sales Team\n" +
                        "Phone: +1-800-TECH-CRM\n" +
                        "Email: success@techtammina.com",
                customerName,
                deal.getDealName(),
                formatCurrency(deal.getDealValue()),
                deal.getAccount() != null ? deal.getAccount().getAccountName() : "N/A",
                deal.getClosedDate() != null ? deal.getClosedDate().toString() : "Today");
 
        emailService.sendEmail(customerEmail, null, subject, body);
        log.info("Closed Won email sent to: {}", customerEmail);
    }
 
    private void sendClosedLostEmail(Deal deal, String customerEmail, String customerName) {
        String subject = "Thank You for Your Interest - Tech Tammina";
        String body = String.format(
                "Dear %s,\n\n" +
                        "Thank you for considering Tech Tammina for your business needs.\n\n" +
                        "While we understand that our proposal for '%s' wasn't selected this time, " +
                        "we truly appreciate the opportunity to present our solutions to you.\n\n" +
                        "We'd love to stay connected:\n" +
                        "- We're always here if your requirements change\n" +
                        "- Feel free to reach out for future projects\n" +
                        "- We continuously improve our offerings based on feedback\n" +
                        "- Your success remains our priority\n\n" +
                        "If you have any feedback about our proposal or process, we'd greatly appreciate hearing from you. " +
                        "It helps us serve future clients better.\n\n" +
                        "We wish you all the best with your chosen solution and hope our paths cross again in the future.\n\n" +
                        "Warm regards,\n" +
                        "Tech Tammina Sales Team\n" +
                        "Phone: +1-800-TECH-CRM\n" +
                        "Email: sales@techtammina.com\n" +
                        "Website: www.techtammina.com",
                customerName,
                deal.getDealName());
 
        emailService.sendEmail(customerEmail, null, subject, body);
        log.info("Closed Lost email sent to: {}", customerEmail);
    }
 
    public void deleteById(Integer id) {
        try {
            log.debug("Deleting deal by id: {}", id);
            dealRepository.deleteById(id);
        } catch (Exception e) {
            log.error("Error deleting deal by id {}", id, e);
            // Silently ignore delete errors
        }
    }
 
    public List<Deal> findByAccountId(Integer accountId) {
        try {
            List<Deal> deals = dealRepository.findByAccount_AccountId(accountId);
            log.debug("Fetched {} deals for accountId {}", deals.size(), accountId);
            return deals;
        } catch (Exception e) {
            log.error("Error fetching deals for accountId {}, returning empty list", accountId, e);
            return java.util.List.of();
        }
    }
 
    public List<Deal> findByContactId(Integer contactId) {
        try {
            List<Deal> deals = dealRepository.findByContact_ContactId(contactId);
            log.debug("Fetched {} deals for contactId {}", deals.size(), contactId);
            return deals;
        } catch (Exception e) {
            log.error("Error fetching deals for contactId {}, returning empty list", contactId, e);
            return java.util.List.of();
        }
    }
 
    public List<Deal> findByNameContaining(String name) {
        try {
            List<Deal> deals = dealRepository.findByDealNameContainingIgnoreCase(name);
            log.debug("Fetched {} deals containing name '{}'", deals.size(), name);
            return deals;
        } catch (Exception e) {
            log.error("Error fetching deals containing name '{}', returning empty list", name, e);
            return java.util.List.of();
        }
    }
 
    public List<Deal> findFiltered(String search, Integer userId, String userRole) {
        String role = (userRole == null ? "" : userRole).trim();
        String normalized = role.toUpperCase().replace(' ', '_');
        
        log.debug("\nDEAL FILTERING DEBUG:");
        log.debug("User ID: {}", userId);
        log.debug("User Role: {}", userRole);
        log.debug("Normalized Role: {}", normalized);
        log.debug("Search: {}", search);
        
        try {
            if ("IT_ADMIN".equals(normalized)) {
                List<Deal> allDeals = dealRepository.findAll();
                log.debug("IT_ADMIN: Returning {} deals", allDeals.size());
                return allDeals;
            }
            if ("SALES_VP".equals(normalized)) {
                // VP sees: deals belonging to their hierarchy (executives under their managers)
                List<Integer> hierarchyUserIds = salesManagerService.findHierarchyUserIdsByVpId(userId);
                List<Deal> vpDeals = getDealsForHierarchy(hierarchyUserIds, search);
                log.debug("SALES_VP: Returning {} deals", vpDeals.size());
                return vpDeals;
            }
            if ("SALES_MANAGER".equals(normalized)) {
                // Manager sees: deals belonging to their executives
                List<Integer> executiveIds = salesManagerService.getExecutivesUnderManager(userId)
                    .stream()
                    .map(dto -> dto.getUserId())
                    .collect(Collectors.toList());
                if (executiveIds.isEmpty()) {
                    return List.of();
                }
                List<Deal> managerDeals = getDealsForHierarchy(executiveIds, search);
                log.debug("SALES_MANAGER: Returning {} deals", managerDeals.size());
                return managerDeals;
            }
            if ("SALES_EXECUTIVE".equals(normalized)) {
                // Executive sees: deals assigned to them (reassignTo) OR deals created by them (only if not assigned to someone else)
                List<Deal> execDeals = dealRepository.findAll().stream()
                    .filter(deal -> {
                        boolean isAssigned = deal.getReassignTo() != null && deal.getReassignTo().getUserId().equals(userId);
                        boolean isCreatedBy = deal.getCreatedBy() != null && deal.getCreatedBy().getUserId().equals(userId);
                        
                        // If deal is created by sales executive and assigned to someone else, only show to assigned user
                        if (deal.getCreatedBy() != null && "Sales_Executive".equals(deal.getCreatedBy().getRole()) && 
                            deal.getReassignTo() != null && !deal.getReassignTo().getUserId().equals(userId)) {
                            return false; // Don't show to creator if assigned to someone else
                        }
                        
                        return isAssigned || isCreatedBy;
                    })
                    .collect(Collectors.toList());
                log.debug("SALES_EXECUTIVE: Returning {} deals", execDeals.size());
                return execDeals;
            }
            log.debug("UNKNOWN ROLE: Returning empty list");
            return List.of();
        } catch (Exception e) {
            log.error("Error filtering deals for userId {}, returning empty list", userId, e);
            return java.util.List.of();
        }
    }
 
    private List<Integer> getExecutiveIdsUnderVP(Integer vpId) {
        return salesManagerService.findHierarchyUserIdsByVpId(vpId);
    }
 
    private void sendDealWonNotifications(Deal deal) {
        try {
            // Get the executive who owns the deal
            Users executive = null;
            String executiveName = "Sales Executive";
 
            if (deal.getReassignTo() != null) {
                executive = deal.getReassignTo();
            } else if (deal.getCreatedBy() != null) {
                executive = deal.getCreatedBy();
            }
 
            if (executive != null) {
                executiveName = executive.getFirstName() + " " + executive.getLastName();
 
                // Use a Set to track users who have already been notified to prevent duplicates
                java.util.Set<Integer> notifiedUsers = new java.util.HashSet<>();
 
                // Send notification to the executive's manager
                if (executive.getManagerId() != null) {
                    createDealWonNotification(executive.getManagerId(), deal, executiveName, notifiedUsers);
 
                    // Send notification to the manager's VP (if exists)
                    Users manager = usersRepository.findById(executive.getManagerId()).orElse(null);
                    if (manager != null && manager.getManagerId() != null) {
                        createDealWonNotification(manager.getManagerId(), deal, executiveName, notifiedUsers);
                    }
                }
            }
 
        } catch (Exception e) {
            log.error("Failed to send deal won notifications for deal: {}", deal.getDealName(), e);
        }
    }
 
    private void createDealWonNotification(Integer userId, Deal deal, String executiveName,
            java.util.Set<Integer> notifiedUsers) {
        Users user = usersRepository.findById(userId).orElse(null);
        if (user == null)
            return;
 
        // Check if this user has already been notified in this batch
        if (notifiedUsers.contains(userId)) {
            log.debug("Skipping duplicate notification for user {} for deal {}", userId, deal.getDealName());
            return;
        }
 
        // Check if a notification already exists in the database for this user and deal
        String expectedMessage = String.format(
                "%s closed deal '%s' worth $%s from %s",
                executiveName,
                deal.getDealName(),
                formatCurrency(deal.getDealValue()),
                deal.getAccount() != null ? deal.getAccount().getAccountName() : "N/A");
 
        List<Notification> existingNotifications = notificationRepository.findByUser_UserIdAndTypeAndMessage(
                userId,
                "DEAL_WON",
                expectedMessage);
 
        if (!existingNotifications.isEmpty()) {
            log.debug("Notification already exists for user {} for deal {}", userId, deal.getDealName());
            return;
        }
 
        // Create and save the notification
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("Deal Won!");
        notification.setMessage(expectedMessage);
        notification.setType("DEAL_WON");
        notification.setIsRead(false);
 
        notificationRepository.save(notification);
        notifiedUsers.add(userId);
        log.info("Deal won notification sent to user {}: {}", userId, deal.getDealName());
    }
 

    private List<Deal> getDealsForHierarchy(List<Integer> userIds, String search) {
        log.debug("Hierarchy Deal Visibility - User IDs: {}", userIds);
        
        List<Deal> hierarchyDeals = dealRepository.findAll().stream()
            .filter(deal -> {
                // Deal belongs to hierarchy if:
                // 1. Created by someone in the hierarchy
                // 2. Assigned to someone in the hierarchy
                boolean isCreatedByHierarchy = deal.getCreatedBy() != null && userIds.contains(deal.getCreatedBy().getUserId());
                boolean isAssignedToHierarchy = deal.getReassignTo() != null && userIds.contains(deal.getReassignTo().getUserId());
                return isCreatedByHierarchy || isAssignedToHierarchy;
            })
            .collect(Collectors.toList());
        
        log.debug("Total hierarchy visible deals: {}", hierarchyDeals.size());
        return hierarchyDeals.stream()
            .distinct()
            .collect(Collectors.toList());
    }
    

}