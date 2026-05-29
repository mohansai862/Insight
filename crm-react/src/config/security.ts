/**
 * Security Configuration
 * Centralized security settings and policies
 */

// Content Security Policy
export const CSP_POLICY = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
  'style-src': ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
  'font-src': ["'self'", "https://fonts.gstatic.com"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'", "wss:", "https:"],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
  'upgrade-insecure-requests': []
};

// Security Headers
export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Rate Limiting Configuration
export const RATE_LIMITS = {
  API_REQUESTS: { maxRequests: 100, windowMs: 60000 }, // 100 requests per minute
  LOGIN_ATTEMPTS: { maxRequests: 5, windowMs: 300000 }, // 5 attempts per 5 minutes
  PASSWORD_RESET: { maxRequests: 3, windowMs: 3600000 } // 3 attempts per hour
};

// Input Validation Rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  JWT: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
  HEX_COLOR: /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
  SAFE_FILENAME: /^[a-zA-Z0-9._-]+$/
};

// Allowed File Types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  ARCHIVES: ['application/zip', 'application/x-rar-compressed']
};

// Maximum File Sizes (in bytes)
export const MAX_FILE_SIZES = {
  IMAGE: 5 * 1024 * 1024, // 5MB
  DOCUMENT: 10 * 1024 * 1024, // 10MB
  ARCHIVE: 50 * 1024 * 1024 // 50MB
};

// Environment-specific security settings
export const getSecurityConfig = () => {
  const isDevelopment = import.meta.env.NODE_ENV === 'development';
  
  return {
    enableCSP: !isDevelopment,
    enableHTTPS: import.meta.env.VITE_ENABLE_HTTPS === 'true',
    enableSecurityHeaders: true,
    enableRateLimiting: true,
    enableAuditLogging: true,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    tokenRefreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    requireMFA: false // Can be enabled per user/role
  };
};