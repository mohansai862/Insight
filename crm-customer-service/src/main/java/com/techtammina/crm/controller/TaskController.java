package com.techtammina.crm.controller;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.dto.TaskDTO;
import com.techtammina.crm.entity.Task;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.mapper.TaskMapper;
import com.techtammina.crm.repository.UsersRepository;
import com.techtammina.crm.service.TaskService;
import com.techtammina.crm.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import jakarta.validation.Valid;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;


@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "*")
@Slf4j
public class TaskController {
    private static final Logger log = LoggerFactory.getLogger(TaskController.class);

    private final TaskService taskService;
    private final UsersRepository usersRepository;
    private final NotificationService notificationService;

    @Autowired
    public TaskController(TaskService taskService, UsersRepository usersRepository, NotificationService notificationService) {
        this.taskService = taskService;
        this.usersRepository = usersRepository;
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAllTasks(
            @RequestParam(required = false) Integer ownerId,
            @RequestParam(required = false) Integer createdBy,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String startDueDate,
            @RequestParam(required = false) String endDueDate,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        List<Task> tasks;

        // Role-based filtering: 
        // - Sales Executive: only tasks assigned to them
        // - Sales Manager: tasks they created + tasks assigned to them by VP
        // - Sales VP: all tasks they created
        if ("Sales_Executive".equals(userRole) && userId != null) {
            tasks = taskService.findByOwnerWithUsers(userId);
        } else if ("Sales_Manager".equals(userRole) && userId != null) {
            // Get only tasks assigned to manager by VP (not tasks they created)
            tasks = taskService.findByOwnerWithUsers(userId);
            log.info("Sales Manager {} - Tasks assigned to them: {}", userId, tasks.size());
        } else if ("Sales_VP".equals(userRole) && userId != null) {
            // Optimize for Sales VP: Use ultra-optimized native SQL query
            if (createdBy != null) {
                tasks = taskService.findByCreatedByOptimized(createdBy);
            } else {
                tasks = taskService.findByCreatedByOptimized(userId);
            }
            log.info("Sales VP {} - Tasks created by them: {}", userId, tasks.size());
        } else if (ownerId != null) {
            tasks = taskService.findByOwnerWithUsers(ownerId);
        } else if (createdBy != null) {
            tasks = taskService.findByCreatedByWithUsers(createdBy);
        } else {
            tasks = taskService.findAll();
        }

        // Apply filters
        if (ownerId != null) tasks = tasks.stream().filter(t -> t.getOwner() != null && ownerId.equals(t.getOwner().getUserId())).collect(Collectors.toList());
        if (createdBy != null) tasks = tasks.stream().filter(t -> t.getCreatedBy() != null && createdBy.equals(t.getCreatedBy().getUserId())).collect(Collectors.toList());
        if (status != null && !status.isBlank()) {
            String s = status.trim().toUpperCase().replace('-', '_').replace(' ', '_');
            tasks = tasks.stream().filter(t -> t.getStatus() != null && t.getStatus().name().toUpperCase().equals(s)).collect(Collectors.toList());
        }
        if (priority != null && !priority.isBlank()) {
            String p = priority.trim().toUpperCase();
            tasks = tasks.stream().filter(t -> t.getPriority() != null && t.getPriority().name().toUpperCase().equals(p)).collect(Collectors.toList());
        }
        if (startDueDate != null && endDueDate != null) {
            LocalDate start = LocalDate.parse(startDueDate);
            LocalDate end = LocalDate.parse(endDueDate);
            tasks = tasks.stream().filter(t -> t.getDueDate() != null && !t.getDueDate().isBefore(start) && !t.getDueDate().isAfter(end)).collect(Collectors.toList());
        }

        // Sort tasks by priority desc (High first), then dueDate asc, then createdAt asc
        tasks.sort(Comparator.comparing((Task t) -> getPriorityScore(t.getPriority()), Comparator.reverseOrder())
                .thenComparing(Task::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));

        List<TaskDTO> dtos = tasks.stream().map(TaskMapper::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/executive/categorized")
    public ResponseEntity<Map<String, List<TaskDTO>>> getExecutiveCategorizedTasks(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String search
    ) {
        if (!"Sales_Executive".equals(userRole) || userId == null) {
            return ResponseEntity.badRequest().build();
        }

        long startTime = System.currentTimeMillis();
        
        // Use ultra-optimized single-query method
        Map<String, List<Task>> categorizedTasks = taskService.getCategorizedTasksForExecutive(userId, priority, startDate, endDate, search);
        
        // Convert to DTOs with minimal processing
        Map<String, List<TaskDTO>> result = new HashMap<>(4);
        
        categorizedTasks.forEach((category, tasks) -> {
            List<TaskDTO> dtos = tasks.stream().map(TaskMapper::toDTO).collect(Collectors.toList());
            result.put(category, dtos);
        });
        
        long duration = System.currentTimeMillis() - startTime;
        log.info("Categorized tasks response completed in {}ms for executive {}", duration, userId);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/executive/assigned")
    public ResponseEntity<List<TaskDTO>> getExecutiveAssignedTasks(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate
    ) {
        if (!"Sales_Executive".equals(userRole) || userId == null) {
            return ResponseEntity.badRequest().build();
        }

        List<Task> tasks = taskService.findAssignedTasksWithFilters(userId, status, priority, startDate, endDate);
        
        // Sort by priority (High first), then due date
        tasks.sort(Comparator.comparing((Task t) -> getPriorityScore(t.getPriority()), Comparator.reverseOrder())
                .thenComparing(Task::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));

        List<TaskDTO> taskDTOs = tasks.stream().map(TaskMapper::toDTO).collect(Collectors.toList());

        return ResponseEntity.ok(taskDTOs);
    }

    @GetMapping("/original")
    public ResponseEntity<List<TaskDTO>> getOriginalTasks(
            @RequestParam(required = false) Integer ownerId,
            @RequestParam(required = false) Integer createdBy,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String startDueDate,
            @RequestParam(required = false) String endDueDate,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        List<Task> tasks;

        // Role-based filtering: executives only see their assigned tasks, managers see all
        if ("Sales_Executive".equals(userRole) && userId != null) {
            tasks = taskService.findByOwner(userId);
        } else {
            tasks = taskService.findAll();
        }

        // Simple in-memory filtering for now; can be optimized via repo queries later
        if (ownerId != null) tasks = tasks.stream().filter(t -> t.getOwner() != null && ownerId.equals(t.getOwner().getUserId())).collect(Collectors.toList());
        if (createdBy != null) tasks = tasks.stream().filter(t -> t.getCreatedBy() != null && createdBy.equals(t.getCreatedBy().getUserId())).collect(Collectors.toList());
        if (status != null && !status.isBlank()) {
            String s = status.trim().toUpperCase().replace('-', '_').replace(' ', '_');
            tasks = tasks.stream().filter(t -> t.getStatus() != null && t.getStatus().name().toUpperCase().equals(s)).collect(Collectors.toList());
        }


        if (startDueDate != null && endDueDate != null) {
            LocalDate start = LocalDate.parse(startDueDate);
            LocalDate end = LocalDate.parse(endDueDate);
            tasks = tasks.stream().filter(t -> t.getDueDate() != null && !t.getDueDate().isBefore(start) && !t.getDueDate().isAfter(end)).collect(Collectors.toList());
        }

        // Sort tasks by priority desc (High first), then dueDate asc, then createdAt asc
        tasks.sort(Comparator.comparing((Task t) -> getPriorityScore(t.getPriority()), Comparator.reverseOrder())
                .thenComparing(Task::getDueDate, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(Task::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())));

        List<TaskDTO> dtos = tasks.stream().map(TaskMapper::toDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTask(@PathVariable Integer id,
                                          @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                          @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        try {
            System.out.println("DEBUG: getTask - Starting for task ID: " + id);
            Optional<Task> taskOpt = taskService.findById(id);
            if (taskOpt.isPresent()) {
                Task task = taskOpt.get();
                System.out.println("DEBUG: getTask - Found task, calling TaskMapper.toDTO");
                System.out.println("DEBUG: getTask - BEFORE mapper - task.getDocumentSizes(): '" + task.getDocumentSizes() + "'");
                
                // Mark task notifications as read when executive views the task
                if ("Sales_Executive".equals(userRole) && task.getOwner() != null && task.getOwner().getUserId().equals(userId)) {
                    notificationService.markTaskNotificationsAsRead(userId, task.getTitle());
                }
                
                TaskDTO dto = TaskMapper.toDTO(task);
                System.out.println("DEBUG: getTask - AFTER mapper - dto.getDocumentSizes(): '" + dto.getDocumentSizes() + "'");
                
                // Debug: Check what's in the entity
                System.out.println("DEBUG: getTask - task.getDocumentSizes(): '" + task.getDocumentSizes() + "'");
                System.out.println("DEBUG: getTask - dto.getDocumentSizes(): '" + dto.getDocumentSizes() + "'");
                
                // Direct database lookup for owner info
                if (dto.getOwnerId() != null) {
                    Users owner = usersRepository.findById(dto.getOwnerId()).orElse(null);
                    if (owner != null) {
                        String fullName = (owner.getFirstName() != null ? owner.getFirstName() : "") + 
                                         (owner.getLastName() != null ? " " + owner.getLastName() : "");
                        dto.setOwnerName(fullName.trim().isEmpty() ? owner.getUsername() : fullName.trim());
                        dto.setOwnerEmail(owner.getEmail());
                    }
                }
                
                // Direct database lookup for creator info
                log.debug("Task {} - createdBy ID from DTO: {}", id, dto.getCreatedBy());
                if (dto.getCreatedBy() != null) {
                    Users creator = usersRepository.findById(dto.getCreatedBy()).orElse(null);
                    if (creator != null) {
                        String createdByFullName = (creator.getFirstName() != null ? creator.getFirstName() : "") + 
                                                   (creator.getLastName() != null ? " " + creator.getLastName() : "");
                        dto.setCreatedByName(createdByFullName.trim().isEmpty() ? creator.getUsername() : createdByFullName.trim());
                        dto.setCreatedByEmail(creator.getEmail());
                        log.debug("Task {} - Set createdByName to: {}", id, dto.getCreatedByName());
                    } else {
                        log.warn("Task {} - Creator user not found for ID: {}", id, dto.getCreatedBy());
                    }
                } else {
                    log.warn("Task {} - createdBy is NULL in database", id);
                }
                
                return ResponseEntity.ok(dto);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<TaskDTO> create(@Valid @RequestBody TaskDTO dto,
                                         @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                         @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        try {
            // Validate mandatory fields
            if (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (dto.getDueDate() == null) {
                return ResponseEntity.badRequest().build();
            }
            if (dto.getDueTime() == null || dto.getDueTime().trim().isEmpty()) {
                return ResponseEntity.badRequest().build();
            }
            if (dto.getOwnerId() == null) {
                return ResponseEntity.badRequest().build();
            }
            
            log.info("=== TASK CREATION DEBUG ===");
            log.info("Task Title: {}", dto.getTitle());
            log.info("Owner ID: {}", dto.getOwnerId());
            log.info("Created By from DTO: {}", dto.getCreatedBy());
            log.info("User ID from headers: {}", userId);
            log.info("User Role from headers: {}", userRole);
            log.debug("Document Name from DTO: '{}'", dto.getDocumentName());
            log.debug("Document Sizes from DTO: '{}'", dto.getDocumentSizes());
            log.debug("Documents array length: {}", (dto.getDocuments() != null ? dto.getDocuments().length : "null"));
            log.debug("Document name null check: {}", (dto.getDocumentName() == null));
            log.debug("Document name empty check: {}", (dto.getDocumentName() != null && dto.getDocumentName().trim().isEmpty()));
            
            Task task = new Task();
            task.setTitle(dto.getTitle());
            task.setDescription(dto.getDescription());
            task.setStatus(Task.Status.Pending);
            
            // Set priority
            if ("HIGH".equals(dto.getPriority())) task.setPriority(Task.Priority.High);
            else if ("LOW".equals(dto.getPriority())) task.setPriority(Task.Priority.Low);
            else task.setPriority(Task.Priority.Medium);
            
            task.setDueDate(dto.getDueDate());
            try {
                String timeStr = dto.getDueTime();
                if (timeStr.length() == 5 && timeStr.matches("\\d{2}:\\d{2}")) {
                    timeStr += ":00";
                }
                task.setDueTime(java.time.LocalTime.parse(timeStr));
            } catch (Exception e) {
                return ResponseEntity.badRequest().build();
            }
            
            // Set owner
            if (dto.getOwnerId() != null) {
                Users owner = usersRepository.findById(dto.getOwnerId()).orElse(null);
                if (owner != null) task.setOwner(owner);
            }
            
            // Set creator to current user from headers
            if (userId != null) {
                Users creator = usersRepository.findById(userId).orElse(null);
                if (creator != null) {
                    task.setCreatedBy(creator);
                    log.info("Set createdBy to user: {} (ID: {})", creator.getUsername(), creator.getUserId());
                } else {
                    log.error("Creator user not found for ID: {}", userId);
                }
            } else {
                log.error("No userId provided in headers for createdBy");
            }
            
            // Set documents and document name with metadata
            if (dto.getDocuments() != null && dto.getDocuments().length > 0) {
                int[] intArray = dto.getDocuments();
                byte[] byteArray = new byte[intArray.length];
                for (int i = 0; i < intArray.length; i++) {
                    byteArray[i] = (byte) intArray[i];
                }
                task.setDocuments(byteArray);
                
                // Set file sizes - ensure we have proper comma-separated sizes for multiple files
                if (dto.getDocumentSizes() != null && !dto.getDocumentSizes().trim().isEmpty()) {
                    task.setDocumentSizes(dto.getDocumentSizes().trim());
                    log.debug("Setting document sizes from DTO: '{}'", dto.getDocumentSizes());
                } else {
                    // Calculate size from byte array as fallback
                    task.setDocumentSizes(String.valueOf(byteArray.length));
                    log.debug("Calculated document size: {}", byteArray.length);
                }
                task.setDocumentUploadedAt(java.time.LocalDateTime.now());
            }
            
            // Set document name same way as other fields
            if (dto.getDocumentName() != null && !dto.getDocumentName().trim().isEmpty()) {
                String docName = dto.getDocumentName().trim();
                task.setDocumentName(docName);
                log.debug("Setting document name on entity: '{}'", docName);
            } else {
                log.debug("No document name to set - null or empty");
            }
            
            log.info("Before save - entity document name: '{}'", task.getDocumentName());
            log.info("Before save - createdBy: {}", task.getCreatedBy() != null ? task.getCreatedBy().getUsername() : "NULL");
            Task saved = taskService.save(task);
            log.info("After save - entity document name: '{}'", saved.getDocumentName());
            log.info("After save - createdBy: {}", saved.getCreatedBy() != null ? saved.getCreatedBy().getUsername() : "NULL");
            log.info("Task saved with ID: {}", saved.getTaskId());
            
            // Always force update document name using native SQL if provided
            if (dto.getDocumentName() != null && !dto.getDocumentName().trim().isEmpty()) {
                String docName = dto.getDocumentName().trim();
                log.debug("Forcing document name update via SQL: '{}'", docName);
                taskService.updateDocumentName(saved.getTaskId(), docName);
            }
            
            // Force update document sizes using native SQL if provided
            if (dto.getDocumentSizes() != null && !dto.getDocumentSizes().trim().isEmpty()) {
                String docSizes = dto.getDocumentSizes().trim();
                log.debug("Forcing document sizes update via SQL: '{}'", docSizes);
                taskService.updateDocumentSizes(saved.getTaskId(), docSizes);
                
                // Verify the update worked
                Task refreshed = taskService.findById(saved.getTaskId()).orElse(null);
                if (refreshed != null) {
                    log.debug("After SQL update - document sizes: '{}'", refreshed.getDocumentSizes());
                }
            }
            
            // Send notification to executive when task is assigned
            if (saved.getOwner() != null && saved.getCreatedBy() != null && 
                "Sales_Executive".equals(saved.getOwner().getRole()) && 
                "Sales_Manager".equals(saved.getCreatedBy().getRole())) {
                
                String managerName = saved.getCreatedBy().getFirstName() + " " + saved.getCreatedBy().getLastName();
                notificationService.createTaskAssignmentNotification(
                    saved.getOwner().getUserId(), 
                    saved.getTitle(), 
                    managerName
                );
            }
            
            return ResponseEntity.ok(TaskMapper.toDTO(saved));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> update(@PathVariable Integer id, @Valid @RequestBody TaskDTO dto,
                                         @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                         @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        // Validate title if provided
        if (dto.getTitle() != null && dto.getTitle().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        Optional<Task> existing = taskService.findById(id);
        if (existing.isPresent()) {
            Task existingTask = existing.get();
            Integer oldOwnerId = existingTask.getOwner() != null ? existingTask.getOwner().getUserId() : null;
            
            Task task = TaskMapper.toEntity(dto);
            task.setTaskId(id);
            // Preserve createdBy if not provided in update
            if (task.getCreatedBy() == null && existingTask.getCreatedBy() != null) {
                task.setCreatedBy(existingTask.getCreatedBy());
            }
            // Preserve dueDate if not provided in update
            if (task.getDueDate() == null && existingTask.getDueDate() != null) {
                task.setDueDate(existingTask.getDueDate());
            }
            
                // Handle document updates - append new documents to existing ones
                if (dto.getDocuments() != null && dto.getDocuments().length > 0) {
                    int[] newIntArray = dto.getDocuments();
                    byte[] newByteArray = new byte[newIntArray.length];
                    for (int i = 0; i < newIntArray.length; i++) {
                        newByteArray[i] = (byte) newIntArray[i];
                    }
                    
                    // Handle individual file sizes - ensure we have proper comma-separated sizes
                    String newDocumentSizes = dto.getDocumentSizes();
                    if (newDocumentSizes == null || newDocumentSizes.trim().isEmpty()) {
                        // Calculate size from byte array as fallback
                        newDocumentSizes = String.valueOf(newByteArray.length);
                    }
                    
                    // Append to existing documents if they exist
                    if (existingTask.getDocuments() != null && existingTask.getDocuments().length > 0) {
                        byte[] existingDocs = existingTask.getDocuments();
                        byte[] combinedDocs = new byte[existingDocs.length + newByteArray.length];
                        System.arraycopy(existingDocs, 0, combinedDocs, 0, existingDocs.length);
                        System.arraycopy(newByteArray, 0, combinedDocs, existingDocs.length, newByteArray.length);
                        task.setDocuments(combinedDocs);
                        
                        // Combine document sizes - ensure proper formatting
                        String existingSizes = existingTask.getDocumentSizes();
                        if (existingSizes != null && !existingSizes.trim().isEmpty()) {
                            task.setDocumentSizes(existingSizes.trim() + "," + newDocumentSizes.trim());
                        } else {
                            task.setDocumentSizes(newDocumentSizes.trim());
                        }
                    } else {
                        task.setDocuments(newByteArray);
                        task.setDocumentSizes(newDocumentSizes.trim());
                    }
                    task.setDocumentUploadedAt(java.time.LocalDateTime.now());
                } else {
                    // Preserve existing documents and metadata if no new ones provided
                    task.setDocuments(existingTask.getDocuments());
                    task.setDocumentSizes(existingTask.getDocumentSizes());
                    task.setDocumentUploadedAt(existingTask.getDocumentUploadedAt());
                }
            
            // Handle document name updates - append new names to existing ones
            if (dto.getDocumentName() != null && !dto.getDocumentName().trim().isEmpty()) {
                String newDocName = dto.getDocumentName().trim();
                if (existingTask.getDocumentName() != null && !existingTask.getDocumentName().trim().isEmpty()) {
                    task.setDocumentName(existingTask.getDocumentName() + ", " + newDocName);
                } else {
                    task.setDocumentName(newDocName);
                }
            } else {
                // Preserve existing document name if no new one provided
                task.setDocumentName(existingTask.getDocumentName());
            }
            
            Task updated = taskService.save(task);
            
            // Force update document name using native SQL if provided
            if (dto.getDocumentName() != null && !dto.getDocumentName().trim().isEmpty()) {
                String finalDocName = updated.getDocumentName(); // Use the combined name from above
                taskService.updateDocumentName(updated.getTaskId(), finalDocName);
            }
            
            // Force update document sizes using native SQL if provided
            if (dto.getDocumentSizes() != null && !dto.getDocumentSizes().trim().isEmpty()) {
                String finalDocSizes = updated.getDocumentSizes(); // Use the combined sizes from above
                if (finalDocSizes != null && !finalDocSizes.trim().isEmpty()) {
                    taskService.updateDocumentSizes(updated.getTaskId(), finalDocSizes);
                }
            }
            
            // Handle notification cleanup and reassignment if owner changed
            Integer newOwnerId = updated.getOwner() != null ? updated.getOwner().getUserId() : null;
            if (oldOwnerId != null && newOwnerId != null && !oldOwnerId.equals(newOwnerId)) {
                // Remove notifications from old owner
                notificationService.deleteTaskNotifications(oldOwnerId, updated.getTitle());
                
                // Send notification to new owner if they are a Sales Executive
                if ("Sales_Executive".equals(updated.getOwner().getRole()) && 
                    updated.getCreatedBy() != null && "Sales_Manager".equals(updated.getCreatedBy().getRole())) {
                    
                    String managerName = updated.getCreatedBy().getFirstName() + " " + updated.getCreatedBy().getLastName();
                    notificationService.createTaskAssignmentNotification(
                        newOwnerId, 
                        updated.getTitle(), 
                        managerName
                    );
                }
            }
            
            return ResponseEntity.ok(TaskMapper.toDTO(updated));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            
            // Delete related notifications before deleting the task
            if (task.getOwner() != null) {
                notificationService.deleteTaskNotifications(task.getOwner().getUserId(), task.getTitle());
            }
            
            taskService.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/bulk/prioritize")
    public ResponseEntity<Void> bulkPrioritize(@RequestBody BulkPrioritizeRequest request) {
        List<Task> tasks = taskService.findAll();
        Task.Priority newPriority = Task.Priority.valueOf(request.getPriority().toUpperCase());
        for (Integer taskId : request.getTaskIds()) {
            tasks.stream()
                .filter(t -> t.getTaskId().equals(taskId))
                .findFirst()
                .ifPresent(t -> {
                    t.setPriority(newPriority);
                    taskService.save(t);
                });
        }
        return ResponseEntity.ok().build();
    }

    @PutMapping("/{id}/start")
    public ResponseEntity<TaskDTO> startTask(@PathVariable Integer id, 
                                           @RequestBody(required = false) Map<String, String> requestBody,
                                           @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                           @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"Sales_Executive".equals(userRole)) {
            return ResponseEntity.badRequest().build();
        }
        
        // Verify task is assigned to this executive
        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isEmpty() || !taskOpt.get().getOwner().getUserId().equals(userId)) {
            return ResponseEntity.badRequest().build();
        }
        
        // Mark task notifications as read when executive starts the task
        Task task = taskOpt.get();
        notificationService.markTaskNotificationsAsRead(userId, task.getTitle());
        
        String remarks = requestBody != null ? requestBody.get("remarks") : null;
        Task updatedTask = taskService.startTask(id, remarks);
        
        if (updatedTask != null) {
            return ResponseEntity.ok(TaskMapper.toDTO(updatedTask));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/complete")
    public ResponseEntity<TaskDTO> completeTask(@PathVariable Integer id,
                                              @RequestBody(required = false) Map<String, String> requestBody,
                                              @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                              @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"Sales_Executive".equals(userRole)) {
            return ResponseEntity.badRequest().build();
        }
        
        // Verify task is assigned to this executive
        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isEmpty() || !taskOpt.get().getOwner().getUserId().equals(userId)) {
            return ResponseEntity.badRequest().build();
        }
        
        String remarks = requestBody != null ? requestBody.get("remarks") : null;
        Task updatedTask = taskService.completeTask(id, remarks);
        
        if (updatedTask != null) {
            return ResponseEntity.ok(TaskMapper.toDTO(updatedTask));
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/remarks")
    public ResponseEntity<TaskDTO> updateTaskRemarks(@PathVariable Integer id,
                                                   @RequestBody Map<String, String> requestBody,
                                                   @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                   @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        if (!"Sales_Executive".equals(userRole)) {
            return ResponseEntity.badRequest().build();
        }
        
        // Verify task is assigned to this executive
        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isEmpty() || !taskOpt.get().getOwner().getUserId().equals(userId)) {
            return ResponseEntity.badRequest().build();
        }
        
        String remarks = requestBody.get("remarks");
        Task updatedTask = taskService.updateTaskRemarks(id, remarks);
        
        if (updatedTask != null) {
            return ResponseEntity.ok(TaskMapper.toDTO(updatedTask));
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<TaskDTO> getTaskDetails(@PathVariable Integer id,
                                                 @RequestHeader(value = "X-User-Id", required = false) Integer userId,
                                                 @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Task task = taskOpt.get();
        
        // For executives, only show tasks assigned to them
        if ("Sales_Executive".equals(userRole) && !task.getOwner().getUserId().equals(userId)) {
            return ResponseEntity.badRequest().build();
        }
        
        // Mark task notifications as read when executive views the task
        if ("Sales_Executive".equals(userRole) && task.getOwner().getUserId().equals(userId)) {
            notificationService.markTaskNotificationsAsRead(userId, task.getTitle());
        }
        
        TaskDTO dto = TaskMapper.toDTO(task);
        // TaskMapper already handles createdBy details
        
        return ResponseEntity.ok(dto);
    }

    private Integer getPriorityScore(Task.Priority priority) {
        if (priority == null) return 2; // Medium default
        switch (priority) {
            case High: return 3;
            case Medium: return 2;
            case Low: return 1;
            case Backlog: return 0;
            default: return 2;
        }
    }

    @PostMapping("/{id}/upload-documentation")
    public ResponseEntity<Map<String, String>> uploadDocumentation(
            @PathVariable Integer id,
            @RequestParam("file") MultipartFile file,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        if (!"Sales_Manager".equals(userRole)) {
            return ResponseEntity.status(403).body(Map.of("error", "Only Sales Managers can upload documentation"));
        }
        
        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        try {
            String fileName = file.getOriginalFilename();
            String fileExtension = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
            
            // Validate file type
            if (!fileExtension.equals(".pdf") && !fileExtension.equals(".xlsx") && !fileExtension.equals(".xls")) {
                return ResponseEntity.badRequest().body(Map.of("error", "Only PDF and Excel files are allowed"));
            }
            
            // Validate file size (10MB limit)
            if (file.getSize() > 10 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(Map.of("error", "File size exceeds 10MB limit"));
            }
            
            Task task = taskOpt.get();
            
            // Check for duplicate document name
            if (task.getDocumentName() != null && !task.getDocumentName().trim().isEmpty()) {
                String existingDocNames = task.getDocumentName();
                if (existingDocNames.contains(", ")) {
                    // Multiple files - check each one
                    String[] existingNames = existingDocNames.split(", ");
                    for (String existingName : existingNames) {
                        if (existingName.trim().equalsIgnoreCase(fileName)) {
                            return ResponseEntity.status(409).body(Map.of(
                                "error", "DUPLICATE_DOCUMENT",
                                "message", "Document already exists: " + fileName
                            ));
                        }
                    }
                } else {
                    // Single file
                    if (existingDocNames.equalsIgnoreCase(fileName)) {
                        return ResponseEntity.status(409).body(Map.of(
                            "error", "DUPLICATE_DOCUMENT",
                            "message", "Document already exists: " + fileName
                        ));
                    }
                }
            }
            
                // Update task with documentation
                if (task.getDocumentName() != null && !task.getDocumentName().trim().isEmpty()) {
                    // Append to existing documents
                    task.setDocumentName(task.getDocumentName() + ", " + fileName);
                    String existingSizes = task.getDocumentSizes();
                    if (existingSizes != null && !existingSizes.trim().isEmpty()) {
                        task.setDocumentSizes(existingSizes + "," + file.getSize());
                    } else {
                        task.setDocumentSizes(String.valueOf(file.getSize()));
                    }
                } else {
                    // First document
                    task.setDocumentName(fileName);
                    task.setDocumentSizes(String.valueOf(file.getSize()));
                }
                task.setDocuments(file.getBytes());
                task.setDocumentUploadedAt(LocalDateTime.now());
                Task savedTask = taskService.save(task);
                
                // Force update document sizes using native SQL to ensure persistence
                taskService.updateDocumentSizes(savedTask.getTaskId(), task.getDocumentSizes());
            
            return ResponseEntity.ok(Map.of(
                "message", "Documentation uploaded successfully",
                "fileName", fileName
            ));
            
        } catch (IOException e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        }
    }
    
    @GetMapping("/{id}/download-documentation")
    public ResponseEntity<byte[]> downloadDocumentation(
            @PathVariable Integer id,
            @RequestParam(required = false) String fileName,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isEmpty() || taskOpt.get().getDocuments() == null) {
            return ResponseEntity.notFound().build();
        }
        
        Task task = taskOpt.get();
        byte[] documents = task.getDocuments();
        String documentNames = task.getDocumentName();
        
        if (fileName != null && documentNames != null && documentNames.contains(", ")) {
            // Multiple files - extract specific file
            String[] fileNames = documentNames.split(", ");
            int fileIndex = -1;
            for (int i = 0; i < fileNames.length; i++) {
                if (fileNames[i].trim().equals(fileName.trim())) {
                    fileIndex = i;
                    break;
                }
            }
            
            if (fileIndex >= 0) {
                byte[] fileData = extractFileFromConcatenated(documents, fileIndex);
                if (fileData != null) {
                    return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_OCTET_STREAM)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                        .body(fileData);
                }
            }
        }
        
        // Single file or download all
        String downloadFileName = fileName != null ? fileName : "task_" + id + "_document";
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_OCTET_STREAM)
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + downloadFileName + "\"")
            .body(documents);
    }
    
    @GetMapping("/{id}/view-documentation")
    public ResponseEntity<byte[]> viewDocumentation(
            @PathVariable Integer id,
            @RequestParam(required = false) String fileName,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isEmpty() || taskOpt.get().getDocuments() == null) {
            return ResponseEntity.notFound().build();
        }
        
        Task task = taskOpt.get();
        byte[] documents = task.getDocuments();
        String documentNames = task.getDocumentName();
        String actualFileName = fileName != null ? fileName : documentNames;
        
        if (fileName != null && documentNames != null && documentNames.contains(", ")) {
            // Multiple files - extract specific file
            String[] fileNames = documentNames.split(", ");
            int fileIndex = -1;
            for (int i = 0; i < fileNames.length; i++) {
                if (fileNames[i].trim().equals(fileName.trim())) {
                    fileIndex = i;
                    actualFileName = fileNames[i].trim();
                    break;
                }
            }
            
            if (fileIndex >= 0) {
                byte[] fileData = extractFileFromConcatenated(documents, fileIndex);
                if (fileData != null) {
                    MediaType contentType = getContentTypeForFile(actualFileName);
                    return ResponseEntity.ok()
                        .contentType(contentType)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + java.net.URLEncoder.encode(actualFileName, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20"))
                        .body(fileData);
                }
            }
        }
        
        // Single file
        MediaType contentType = getContentTypeForFile(actualFileName);
        return ResponseEntity.ok()
            .contentType(contentType)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename*=UTF-8''" + java.net.URLEncoder.encode(actualFileName != null ? actualFileName : "document", java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20"))
            .body(documents);
    }
    
    private MediaType getContentTypeForFile(String filename) {
        if (filename == null) return MediaType.APPLICATION_OCTET_STREAM;
        
        String ext = filename.toLowerCase();
        if (ext.endsWith(".pdf")) return MediaType.APPLICATION_PDF;
        else if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) return MediaType.IMAGE_JPEG;
        else if (ext.endsWith(".png")) return MediaType.IMAGE_PNG;
        else if (ext.endsWith(".gif")) return MediaType.IMAGE_GIF;
        else if (ext.endsWith(".txt")) return MediaType.TEXT_PLAIN;
        else if (ext.endsWith(".xlsx")) return MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        else if (ext.endsWith(".xls")) return MediaType.parseMediaType("application/vnd.ms-excel");
        else if (ext.endsWith(".ppt")) return MediaType.parseMediaType("application/vnd.ms-powerpoint");
        else if (ext.endsWith(".pptx")) return MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.presentationml.presentation");
        else return MediaType.APPLICATION_OCTET_STREAM;
    }
    
    private byte[] extractFileFromConcatenated(byte[] allData, int fileIndex) {
        try {
            int offset = 0;
            for (int i = 0; i <= fileIndex; i++) {
                if (offset + 4 > allData.length) return null;
                
                // Read file size (4 bytes)
                int fileSize = ((allData[offset] & 0xFF) << 24) |
                              ((allData[offset + 1] & 0xFF) << 16) |
                              ((allData[offset + 2] & 0xFF) << 8) |
                              (allData[offset + 3] & 0xFF);
                
                offset += 4;
                
                if (i == fileIndex) {
                    // This is the file we want
                    if (offset + fileSize > allData.length) return null;
                    byte[] fileData = new byte[fileSize];
                    System.arraycopy(allData, offset, fileData, 0, fileSize);
                    return fileData;
                }
                
                // Skip this file
                offset += fileSize;
            }
        } catch (Exception e) {
        }
        return null;
    }
    
    @DeleteMapping("/{id}/documentation")
    public ResponseEntity<Map<String, String>> deleteDocumentation(
            @PathVariable Integer id,
            @RequestParam(required = false) String fileName,
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        Optional<Task> taskOpt = taskService.findById(id);
        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Task task = taskOpt.get();
        
        // Check permissions
        if ("Sales_VP".equals(userRole)) {
            // VP can delete any task documentation
        } else if ("Sales_Manager".equals(userRole)) {
            // Manager can delete documentation only for tasks they assigned (not their own tasks)
            if (task.getOwner() != null && userId.equals(task.getOwner().getUserId())) {
                return ResponseEntity.status(403).body(Map.of("error", "Cannot delete documentation from your own tasks"));
            }
        } else {
            return ResponseEntity.status(403).body(Map.of("error", "Only Sales Managers and VPs can delete documentation"));
        }
        
        if (task.getDocuments() != null && task.getDocumentName() != null) {
            if (fileName != null && task.getDocumentName().contains(", ")) {
                // Multiple files - remove specific file
                String[] fileNames = task.getDocumentName().split(", ");
                if (fileNames.length > 1) {
                    // Remove the specific file from the list
                    String updatedNames = String.join(", ", 
                        java.util.Arrays.stream(fileNames)
                            .filter(name -> !name.trim().equals(fileName.trim()))
                            .toArray(String[]::new));
                    
                    if (updatedNames.isEmpty()) {
                        // No files left, remove all
                        task.setDocuments(null);
                        task.setDocumentName(null);
                    } else {
                        // Update with remaining files (simplified - removes file data too)
                        task.setDocumentName(updatedNames);
                        // Note: This is a simplified implementation that removes the file name
                        // but doesn't extract the actual file data from the byte array
                        // For a complete implementation, you'd need to rebuild the byte array
                    }
                } else {
                    // Only one file, remove all
                    task.setDocuments(null);
                    task.setDocumentName(null);
                }
            } else {
                // Single file or delete all
                task.setDocuments(null);
                task.setDocumentName(null);
            }
            
            taskService.save(task);
            return ResponseEntity.ok(Map.of("message", "Documentation deleted successfully"));
        }
        
        return ResponseEntity.ok(Map.of("message", "No documentation to delete"));
    }



    @GetMapping("/manager/assigned")
    public ResponseEntity<List<TaskDTO>> getManagerAssignedTasks(
            @RequestHeader(value = "X-User-Id", required = false) Integer userId,
            @RequestHeader(value = "X-User-Role", required = false) String userRole
    ) {
        if (!"Sales_Manager".equals(userRole) || userId == null) {
            return ResponseEntity.badRequest().build();
        }

        // Get tasks assigned to executives under this manager (tasks created by this manager)
        // Use ultra-optimized native SQL query to avoid N+1 issues and speed up fetch
        List<Task> tasks = taskService.findByCreatedByOptimized(userId);
        
        List<TaskDTO> taskDTOs = tasks.stream().map(TaskMapper::toDTO).collect(Collectors.toList());

        return ResponseEntity.ok(taskDTOs);
    }

    public static class BulkPrioritizeRequest {
        private List<Integer> taskIds;
        private String priority;

        public List<Integer> getTaskIds() { return taskIds; }
        public void setTaskIds(List<Integer> taskIds) { this.taskIds = taskIds; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
    }
}