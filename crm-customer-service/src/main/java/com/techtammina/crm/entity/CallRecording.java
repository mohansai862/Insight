package com.techtammina.crm.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "call_recordings")
public class CallRecording {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "recording_id")
    private Integer recordingId;
    
    @Column(name = "call_id")
    private Integer callId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "call_id", insertable = false, updatable = false)
    private Call call;
    
    @Column(name = "file_path", length = 500)
    private String filePath;
    
    @Column(name = "file_size_bytes")
    private Long fileSizeBytes;
    
    @Column(name = "recording_duration_seconds")
    private Integer recordingDurationSeconds;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "recording_status")
    private RecordingStatus recordingStatus;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public enum RecordingStatus {
        RECORDING, COMPLETED, FAILED, DELETED
    }
    
    // Constructors
    public CallRecording() {
        this.createdAt = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Integer getRecordingId() { return recordingId; }
    public void setRecordingId(Integer recordingId) { this.recordingId = recordingId; }
    
    public Integer getCallId() { return callId; }
    public void setCallId(Integer callId) { this.callId = callId; }
    
    public Call getCall() { return call; }
    public void setCall(Call call) { this.call = call; }
    
    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }
    
    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
    
    public Integer getRecordingDurationSeconds() { return recordingDurationSeconds; }
    public void setRecordingDurationSeconds(Integer recordingDurationSeconds) { this.recordingDurationSeconds = recordingDurationSeconds; }
    
    public RecordingStatus getRecordingStatus() { return recordingStatus; }
    public void setRecordingStatus(RecordingStatus recordingStatus) { this.recordingStatus = recordingStatus; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

