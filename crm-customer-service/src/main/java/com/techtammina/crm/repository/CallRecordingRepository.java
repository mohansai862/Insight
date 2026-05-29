package com.techtammina.crm.repository;

import com.techtammina.crm.entity.CallRecording;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CallRecordingRepository extends JpaRepository<CallRecording, Integer> {
    
    List<CallRecording> findByCallIdOrderByCreatedAtDesc(Integer callId);
}

