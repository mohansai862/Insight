package com.techtammina.crm.service;

import com.techtammina.crm.entity.*;
import com.techtammina.crm.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class DataReassignmentService {

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    private LeadRepository leadRepository;
    
    @Autowired
    private DealRepository dealRepository;
    
    @Autowired
    private AccountRepository accountRepository;
    
    @Autowired
    private ContactRepository contactRepository;
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private UsersRepository usersRepository;

    @Transactional
    public void reassignUserData(Integer fromUserId, Integer toUserId) {
        Users fromUser = usersRepository.findById(fromUserId).orElse(null);
        Users toUser = usersRepository.findById(toUserId).orElse(null);
        
        if (fromUser == null || toUser == null) {
            throw new IllegalArgumentException("Invalid user IDs");
        }

        System.out.println("=== TRANSFERRING ALL DATA ===");
        System.out.println("From: " + fromUser.getFirstName() + " (ID: " + fromUserId + ")");
        System.out.println("To: " + toUser.getFirstName() + " (ID: " + toUserId + ")");
        
        // Transfer manager hierarchies if needed
        if ("Sales_Manager".equals(fromUser.getRole())) {
            jakarta.persistence.Query updateExecutives = entityManager.createNativeQuery("UPDATE users SET manager_id = ?1 WHERE manager_id = ?2 AND role = 'Sales_Executive'");
            updateExecutives.setParameter(1, toUserId);
            updateExecutives.setParameter(2, fromUserId);
            int executivesReassigned = updateExecutives.executeUpdate();
            System.out.println("Reassigned " + executivesReassigned + " executives to new manager");
        } else if ("Sales_VP".equals(fromUser.getRole())) {
            // When VP is reassigned, transfer all managers under them to new VP
            jakarta.persistence.Query updateManagers = entityManager.createNativeQuery("UPDATE users SET manager_id = ?1 WHERE manager_id = ?2 AND role = 'Sales_Manager'");
            updateManagers.setParameter(1, toUserId);
            updateManagers.setParameter(2, fromUserId);
            int managersReassigned = updateManagers.executeUpdate();
            System.out.println("Reassigned " + managersReassigned + " managers to new VP");
        }
        
        // Transfer ALL data using native SQL
        System.out.println("Transferring all data types...");
        
        // Leads - update with proper reassignment logic
        // If created_by is Sales_VP or Sales_Manager: only update assigned_to
        jakarta.persistence.Query updateLeadsAssignFromVPManager = entityManager.createNativeQuery(
            "UPDATE leads l JOIN users u ON l.created_by = u.user_id " +
            "SET l.assigned_to = ?1 WHERE l.assigned_to = ?2 AND u.role IN ('Sales_VP', 'Sales_Manager')");
        updateLeadsAssignFromVPManager.setParameter(1, toUserId);
        updateLeadsAssignFromVPManager.setParameter(2, fromUserId);
        int leadsAssignedFromVPManager = updateLeadsAssignFromVPManager.executeUpdate();
        
        // If created_by is Sales_Executive: update both created_by and assigned_to
        jakarta.persistence.Query updateLeadsFromExecutive = entityManager.createNativeQuery(
            "UPDATE leads l JOIN users u ON l.created_by = u.user_id " +
            "SET l.created_by = ?1, l.assigned_to = ?1 WHERE l.created_by = ?2 AND u.role = 'Sales_Executive'");
        updateLeadsFromExecutive.setParameter(1, toUserId);
        updateLeadsFromExecutive.setParameter(2, fromUserId);
        int leadsFromExecutiveUpdated = updateLeadsFromExecutive.executeUpdate();
        
        // Also handle any remaining assigned_to updates for leads not covered above
        jakarta.persistence.Query updateLeadsAssignedRemaining = entityManager.createNativeQuery(
            "UPDATE leads SET assigned_to = ?1 WHERE assigned_to = ?2 AND created_by != ?2");
        updateLeadsAssignedRemaining.setParameter(1, toUserId);
        updateLeadsAssignedRemaining.setParameter(2, fromUserId);
        int leadsAssignedRemaining = updateLeadsAssignedRemaining.executeUpdate();
        
        // Deals - update both created_by and reassign_to
        jakarta.persistence.Query updateDealsCreated = entityManager.createNativeQuery("UPDATE deals SET created_by = ?1 WHERE created_by = ?2");
        updateDealsCreated.setParameter(1, toUserId);
        updateDealsCreated.setParameter(2, fromUserId);
        int dealsCreatedUpdated = updateDealsCreated.executeUpdate();
        
        jakarta.persistence.Query updateDealsReassigned = entityManager.createNativeQuery("UPDATE deals SET reassign_to = ?1 WHERE reassign_to = ?2");
        updateDealsReassigned.setParameter(1, toUserId);
        updateDealsReassigned.setParameter(2, fromUserId);
        int dealsReassignedUpdated = updateDealsReassigned.executeUpdate();
        
        // Accounts - update both created_by and reassign_to
        jakarta.persistence.Query updateAccountsCreated = entityManager.createNativeQuery("UPDATE accounts SET created_by = ?1 WHERE created_by = ?2");
        updateAccountsCreated.setParameter(1, toUserId);
        updateAccountsCreated.setParameter(2, fromUserId);
        int accountsCreatedUpdated = updateAccountsCreated.executeUpdate();
        
        jakarta.persistence.Query updateAccountsReassigned = entityManager.createNativeQuery("UPDATE accounts SET reassign_to = ?1 WHERE reassign_to = ?2");
        updateAccountsReassigned.setParameter(1, toUserId);
        updateAccountsReassigned.setParameter(2, fromUserId);
        int accountsReassignedUpdated = updateAccountsReassigned.executeUpdate();
        
        // Contacts - update with proper reassignment logic
        // If created_by is Sales_VP or Sales_Manager: only update reassign_to
        jakarta.persistence.Query updateContactsReassignFromVPManager = entityManager.createNativeQuery(
            "UPDATE contacts c JOIN users u ON c.created_by = u.user_id " +
            "SET c.reassign_to = ?1 WHERE c.reassign_to = ?2 AND u.role IN ('Sales_VP', 'Sales_Manager')");
        updateContactsReassignFromVPManager.setParameter(1, toUserId);
        updateContactsReassignFromVPManager.setParameter(2, fromUserId);
        int contactsReassignedFromVPManager = updateContactsReassignFromVPManager.executeUpdate();
        
        // If created_by is Sales_Executive: update both created_by and reassign_to
        jakarta.persistence.Query updateContactsFromExecutive = entityManager.createNativeQuery(
            "UPDATE contacts c JOIN users u ON c.created_by = u.user_id " +
            "SET c.created_by = ?1, c.reassign_to = ?1 WHERE c.created_by = ?2 AND u.role = 'Sales_Executive'");
        updateContactsFromExecutive.setParameter(1, toUserId);
        updateContactsFromExecutive.setParameter(2, fromUserId);
        int contactsFromExecutiveUpdated = updateContactsFromExecutive.executeUpdate();
        
        // Also handle any remaining reassign_to updates for contacts not covered above
        jakarta.persistence.Query updateContactsReassignedRemaining = entityManager.createNativeQuery(
            "UPDATE contacts SET reassign_to = ?1 WHERE reassign_to = ?2 AND created_by != ?2");
        updateContactsReassignedRemaining.setParameter(1, toUserId);
        updateContactsReassignedRemaining.setParameter(2, fromUserId);
        int contactsReassignedRemaining = updateContactsReassignedRemaining.executeUpdate();
        
        // Tasks - update both created_by and assigned_to
        jakarta.persistence.Query updateTasksCreated = entityManager.createNativeQuery("UPDATE tasks SET created_by = ?1 WHERE created_by = ?2");
        updateTasksCreated.setParameter(1, toUserId);
        updateTasksCreated.setParameter(2, fromUserId);
        int tasksCreatedUpdated = updateTasksCreated.executeUpdate();
        
        jakarta.persistence.Query updateTasksAssigned = entityManager.createNativeQuery("UPDATE tasks SET assigned_to = ?1 WHERE assigned_to = ?2");
        updateTasksAssigned.setParameter(1, toUserId);
        updateTasksAssigned.setParameter(2, fromUserId);
        int tasksAssignedUpdated = updateTasksAssigned.executeUpdate();
        
        // Notifications - update user_id
        jakarta.persistence.Query updateNotifications = entityManager.createNativeQuery("UPDATE notifications SET user_id = ?1 WHERE user_id = ?2");
        updateNotifications.setParameter(1, toUserId);
        updateNotifications.setParameter(2, fromUserId);
        int notificationsUpdated = updateNotifications.executeUpdate();
        
        // Clear overdue task notifications for the departing user to prevent duplicates
        jakarta.persistence.Query deleteOverdueNotifications = entityManager.createNativeQuery("DELETE FROM notifications WHERE user_id = ?1 AND type = 'overdue_task'");
        deleteOverdueNotifications.setParameter(1, fromUserId);
        int overdueNotificationsDeleted = deleteOverdueNotifications.executeUpdate();
        
        // Report transfer results
        System.out.println("=== TRANSFER RESULTS ===");
        System.out.println("Leads from VP/Manager (assigned_to only): " + leadsAssignedFromVPManager);
        System.out.println("Leads from Executive (both created_by & assigned_to): " + leadsFromExecutiveUpdated);
        System.out.println("Leads remaining assigned_to: " + leadsAssignedRemaining);
        System.out.println("Deals created_by: " + dealsCreatedUpdated);
        System.out.println("Deals reassign_to: " + dealsReassignedUpdated);
        System.out.println("Accounts created_by: " + accountsCreatedUpdated);
        System.out.println("Accounts reassign_to: " + accountsReassignedUpdated);
        System.out.println("Contacts from VP/Manager (reassign_to only): " + contactsReassignedFromVPManager);
        System.out.println("Contacts from Executive (both created_by & reassign_to): " + contactsFromExecutiveUpdated);
        System.out.println("Contacts remaining reassign_to: " + contactsReassignedRemaining);
        System.out.println("Tasks created_by: " + tasksCreatedUpdated);
        System.out.println("Tasks assigned_to: " + tasksAssignedUpdated);
        System.out.println("Notifications: " + notificationsUpdated);
        System.out.println("Overdue notifications deleted: " + overdueNotificationsDeleted);
        
        // Verify final counts
        jakarta.persistence.Query verifyLeads = entityManager.createNativeQuery("SELECT COUNT(*) FROM leads WHERE created_by = ?1 OR assigned_to = ?1");
        verifyLeads.setParameter(1, toUserId);
        Object totalLeads = verifyLeads.getSingleResult();
        
        jakarta.persistence.Query verifyDeals = entityManager.createNativeQuery("SELECT COUNT(*) FROM deals WHERE created_by = ?1 OR reassign_to = ?1");
        verifyDeals.setParameter(1, toUserId);
        Object totalDeals = verifyDeals.getSingleResult();
        
        jakarta.persistence.Query verifyAccounts = entityManager.createNativeQuery("SELECT COUNT(*) FROM accounts WHERE created_by = ?1 OR reassign_to = ?1");
        verifyAccounts.setParameter(1, toUserId);
        Object totalAccounts = verifyAccounts.getSingleResult();
        
        jakarta.persistence.Query verifyContacts = entityManager.createNativeQuery("SELECT COUNT(*) FROM contacts WHERE created_by = ?1 OR reassign_to = ?1");
        verifyContacts.setParameter(1, toUserId);
        Object totalContacts = verifyContacts.getSingleResult();
        
        jakarta.persistence.Query verifyTasks = entityManager.createNativeQuery("SELECT COUNT(*) FROM tasks WHERE created_by = ?1 OR assigned_to = ?1");
        verifyTasks.setParameter(1, toUserId);
        Object totalTasks = verifyTasks.getSingleResult();
        
        jakarta.persistence.Query verifyNotifications = entityManager.createNativeQuery("SELECT COUNT(*) FROM notifications WHERE user_id = ?1");
        verifyNotifications.setParameter(1, toUserId);
        Object totalNotifications = verifyNotifications.getSingleResult();
        
        System.out.println("=== NEW USER TOTALS ===");
        System.out.println("User " + toUserId + " now has:");
        System.out.println("- " + totalLeads + " leads");
        System.out.println("- " + totalDeals + " deals");
        System.out.println("- " + totalAccounts + " accounts");
        System.out.println("- " + totalContacts + " contacts");
        System.out.println("- " + totalTasks + " tasks");
        System.out.println("- " + totalNotifications + " notifications");
        
        // Deactivate the departing user
        fromUser.setIsActive(false);
        usersRepository.save(fromUser);
        System.out.println("User " + fromUser.getFirstName() + " (ID: " + fromUserId + ") deactivated");
        
        System.out.println("=== TRANSFER COMPLETE ===");
    }

    @Transactional
    public void deactivateUser(Integer userId) {
        Users user = usersRepository.findById(userId).orElse(null);
        if (user != null) {
            user.setIsActive(false);
            usersRepository.save(user);
        }
    }
}