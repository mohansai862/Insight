package com.techtammina.crm.controller;

import com.techtammina.crm.entity.Call;
import com.techtammina.crm.entity.CallRecording;
import com.techtammina.crm.repository.CallRepository;
import com.techtammina.crm.repository.CallRecordingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/call")
@CrossOrigin(origins = "*")
public class CallController {

    @Autowired
    private CallRepository callRepository;
    
    @Autowired
    private CallRecordingRepository callRecordingRepository;

    @PostMapping("/initiate")
    public ResponseEntity<Call> initiateCall(@RequestBody Map<String, Object> request) {
        try {
            Call call = new Call();
            call.setSalesExecutiveId((Integer) request.get("salesExecutiveId"));
            call.setContactPhone((String) request.get("contactPhone"));
            call.setContactName((String) request.get("contactName"));
            call.setLeadId((Integer) request.get("leadId"));
            call.setDealId((Integer) request.get("dealId"));
            call.setCallStatus(Call.CallStatus.COMPLETED);
            call.setCallStartTime(LocalDateTime.now());
            call.setCallDurationSeconds(0);
            
            Call savedCall = callRepository.save(call);
            return ResponseEntity.ok(savedCall);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/history")
    public ResponseEntity<List<Call>> getCallHistory() {
        List<Call> calls = callRepository.findAllOrderByCreatedAtDesc();
        return ResponseEntity.ok(calls);
    }

    @GetMapping("/recordings/{callId}")
    public ResponseEntity<List<CallRecording>> getCallRecordings(@PathVariable Integer callId) {
        List<CallRecording> recordings = callRecordingRepository.findByCallIdOrderByCreatedAtDesc(callId);
        return ResponseEntity.ok(recordings);
    }
}

