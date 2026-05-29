package com.techtammina.crm.service;

import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.techtammina.crm.entity.CallLog;
import com.techtammina.crm.entity.Users;
import com.techtammina.crm.repository.CallLogRepository;
import com.techtammina.crm.repository.UsersRepository;
import org.asteriskjava.manager.*;
import org.asteriskjava.manager.action.OriginateAction;
import org.asteriskjava.manager.response.ManagerResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
public class AsteriskService {
    private static final Logger log = LoggerFactory.getLogger(AsteriskService.class);
    
    @Value("${asterisk.host}")
    private String asteriskHost;
    
    @Value("${asterisk.port}")
    private int asteriskPort;
    
    @Value("${asterisk.username}")
    private String asteriskUsername;
    
    @Value("${asterisk.password}")
    private String asteriskPassword;
    
    @Value("${asterisk.timeout}")
    private long asteriskTimeout;
    
    @Value("${asterisk.context}")
    private String asteriskContext;
    
    private final CallLogRepository callLogRepository;
    private final UsersRepository usersRepository;
    private ManagerConnection managerConnection;
    
    public AsteriskService(CallLogRepository callLogRepository, UsersRepository usersRepository) {
        this.callLogRepository = callLogRepository;
        this.usersRepository = usersRepository;
    }
    
    /**
     * Initialize connection to Asterisk Manager Interface
     */
    public void connect() throws Exception {
        if (managerConnection != null && managerConnection.getState() == ManagerConnectionState.CONNECTED) {
            return;
        }
        
        ManagerConnectionFactory factory = new ManagerConnectionFactory(asteriskHost, asteriskPort, asteriskUsername, asteriskPassword);
        managerConnection = factory.createManagerConnection();
        
        try {
            managerConnection.login();
            log.info("Successfully connected to Asterisk AMI at {}:{}", asteriskHost, asteriskPort);
        } catch (Exception e) {
            log.error("Failed to connect to Asterisk AMI: {}", e.getMessage());
            throw new RuntimeException("Unable to connect to Asterisk server", e);
        }
    }
    
    /**
     * Originate a call from agent extension to customer number
     */
    public String originateCall(String agentExtension, String customerNumber, Integer contactId, Integer userId) {
        try {
            connect();
            
            String callId = UUID.randomUUID().toString();
            
            // Create call log entry
            CallLog callLog = new CallLog();
            callLog.setAsteriskCallId(callId);
            callLog.setAgentExtension(agentExtension);
            callLog.setContactPhone(customerNumber);
            callLog.setLeadId(contactId); // Assuming contactId is leadId for now
            callLog.setCallStatus(CallLog.CallStatus.NO_ANSWER); // Initial status
            callLog.setCallStartTime(LocalDateTime.now());
            
            if (userId != null) {
                Users user = usersRepository.findById(userId).orElse(null);
                callLog.setSalesExecutive(user);
            }
            
            callLogRepository.save(callLog);
            
            // Create originate action
            OriginateAction originateAction = new OriginateAction();
            originateAction.setChannel("SIP/" + agentExtension);
            originateAction.setContext(asteriskContext);
            originateAction.setExten(customerNumber);
            originateAction.setPriority(1);
            originateAction.setTimeout(asteriskTimeout);
            originateAction.setCallerId("CRM Call <" + agentExtension + ">");
            originateAction.setVariable("CALL_ID", callId);
            
            // Send originate action
            ManagerResponse response = managerConnection.sendAction(originateAction, asteriskTimeout);
            
            if (response.getResponse().equals("Success")) {
                log.info("Call initiated successfully. Call ID: {}, Agent: {}, Customer: {}", 
                           callId, agentExtension, customerNumber);
                
                // Update call status to in progress
                callLog.setCallStatus(CallLog.CallStatus.NO_ANSWER);
                callLogRepository.save(callLog);
                
                return callId;
            } else {
                log.error("Failed to initiate call: {}", response.getMessage());
                
                // Update call status to failed
                callLog.setCallStatus(CallLog.CallStatus.FAILED);
                callLog.setCallNotes("Failed: " + response.getMessage());
                callLogRepository.save(callLog);
                
                throw new RuntimeException("Failed to initiate call: " + response.getMessage());
            }
            
        } catch (Exception e) {
            log.error("Error originating call: {}", e.getMessage(), e);
            throw new RuntimeException("Call initiation failed", e);
        }
    }
    
    /**
     * Get call status by call ID
     */
    public CallLog getCallStatus(String asteriskCallId) {
        // For now, find by call notes containing the asterisk call ID
        List<CallLog> allCalls = callLogRepository.findAll();
        return allCalls.stream()
                .filter(call -> asteriskCallId.equals(call.getAsteriskCallId()))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Call not found: " + asteriskCallId));
    }
    
    /**
     * Update call status
     */
    public void updateCallStatus(String asteriskCallId, CallLog.CallStatus status, String notes) {
        List<CallLog> allCalls = callLogRepository.findAll();
        CallLog callLog = allCalls.stream()
                .filter(call -> asteriskCallId.equals(call.getAsteriskCallId()))
                .findFirst()
                .orElse(null);
        if (callLog != null) {
            callLog.setCallStatus(status);
            if (notes != null) {
                callLog.setCallNotes(notes);
            }
            
            if (status == CallLog.CallStatus.COMPLETED && callLog.getCallEndTime() == null) {
                callLog.setCallEndTime(LocalDateTime.now());
                
                // Calculate duration if both start and end times are available
                if (callLog.getCallStartTime() != null) {
                    long duration = java.time.Duration.between(callLog.getCallStartTime(), callLog.getCallEndTime()).getSeconds();
                    callLog.setCallDurationSeconds((int) duration);
                }
            }
            
            callLogRepository.save(callLog);
            log.info("Updated call status: {} -> {}", asteriskCallId, status);
        }
    }
    
    /**
     * Disconnect from Asterisk AMI
     */
    public void disconnect() {
        if (managerConnection != null && managerConnection.getState() == ManagerConnectionState.CONNECTED) {
            try {
                managerConnection.logoff();
                log.info("Disconnected from Asterisk AMI");
            } catch (Exception e) {
                log.error("Error disconnecting from Asterisk AMI: {}", e.getMessage());
            }
        }
    }
}