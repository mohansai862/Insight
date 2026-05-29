package com.techtammina.crm.mapper;

import com.techtammina.crm.dto.TaskDTO;
import com.techtammina.crm.entity.Task;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Arrays;
import java.time.format.DateTimeFormatter;

@Component
public class TaskMapper {

    private static UsersRepository usersRepository;

    @Autowired
    public TaskMapper(UsersRepository usersRepository) {
        TaskMapper.usersRepository = usersRepository;
    }

    public static TaskDTO toDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setTaskId(task.getTaskId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());

        dto.setPriority(task.getPriority() != null ? task.getPriority().name() : null);
        dto.setStatus(task.getStatus() != null ? task.getStatus().name() : null);
        dto.setDueDate(task.getDueDate());
        dto.setDueTime(task.getDueTime() != null ? task.getDueTime().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) : null);
        
        // Handle owner information
        if (task.getOwner() != null) {
            dto.setOwnerId(task.getOwner().getUserId());
            String fullName = (task.getOwner().getFirstName() != null ? task.getOwner().getFirstName() : "") + 
                             (task.getOwner().getLastName() != null ? " " + task.getOwner().getLastName() : "");
            dto.setOwnerName(fullName.trim().isEmpty() ? task.getOwner().getUsername() : fullName.trim());
            dto.setOwnerEmail(task.getOwner().getEmail());
        }
        
        dto.setCreatedBy(task.getCreatedBy() != null ? task.getCreatedBy().getUserId() : null);
        if (task.getCreatedBy() != null) {
            String createdByFullName = (task.getCreatedBy().getFirstName() != null ? task.getCreatedBy().getFirstName() : "") + 
                                     (task.getCreatedBy().getLastName() != null ? " " + task.getCreatedBy().getLastName() : "");
            dto.setCreatedByName(createdByFullName.trim().isEmpty() ? task.getCreatedBy().getUsername() : createdByFullName.trim());
            dto.setCreatedByEmail(task.getCreatedBy().getEmail());
        }
        dto.setRemarks(task.getRemarks());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        dto.setHasDocumentation(task.getDocuments() != null && task.getDocuments().length > 0);
        dto.setDocumentName(task.getDocumentName());
        dto.setDocumentSizes(task.getDocumentSizes());
        dto.setDocumentUploadedAt(task.getDocumentUploadedAt());
        
        // Set attachment information from document_name field
        if (task.getDocumentName() != null && task.getDocumentName().contains(", ")) {
            String[] fileNames = task.getDocumentName().split(", ");
            dto.setAttachmentCount(fileNames.length);
            dto.setAttachmentNames(java.util.Arrays.asList(fileNames));
        } else if (task.getDocumentName() != null && !task.getDocumentName().trim().isEmpty()) {
            dto.setAttachmentCount(1);
            dto.setAttachmentNames(java.util.Arrays.asList(task.getDocumentName()));
        } else {
            dto.setAttachmentCount(0);
            dto.setAttachmentNames(new java.util.ArrayList<>());
        }
        
        return dto;
    }

    public static Task toEntity(TaskDTO dto) {
        Task task = new Task();
        task.setTaskId(dto.getTaskId());
        task.setTitle(dto.getTitle());
        task.setDescription(dto.getDescription());
        

        
        // Handle priority mapping
        if (dto.getPriority() != null) {
            try {
                String priorityStr = dto.getPriority().toUpperCase();
                if ("HIGH".equals(priorityStr)) {
                    task.setPriority(Task.Priority.High);
                } else if ("LOW".equals(priorityStr)) {
                    task.setPriority(Task.Priority.Low);
                } else if ("BACKLOG".equals(priorityStr)) {
                    task.setPriority(Task.Priority.Backlog);
                } else {
                    task.setPriority(Task.Priority.Medium);
                }
            } catch (Exception e) {
                task.setPriority(Task.Priority.Medium);
            }
        }
        
        // Handle status mapping
        if (dto.getStatus() != null) {
            try {
                String statusStr = dto.getStatus().toUpperCase();
                if ("PENDING".equals(statusStr)) {
                    task.setStatus(Task.Status.Pending);
                } else if ("IN_PROGRESS".equals(statusStr)) {
                    task.setStatus(Task.Status.In_Progress);
                } else if ("COMPLETED".equals(statusStr)) {
                    task.setStatus(Task.Status.Completed);
                } else if ("CANCELLED".equals(statusStr)) {
                    task.setStatus(Task.Status.Cancelled);
                } else {
                    task.setStatus(Task.Status.Pending);
                }
            } catch (Exception e) {
                task.setStatus(Task.Status.Pending);
            }
        }
        
        task.setDueDate(dto.getDueDate());
        if (dto.getDueTime() != null && !dto.getDueTime().isEmpty()) {
            try {
                String timeStr = dto.getDueTime();
                // Add :00 seconds if not present (HH:mm -> HH:mm:00)
                if (timeStr.length() == 5 && timeStr.matches("\\d{2}:\\d{2}")) {
                    timeStr += ":00";
                }
                task.setDueTime(java.time.LocalTime.parse(timeStr));
            } catch (Exception e) {
            }
        }

        if (dto.getOwnerId() != null && usersRepository != null) {
            Users owner = usersRepository.findById(dto.getOwnerId()).orElse(null);
            if (owner != null) {
                task.setOwner(owner);
            } else {
                // Log warning but don't fail - let controller handle validation
            }
        }
        if (dto.getCreatedBy() != null && usersRepository != null) {
            Users creator = usersRepository.findById(dto.getCreatedBy()).orElse(null);
            if (creator != null) task.setCreatedBy(creator);
        }
        
        task.setRemarks(dto.getRemarks());
        
        // Set document name if provided
        if (dto.getDocumentName() != null && !dto.getDocumentName().trim().isEmpty()) {
            task.setDocumentName(dto.getDocumentName().trim());
        }
        
        // Set document metadata
        task.setDocumentSizes(dto.getDocumentSizes());
        task.setDocumentUploadedAt(dto.getDocumentUploadedAt());
        
        return task;
    }

    private static String normalizeEnum(String val) {
        // Map frontend values to Java enum style
        String[] parts = val.trim().split("_");
        StringBuilder sb = new StringBuilder();
        for (String part : parts) {
            if (part.length() > 0) {
                sb.append(part.substring(0, 1).toUpperCase()).append(part.substring(1).toLowerCase());
            }
            sb.append("_");
        }
        if (sb.length() > 0) sb.setLength(sb.length() - 1);
        return sb.toString();
    }
}

