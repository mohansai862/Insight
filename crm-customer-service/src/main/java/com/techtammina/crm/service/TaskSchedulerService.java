package com.techtammina.crm.service;

import com.techtammina.crm.entity.Task;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.entity.OverdueNotification;
import com.techtammina.crm.repository.TaskRepository;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.repository.OverdueNotificationRepository;
import com.techtammina.crm.util.LoggingUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Service
public class TaskSchedulerService {
    
    private static final Logger log = LoggerFactory.getLogger(TaskSchedulerService.class);

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UsersRepository usersRepository;

    @Autowired
    private NotificationService notificationService;
    
    @Autowired
    private OverdueNotificationRepository overdueNotificationRepository;

    // @Scheduled(fixedRate = 60000) // Disabled - using OverdueTaskNotificationService instead
    public void checkOverdueTasks() {
        long startTime = System.currentTimeMillis();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        log.info("Starting scheduled overdue task check at {} {}", today, now);
        
        try {
            // Find tasks that are overdue (due date is today or past, and not completed)
            List<Task> overdueTasks = taskRepository.findOverdueTasks(today, now);
            log.info("Found {} overdue tasks to process", overdueTasks.size());
            
            int notificationsSent = 0;
            for (Task task : overdueTasks) {
            // Get executive and manager info
            Users executive = usersRepository.findById(task.getOwner().getUserId()).orElse(null);
            Users manager = usersRepository.findById(task.getCreatedBy().getUserId()).orElse(null);
            
            if (executive != null && manager != null) {
                // Check if notification already sent for this task and manager
                boolean alreadyNotified = overdueNotificationRepository.existsByTaskIdAndManagerId(
                    task.getTaskId(), manager.getUserId());
                
                if (!alreadyNotified) {
                    String executiveName = executive.getFirstName() + " " + executive.getLastName();
                    
                    log.debug("Sending overdue task notification for task '{}' to manager {}", task.getTitle(), manager.getUserId());
                    
                    // Create notification for manager
                    notificationService.createOverdueTaskNotification(
                        manager.getUserId(),
                        executiveName,
                        task.getTitle(),
                        task
                    );
                    
                    // Mark as notified to prevent duplicate notifications
                    OverdueNotification overdueNotification = new OverdueNotification(
                        task.getTaskId(), manager.getUserId());
                    overdueNotificationRepository.save(overdueNotification);
                    
                    notificationsSent++;
                    log.info("Overdue task notification sent: Task '{}' (ID: {}) to Manager {} for Executive {}", 
                            task.getTitle(), task.getTaskId(), manager.getUserId(), executiveName);
                } else {
                    log.debug("Notification already sent for task '{}' to manager {}", task.getTitle(), manager.getUserId());
                }
            } else {
                log.warn("Skipping overdue task notification - missing executive or manager: Task ID {}", task.getTaskId());
            }
        }
        
        long duration = System.currentTimeMillis() - startTime;
        log.info("Completed overdue task check: {} notifications sent in {}ms", notificationsSent, duration);
        LoggingUtil.logPerformanceMetric(log, "checkOverdueTasks", duration);
        
    } catch (Exception e) {
        log.error("Error during scheduled overdue task check", e);
    }
}
    
    public String debugTasks() {
        log.debug("Starting task debug analysis");
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        List<Task> allTasks = taskRepository.findAll();
        log.debug("Retrieved {} tasks for debug analysis", allTasks.size());
        StringBuilder debug = new StringBuilder();
        debug.append("Current time: ").append(today).append(" ").append(now).append("\n");
        debug.append("Total tasks: ").append(allTasks.size()).append("\n\n");
        
        for (Task task : allTasks) {
            debug.append("Task ID: ").append(task.getTaskId()).append("\n");
            debug.append("Title: ").append(task.getTitle()).append("\n");
            debug.append("Status: ").append(task.getStatus()).append("\n");
            debug.append("Due Date: ").append(task.getDueDate()).append("\n");
            debug.append("Due Time: ").append(task.getDueTime()).append("\n");
            debug.append("Created By: ").append(task.getCreatedBy() != null ? task.getCreatedBy().getUserId() : "null").append("\n");
            debug.append("Assigned To: ").append(task.getOwner() != null ? task.getOwner().getUserId() : "null").append("\n");
            
            boolean isOverdue = false;
            if (task.getDueDate() != null && (task.getStatus() == Task.Status.Pending || task.getStatus() == Task.Status.In_Progress)) {
                if (task.getDueDate().isBefore(today)) {
                    isOverdue = true;
                } else if (task.getDueDate().equals(today) && task.getDueTime() != null && task.getDueTime().isBefore(now)) {
                    isOverdue = true;
                }
            }
            debug.append("Is Overdue: ").append(isOverdue).append("\n");
            if (task.getDueDate() != null && task.getDueDate().equals(today) && task.getDueTime() != null) {
                debug.append("Due time vs current: ").append(task.getDueTime()).append(" vs ").append(now).append("\n");
                debug.append("Time comparison: ").append(task.getDueTime().isBefore(now) ? "PAST DUE" : "NOT DUE YET").append("\n");
            }
            debug.append("---\n");
        }
        
        log.debug("Completed task debug analysis");
        return debug.toString();
    }
    
    public String getCurrentTasksStatus() {
        log.info("Generating current tasks status report");
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        List<Task> allTasks = taskRepository.findAll();
        List<Task> overdueTasks = taskRepository.findOverdueTasks(today, now);
        
        log.info("Tasks status: {} total, {} overdue", allTasks.size(), overdueTasks.size());
        
        StringBuilder status = new StringBuilder();
        status.append("=== CURRENT TASK STATUS ===").append("\n");
        status.append("Current Date/Time: ").append(today).append(" ").append(now).append("\n");
        status.append("Total Tasks: ").append(allTasks.size()).append("\n");
        status.append("Overdue Tasks Found by Query: ").append(overdueTasks.size()).append("\n\n");
        
        status.append("=== OVERDUE TASKS ===").append("\n");
        for (Task task : overdueTasks) {
            status.append("Task ID: ").append(task.getTaskId()).append("\n");
            status.append("Title: ").append(task.getTitle()).append("\n");
            status.append("Status: ").append(task.getStatus()).append("\n");
            status.append("Due: ").append(task.getDueDate()).append(" ").append(task.getDueTime()).append("\n");
            status.append("Created By: ").append(task.getCreatedBy() != null ? task.getCreatedBy().getUserId() : "null").append("\n");
            status.append("Assigned To: ").append(task.getOwner() != null ? task.getOwner().getUserId() : "null").append("\n");
            status.append("---\n");
        }
        
        log.info("Completed tasks status report generation");
        return status.toString();
    }
}

