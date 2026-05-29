package com.techtammina.crm.service;

import com.techtammina.crm.dto.StageTransitionDTO;
import com.techtammina.crm.entity.Deal;
import com.techtammina.crm.entity.DealStageTransition;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.DealStageTransitionRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DealStageTransitionService {
    
    @Autowired
    private DealStageTransitionRepository repository;
    
    @Autowired
    private UsersRepository usersRepository;
    
    public void recordStageTransition(Deal deal, String previousStage, String newStage, Integer userId) {
        DealStageTransition transition = new DealStageTransition(deal, previousStage, newStage, userId);
        repository.save(transition);
    }
    
    public List<DealStageTransition> getTransitionsByDealId(Integer dealId) {
        return repository.findByDealIdOrderByTimestampDesc(dealId);
    }
    
    public List<DealStageTransition> getDirectJumpsByDealId(Integer dealId) {
        return repository.findDirectJumpsByDealId(dealId);
    }
    
    public List<StageTransitionDTO> getDealStageTransitions(Integer dealId) {
        List<DealStageTransition> transitions = repository.findByDealIdOrderByTimestampDesc(dealId);
        return transitions.stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    private StageTransitionDTO convertToDTO(DealStageTransition transition) {
        String userName = "Unknown User";
        if (transition.getUserId() != null) {
            Users user = usersRepository.findById(transition.getUserId()).orElse(null);
            if (user != null) {
                userName = user.getFirstName() + " " + user.getLastName();
            }
        }
        
        return new StageTransitionDTO(
            transition.getId(),
            transition.getPreviousStage(),
            transition.getNewStage(),
            transition.getChangedAt(),
            userName,
            transition.getIsDirectJump()
        );
    }
}