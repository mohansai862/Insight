package com.techtammina.crm.service;

import com.techtammina.crm.dto.SalesExecutiveResponse;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.ActivityRepository;
import com.techtammina.crm.repository.LeadRepository;
import com.techtammina.crm.repository.TaskRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SalesExecutiveService {
    private final UsersRepository usersRepository;
    private final LeadRepository leadRepository;
    private final TaskRepository taskRepository;
    private final ActivityRepository activityRepository;

    public SalesExecutiveService(UsersRepository usersRepository, LeadRepository leadRepository, TaskRepository taskRepository, ActivityRepository activityRepository) {
        this.usersRepository = usersRepository;
        this.leadRepository = leadRepository;
        this.taskRepository = taskRepository;
        this.activityRepository = activityRepository;
    }

    public List<SalesExecutiveResponse> getAllExecutivesWithCounts() {
        List<Users> executives = usersRepository.findAll().stream()
                .filter(user -> "Sales_Executive".equals(user.getRole()))
                .collect(Collectors.toList());

        return executives.stream().map(exec -> {
            int leads = (int) leadRepository.countByExecutiveId(exec.getUserId());
            int tasks = (int) taskRepository.countByOwner_UserId(exec.getUserId());
            int comms = (int) activityRepository.countByCreatedBy_UserId(exec.getUserId());
            return new SalesExecutiveResponse(exec.getUserId().longValue(), exec.getUsername(), exec.getEmail(), exec.getPhoneNumber(), leads, tasks, comms);
        }).collect(Collectors.toList());
    }

    public List<?> getExecutiveTasks(Long executiveId, String createdBy) {
        if (createdBy != null && !createdBy.isEmpty()) {
            return taskRepository.findByOwner_UserIdAndCreatedBy_Email(executiveId.intValue(), createdBy);
        } else {
            return taskRepository.findByOwner_UserId(executiveId.intValue());
        }
    }

    public List<?> getExecutiveCommunications(Long executiveId, String createdBy) {
        if (createdBy != null && !createdBy.isEmpty()) {
            return activityRepository.findByCreatedBy_UserIdAndCreatedBy_Email(executiveId.intValue(), createdBy);
        } else {
            return activityRepository.findByCreatedBy_UserId(executiveId.intValue());
        }
    }
}

