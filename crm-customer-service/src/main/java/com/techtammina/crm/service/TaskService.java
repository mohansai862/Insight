package com.techtammina.crm.service;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.entity.Task;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class TaskService {
    private static final Logger log = LoggerFactory.getLogger(TaskService.class);

    private final TaskRepository taskRepository;
    
    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<Task> findAll() { return taskRepository.findAll(); }

    public Optional<Task> findById(Integer id) {
        return taskRepository.findById(id);
    }

    public Task save(Task task) { return taskRepository.save(task); }

    public void deleteById(Integer id) { taskRepository.deleteById(id); }

    // Convenience filters
    public List<Task> findByOwner(Integer userId) { return taskRepository.findByOwner_UserId(userId); }
    public List<Task> findByOwnerWithUsers(Integer userId) { return taskRepository.findByOwnerWithUsers(userId); }
    public List<Task> findByCreatedBy(Integer userId) { return taskRepository.findByCreatedBy_UserId(userId); }
    public List<Task> findByCreatedByWithUsers(Integer userId) { return taskRepository.findByCreatedByWithUsers(userId); }
    
    public List<Task> findByCreatedByOptimized(Integer userId) {
        log.debug("Getting optimized tasks created by manager: {}", userId);
        List<Object[]> rawData = taskRepository.findTasksByManagerOptimized(userId);
        return rawData.stream().map(this::mapToTask).collect(Collectors.toList());
    }
    
    public List<Task> findByStatus(Task.Status status) { return taskRepository.findByStatus(status); }

    public List<Task> findByPriority(Task.Priority priority) { return taskRepository.findByPriority(priority); }
    public List<Task> findByDueDateBetween(LocalDate start, LocalDate end) { return taskRepository.findByDueDateBetween(start, end); }

    // Executive task management methods
    public List<Task> findByOwnerAndStatus(Integer ownerId, Task.Status status) {
        return taskRepository.findByOwner_UserIdAndStatus(ownerId, status);
    }

    public List<Task> findOverdueTasksByExecutive(Integer executiveId) {
        return taskRepository.findOverdueTasksByExecutive(executiveId, LocalDate.now(), java.time.LocalTime.now());
    }

    public Task startTask(Integer taskId, String remarks) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setStatus(Task.Status.In_Progress);
            if (remarks != null && !remarks.trim().isEmpty()) {
                task.setRemarks(remarks);
            }
            return taskRepository.save(task);
        }
        return null;
    }

    public Task updateTaskRemarks(Integer taskId, String remarks) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setRemarks(remarks);
            return taskRepository.save(task);
        }
        return null;
    }

    public Task completeTask(Integer taskId, String remarks) {
        Optional<Task> taskOpt = taskRepository.findById(taskId);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            task.setStatus(Task.Status.Completed);
            if (remarks != null && !remarks.trim().isEmpty()) {
                task.setRemarks(remarks);
            }
            return taskRepository.save(task);
        }
        return null;
    }

    public List<Task> findByOwnerAndStatusWithFilters(Integer ownerId, Task.Status status, String priority, String startDate, String endDate) {
        // Use optimized query that fetches user data in one go
        List<Task> tasks = taskRepository.findByOwnerAndStatusWithUsers(ownerId, status);
        
        // Apply priority filter
        if (priority != null && !priority.isBlank()) {
            String p = priority.trim().toUpperCase();
            tasks = tasks.stream().filter(t -> t.getPriority() != null && t.getPriority().name().toUpperCase().equals(p)).collect(Collectors.toList());
        }
        
        // Apply date range filter
        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            tasks = tasks.stream().filter(t -> t.getDueDate() != null && !t.getDueDate().isBefore(start) && !t.getDueDate().isAfter(end)).collect(Collectors.toList());
        }
        
        return tasks;
    }
    
    // Ultra-optimized method for categorized tasks using native query
    public Map<String, List<Task>> getCategorizedTasksForExecutive(Integer executiveId, String priority, String startDate, String endDate, String search) {
        log.debug("Getting categorized tasks for executive: {}", executiveId);
        long startTime = System.currentTimeMillis();
        
        // Get all task data in single optimized query
        List<Object[]> rawData = taskRepository.findTasksForExecutiveOptimized(executiveId);
        log.debug("Retrieved {} raw task records in {}ms", rawData.size(), System.currentTimeMillis() - startTime);
        
        // Convert to Task objects efficiently
        List<Task> allTasks = rawData.stream().map(this::mapToTask).collect(Collectors.toList());
        
        // Apply search filter
        if (search != null && !search.trim().isEmpty()) {
            String searchLower = search.trim().toLowerCase();
            allTasks = allTasks.stream()
                .filter(t -> t.getTitle() != null && t.getTitle().toLowerCase().contains(searchLower))
                .collect(Collectors.toList());
        }
        
        // Apply filters
        if (priority != null && !priority.isBlank()) {
            String p = priority.trim().toUpperCase();
            allTasks = allTasks.stream().filter(t -> t.getPriority() != null && t.getPriority().name().toUpperCase().equals(p)).collect(Collectors.toList());
        }
        
        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            allTasks = allTasks.stream().filter(t -> t.getDueDate() != null && !t.getDueDate().isBefore(start) && !t.getDueDate().isAfter(end)).collect(Collectors.toList());
        }
        
        // Categorize tasks in memory
        Map<String, List<Task>> categorized = new HashMap<>();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        
        List<Task> pending = new ArrayList<>();
        List<Task> inProgress = new ArrayList<>();
        List<Task> completed = new ArrayList<>();
        List<Task> overdue = new ArrayList<>();
        
        for (Task task : allTasks) {
            boolean isOverdue = false;
            if (task.getDueDate() != null && (task.getStatus() == Task.Status.Pending || task.getStatus() == Task.Status.In_Progress)) {
                if (task.getDueDate().isBefore(today) || 
                    (task.getDueDate().equals(today) && task.getDueTime() != null && task.getDueTime().isBefore(now))) {
                    isOverdue = true;
                }
            }
            
            if (isOverdue) {
                overdue.add(task);
            } else {
                switch (task.getStatus()) {
                    case Pending: pending.add(task); break;
                    case In_Progress: inProgress.add(task); break;
                    case Completed: completed.add(task); break;
                }
            }
        }
        
        categorized.put("pending", pending);
        categorized.put("inProgress", inProgress);
        categorized.put("completed", completed);
        categorized.put("overdue", overdue);
        
        log.debug("Categorized tasks in {}ms: pending={}, inProgress={}, completed={}, overdue={}", 
                System.currentTimeMillis() - startTime, pending.size(), inProgress.size(), completed.size(), overdue.size());
        
        return categorized;
    }

    
    private Task mapToTask(Object[] row) {
        Task task = new Task();
        task.setTaskId((Integer) row[0]);
        task.setTitle((String) row[1]);
        task.setDescription((String) row[2]);
        task.setStatus(Task.Status.valueOf((String) row[3]));
        task.setPriority(Task.Priority.valueOf((String) row[4]));
        task.setDueDate(row[5] != null ? ((java.sql.Date) row[5]).toLocalDate() : null);
        task.setDueTime(row[6] != null ? ((java.sql.Time) row[6]).toLocalTime() : null);
        task.setCreatedAt(row[7] != null ? ((java.sql.Timestamp) row[7]).toLocalDateTime() : null);
        task.setUpdatedAt(row[8] != null ? ((java.sql.Timestamp) row[8]).toLocalDateTime() : null);
        task.setRemarks((String) row[9]);
        task.setDocumentName((String) row[10]);
        
        // Create owner user object (positions 11-13)
        if (row[11] != null) {
            Users owner = new Users();
            owner.setUserId((Integer) row[11]);
            owner.setUsername((String) row[12]);
            owner.setEmail((String) row[13]);
            task.setOwner(owner);
        }
        
        // Create createdBy user object (positions 14-16)
        if (row[14] != null) {
            Users createdBy = new Users();
            createdBy.setUserId((Integer) row[14]);
            createdBy.setUsername((String) row[15]);
            createdBy.setEmail((String) row[16]);
            task.setCreatedBy(createdBy);
        }
        
        // Map document metadata if available (positions 17-18)
        if (row.length > 17 && row[17] != null) {
            String docSizes = row[17].toString();
            task.setDocumentSizes(docSizes);
            log.debug("mapToTask - document_sizes: '{}'", docSizes);
        }
        if (row.length > 18 && row[18] != null) {
            task.setDocumentUploadedAt(((java.sql.Timestamp) row[18]).toLocalDateTime());
        }
        
        return task;
    }

    public List<Task> findOverdueTasksByExecutiveWithFilters(Integer executiveId, String priority) {
        List<Task> tasks = taskRepository.findOverdueTasksByExecutive(executiveId, LocalDate.now(), java.time.LocalTime.now());
        
        // Apply priority filter
        if (priority != null && !priority.isBlank()) {
            String p = priority.trim().toUpperCase();
            tasks = tasks.stream().filter(t -> t.getPriority() != null && t.getPriority().name().toUpperCase().equals(p)).collect(Collectors.toList());
        }
        
        return tasks;
    }

    public List<Task> findAssignedTasksWithFilters(Integer executiveId, String status, String priority, String startDate, String endDate) {
        List<Task> tasks = taskRepository.findByOwner_UserId(executiveId);
        
        // Apply status filter
        if (status != null && !status.isBlank()) {
            String s = status.trim().toUpperCase().replace('-', '_').replace(' ', '_');
            tasks = tasks.stream().filter(t -> t.getStatus() != null && t.getStatus().name().equals(s)).collect(Collectors.toList());
        }
        
        // Apply priority filter
        if (priority != null && !priority.isBlank()) {
            String p = priority.trim().toUpperCase();
            tasks = tasks.stream().filter(t -> t.getPriority() != null && t.getPriority().name().toUpperCase().equals(p)).collect(Collectors.toList());
        }
        
        // Apply date range filter
        if (startDate != null && endDate != null) {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            tasks = tasks.stream().filter(t -> t.getDueDate() != null && !t.getDueDate().isBefore(start) && !t.getDueDate().isAfter(end)).collect(Collectors.toList());
        }
        
        return tasks;
    }
    
    @Transactional
    public void updateDocumentName(Integer taskId, String documentName) {
        try {
            int rowsUpdated = entityManager.createNativeQuery("UPDATE tasks SET document_name = ?1 WHERE task_id = ?2")
                .setParameter(1, documentName)
                .setParameter(2, taskId)
                .executeUpdate();
            log.debug("{}", "Document name updated via native SQL for task ID: " + taskId + ", rows affected: " + rowsUpdated);
            
            // Verify the update
            Object result = entityManager.createNativeQuery("SELECT document_name FROM tasks WHERE task_id = ?1")
                .setParameter(1, taskId)
                .getSingleResult();
            log.debug("{}", "Verification query result: '" + result + "'");
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
    
    @Transactional
    public void updateDocumentSizes(Integer taskId, String documentSizes) {
        try {
            int rowsUpdated = entityManager.createNativeQuery("UPDATE tasks SET document_sizes = ?1 WHERE task_id = ?2")
                .setParameter(1, documentSizes)
                .setParameter(2, taskId)
                .executeUpdate();
            log.debug("Document sizes updated via native SQL for task ID: {}, rows affected: {}", taskId, rowsUpdated);
            
            // Verify the update
            Object result = entityManager.createNativeQuery("SELECT document_sizes FROM tasks WHERE task_id = ?1")
                .setParameter(1, taskId)
                .getSingleResult();
            log.debug("Verification query result for document_sizes: '{}'", result);
        } catch (Exception e) {
            log.error("Error updating document sizes for task {}: {}", taskId, e.getMessage());
        }
    }
}