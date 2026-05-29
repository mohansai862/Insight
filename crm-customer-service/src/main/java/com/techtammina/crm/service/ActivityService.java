package com.techtammina.crm.service;

import com.techtammina.crm.entity.Activity;
import com.techtammina.crm.repository.ActivityRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;

    @Autowired
    public ActivityService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    public List<Activity> findAll() {
        try {
            return activityRepository.findAll();
        } catch (Exception e) {
            // Handle orphaned activities by returning empty list
            return java.util.Collections.emptyList();
        }
    }

    public Optional<Activity> findById(Integer id) {
        return activityRepository.findById(id);
    }

    public Activity save(Activity activity) {
        return activityRepository.save(activity);
    }

    public void deleteById(Integer id) {
        activityRepository.deleteById(id);
    }

    public List<Activity> findByLeadId(Integer leadId) {
        return activityRepository.findByLead_LeadId(leadId);
    }

    public List<Activity> findByCreatedBy(Integer userId) {
        // Get activities created by user or by their team members (if user is manager)
        List<Activity> activities = activityRepository.findByCreatedBy_UserId(userId);
        List<Activity> teamActivities = activityRepository.findByCreatedBy_ManagerId(userId);
        activities.addAll(teamActivities);
        return activities;
    }

    public List<Activity> findByLeadIdAndCreatedBy(Integer leadId, Integer userId) {
        // Get activities for lead created by user or by their team members (if user is manager)
        List<Activity> activities = activityRepository.findByLead_LeadIdAndCreatedBy_UserId(leadId, userId);
        List<Activity> teamActivities = activityRepository.findByLead_LeadIdAndCreatedBy_ManagerId(leadId, userId);
        activities.addAll(teamActivities);
        return activities;
    }
}

