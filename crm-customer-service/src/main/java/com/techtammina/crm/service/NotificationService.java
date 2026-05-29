package com.techtammina.crm.service;

import com.techtammina.crm.entity.Notification;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.entity.Task;
import com.techtammina.crm.repository.NotificationRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.time.temporal.ChronoUnit;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UsersRepository usersRepository;

    public void createLeadAssignmentNotification(Integer executiveId, String leadName, String managerName) {
        Users executive = usersRepository.findById(executiveId).orElse(null);
        if (executive == null) {
            return;
        }

        // Check if assignment notification already exists for this executive and lead
        String messageContent = "You have been assigned a new lead:  " + leadName + " by " + managerName;
        List<Notification> existingNotifications = notificationRepository.findByUser_UserIdAndTypeAndMessage(executiveId, "LEAD_ASSIGNMENT", messageContent);
        if (!existingNotifications.isEmpty()) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(executive);
        notification.setTitle("New Lead Assigned");
        notification.setMessage(messageContent);
        notification.setType("LEAD_ASSIGNMENT");
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }
    
    public void createVPLeadReassignmentNotification(Integer managerId, String leadName, String vpName, String newExecutiveName, String performedByName) {
        Users manager = usersRepository.findById(managerId).orElse(null);
        if (manager == null) {
            return;
        }

        String messageContent = "VP lead " + leadName + " (created by " + vpName + ") has been assigned to your team member " + newExecutiveName + " by " + performedByName;
        
        // Check if notification already exists
        List<Notification> existingNotifications = notificationRepository.findByUser_UserIdAndTypeAndMessage(managerId, "VP_LEAD_REASSIGNMENT", messageContent);
        if (!existingNotifications.isEmpty()) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(manager);
        notification.setTitle("VP Lead Assigned to Your Team");
        notification.setMessage(messageContent);
        notification.setType("VP_LEAD_REASSIGNMENT");
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }
    
    public void createManagerLeadReassignmentNotification(Integer managerId, String leadName, String newExecutiveName, String performedByName) {
        Users manager = usersRepository.findById(managerId).orElse(null);
        if (manager == null) {
            return;
        }

        String messageContent = "Attempt to reassign your lead " + leadName + " to " + newExecutiveName + " by " + performedByName + " was blocked (Manager ownership)";
        
        // Check if notification already exists
        List<Notification> existingNotifications = notificationRepository.findByUser_UserIdAndTypeAndMessage(managerId, "MANAGER_LEAD_REASSIGNMENT", messageContent);
        if (!existingNotifications.isEmpty()) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(manager);
        notification.setTitle("Lead Reassignment Attempt Blocked");
        notification.setMessage(messageContent);
        notification.setType("MANAGER_LEAD_REASSIGNMENT");
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Integer userId) {
        if (userId == null) {
            return new java.util.ArrayList<>();
        }
        List<Notification> notifications = notificationRepository.findByUser_UserIdAndIsClearedFalseOrderByCreatedAtDesc(userId);
        return fixEmojiEncoding(notifications);
    }

    public List<Notification> getUnreadNotifications(Integer userId) {
        List<Notification> notifications = notificationRepository.findByUser_UserIdAndIsReadFalseAndIsClearedFalseOrderByCreatedAtDesc(userId);
        return fixEmojiEncoding(notifications);
    }

    public long getUnreadCount(Integer userId) {
        if (userId == null) {
            return 0;
        }
        return notificationRepository.countByUser_UserIdAndIsReadFalseAndIsClearedFalse(userId);
    }

    public void markAsRead(Integer notificationId) {
        Notification notification = notificationRepository.findById(notificationId).orElse(null);
        if (notification != null) {
            notification.setIsRead(true);
            notificationRepository.save(notification);
        }
    }

    public void markAllAsRead(Integer userId) {
        List<Notification> unreadNotifications = notificationRepository.findByUser_UserIdAndIsReadFalseAndIsClearedFalseOrderByCreatedAtDesc(userId);
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
        }
        notificationRepository.saveAll(unreadNotifications);
    }

    public void sendInAppNotification(Integer userId, String message) {
        Users user = usersRepository.findById(userId).orElse(null);
        if (user == null) return;

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle("Workflow Notification");
        notification.setMessage(message);
        notification.setType("WORKFLOW");
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }
    
    @org.springframework.transaction.annotation.Transactional
    public void createReassignmentRequestNotification(Integer managerId, String executiveName, String leadName, String reason, Integer requestId) {
        System.out.println("*** NOTIFICATION SERVICE: Creating reassignment request notification ***");
        System.out.println("Manager ID: " + managerId);
        System.out.println("Executive Name: " + executiveName);
        System.out.println("Lead Name: " + leadName);
        System.out.println("Request ID: " + requestId);
        
        Users manager = usersRepository.findById(managerId).orElse(null);
        if (manager == null) {
            System.out.println("*** ERROR: Manager not found with ID:  " + managerId + " ***");
            return;
        }
        
        System.out.println("Manager found: " + manager.getFirstName() + " " + manager.getLastName());

        // Check if notification already exists for this request
        String messagePattern = "[RequestID:" + requestId + "]";
        List<Notification> existingNotifications = notificationRepository.findByUser_UserIdAndTypeAndMessageContaining(managerId, "REASSIGNMENT_REQUEST", messagePattern);
        if (!existingNotifications.isEmpty()) {
            System.out.println("*** NOTIFICATION ALREADY EXISTS - SKIPPING ***");
            return;
        }

        Notification notification = new Notification();
        notification.setUser(manager);
        notification.setTitle("Lead Reassignment Request");
        notification.setMessage(executiveName + " has requested reassignment of lead:  " + leadName + ". Reason: " + reason + " [RequestID:" + requestId + "]");
        notification.setType("REASSIGNMENT_REQUEST");
        notification.setIsRead(false);

        Notification saved = notificationRepository.save(notification);
        notificationRepository.flush(); // Force immediate save to database
        System.out.println("*** NOTIFICATION SAVED WITH ID: " + saved.getNotificationId() + " ***");
        System.out.println("*** NOTIFICATION MESSAGE: " + saved.getMessage() + " ***");
    }

    
    public void createReassignmentResponseNotification(Integer executiveId, String managerName, String status, String leadName) {
        Users executive = usersRepository.findById(executiveId).orElse(null);
        if (executive == null) return;

        Notification notification = new Notification();
        notification.setUser(executive);
        notification.setTitle("Reassignment Request " + status.substring(0, 1).toUpperCase() + status.substring(1));
        notification.setMessage(managerName + " has " + status + " your reassignment request for lead: " + leadName);
        notification.setType("REASSIGNMENT_" + status.toUpperCase());
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }
    
    public void createTaskAssignmentNotification(Integer executiveId, String taskTitle, String managerName) {
        Users executive = usersRepository.findById(executiveId).orElse(null);
        if (executive == null) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(executive);
        notification.setTitle("New Task Assigned");
        notification.setMessage(managerName + " has assigned you a new task: " + taskTitle);
        notification.setType("TASK_ASSIGNMENT");
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }
    
    public void createOverdueTaskNotification(Integer managerId, String executiveName, String taskTitle, com.techtammina.crm.entity.Task task) {
        Users manager = usersRepository.findById(managerId).orElse(null);
        if (manager == null) {
            return;
        }

        // Check if notification already exists for this task and manager by message content
        String messageContent = executiveName + " has not completed the task: " + taskTitle + " within the given time.";
        List<Notification> existingNotifications = notificationRepository.findByUser_UserIdAndTypeAndMessage(managerId, "TASK_OVERDUE", messageContent);
        
        if (!existingNotifications.isEmpty()) {
            return;
        }

        Notification notification = new Notification();
        notification.setUser(manager);
        notification.setTitle("Task Overdue");
        notification.setMessage(messageContent);
        notification.setType("TASK_OVERDUE");
        notification.setIsRead(false);

        notificationRepository.save(notification);
    }
    
    @org.springframework.transaction.annotation.Transactional
    public void deleteReassignmentRequestNotification(Integer requestId) {
        try {
            String messagePattern = "[RequestID:" + requestId + "]";
            List<Notification> notifications = notificationRepository.findByTypeAndMessageContaining("REASSIGNMENT_REQUEST", messagePattern);
            
            if (!notifications.isEmpty()) {
                for (Notification n : notifications) {
                    notificationRepository.deleteById(n.getNotificationId());
                }
            }
        } catch (Exception e) {
            // Silent fail
        }
    }
    
    @org.springframework.transaction.annotation.Transactional
    public void deleteTaskNotifications(Integer userId, String taskTitle) {
        try {
            // Delete task assignment notifications for the specific user
            List<Notification> taskAssignmentNotifications = notificationRepository.findByUser_UserIdAndTypeAndMessageContaining(userId, "TASK_ASSIGNMENT", "new task: " + taskTitle);
            for (Notification n : taskAssignmentNotifications) {
                notificationRepository.deleteById(n.getNotificationId());
            }
            
            // Delete task overdue notifications (these go to managers, so search all)
            List<Notification> taskOverdueNotifications = notificationRepository.findByTypeAndMessageContaining("TASK_OVERDUE", "task: " + taskTitle);
            for (Notification n : taskOverdueNotifications) {
                notificationRepository.deleteById(n.getNotificationId());
            }
        } catch (Exception e) {
            // Silent fail - log for debugging
        }
    }
    
    @org.springframework.transaction.annotation.Transactional
    public void clearAllUserNotifications(Integer userId) {
        notificationRepository.markAllAsClearedByUserId(userId);
    }
    
    @org.springframework.transaction.annotation.Transactional
    public void markTaskNotificationsAsRead(Integer userId, String taskTitle) {
        try {
            // Mark task assignment notifications as read for this specific user and task
            List<Notification> taskNotifications = notificationRepository.findByUser_UserIdAndTypeAndMessageContaining(userId, "TASK_ASSIGNMENT", "new task: " + taskTitle);
            for (Notification notification : taskNotifications) {
                if (!notification.getIsRead()) {
                    notification.setIsRead(true);
                    notificationRepository.save(notification);
                }
            }
        } catch (Exception e) {
            // Silent fail - log for debugging if needed
        }
    }
    
    private List<Notification> fixEmojiEncoding(List<Notification> notifications) {
        for (Notification notification : notifications) {
            if (notification.getTitle() != null) {
                notification.setTitle(notification.getTitle()
                    .replace("Deal Won ðŸŽ‰", "Deal Won! 🎉")
                    .replace("Deal Won! ðŸŽ‰", "Deal Won! 🎉"));
            }
        }
        return notifications;
    }
}

