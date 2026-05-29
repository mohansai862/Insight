package com.techtammina.crm.service;

import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class OtpService {
    
    private final Map<String, OtpData> otpStore = new ConcurrentHashMap<>();
    private final Random random = new Random();
    
    public String generateOtp(String email) {
        String otp = String.format("%06d", random.nextInt(1000000));
        otpStore.put(email.toLowerCase(), new OtpData(otp, LocalDateTime.now().plusMinutes(10)));
        return otp;
    }
    
    public boolean verifyOtp(String email, String otp) {
        OtpData data = otpStore.get(email.toLowerCase());
        if (data == null || data.isExpired() || !data.otp.equals(otp)) {
            return false;
        }
        data.verified = true;
        return true;
    }
    
    public boolean isOtpVerified(String email) {
        OtpData data = otpStore.get(email.toLowerCase());
        return data != null && data.verified && !data.isExpired();
    }
    
    public void storeOtp(String email, String otp) {
        otpStore.put(email.toLowerCase(), new OtpData(otp, LocalDateTime.now().plusMinutes(10)));
    }
    
    public void removeOtp(String email) {
        otpStore.remove(email.toLowerCase());
    }
    
    private static class OtpData {
        final String otp;
        final LocalDateTime expiresAt;
        boolean verified = false;
        
        OtpData(String otp, LocalDateTime expiresAt) {
            this.otp = otp;
            this.expiresAt = expiresAt;
        }
        
        boolean isExpired() {
            return LocalDateTime.now().isAfter(expiresAt);
        }
    }
}

