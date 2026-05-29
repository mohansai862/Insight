package com.techtammina.crm.service;

import com.techtammina.crm.entity.Task;
import com.techtammina.crm.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
public class OverdueTaskNotificationService {
    
    @Autowired
    private TaskRepository taskRepository;
    
    @Autowired
    private NotificationService notificationService;

    @Scheduled(fixedRate = 60000) // Check every minute
    public void scheduledCheck() {
        checkOverdueTasks();
    }
    
    public void checkOverdueTasks() {
        // Get all overdue tasks
        List<Task> overdueTasks = taskRepository.findOverdueTasks(LocalDate.now(), LocalTime.now());
        
        for (Task task : overdueTasks) {
            // Only notify for tasks created by Sales_Manager and assigned to Sales_Executive
            if (task.getCreatedBy() != null && task.getOwner() != null &&
                "Sales_Manager".equals(task.getCreatedBy().getRole()) &&
                "Sales_Executive".equals(task.getOwner().getRole()) &&
                task.getOwner().getManagerId() != null &&
                task.getOwner().getManagerId().equals(task.getCreatedBy().getUserId())) {
                
                createOverdueNotification(task);
            }
        }
    }

    private void createOverdueNotification(Task task) {
        Integer managerId = task.getCreatedBy().getUserId();
        String executiveName = task.getOwner().getFirstName() + " " + task.getOwner().getLastName();
        String taskTitle = task.getTitle();
        
        // Use NotificationService to create the notification
        notificationService.createOverdueTaskNotification(managerId, executiveName, taskTitle, task);
    }
    

}

