/**
 * Security Middleware
 * Handles security-related functionality across the application
 */

import { sanitizeString, isValidJWT } from '@/utils/security';
import { RATE_LIMITS, getSecurityConfig } from '@/config/security';

// Rate limiter instances
const rateLimiters = new Map<string, (key: string) => boolean>();

// Initialize rate limiters
const createRateLimiter = (maxRequests: number, windowMs: number) => {
  const requests = new Map<string, number[]>();
  
  return (key: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const keyRequests = requests.get(key)!;
    const validRequests = keyRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    return true;
  };
};

// Initialize rate limiters
rateLimiters.set('api', createRateLimiter(RATE_LIMITS.API_REQUESTS.maxRequests, RATE_LIMITS.API_REQUESTS.windowMs));
rateLimiters.set('login', createRateLimiter(RATE_LIMITS.LOGIN_ATTEMPTS.maxRequests, RATE_LIMITS.LOGIN_ATTEMPTS.windowMs));

// Security middleware for API requests
export const securityMiddleware = {
  // Validate and sanitize request data
  sanitizeRequest: (data: any): any => {
    if (typeof data === 'string') {
      return sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => securityMiddleware.sanitizeRequest(item));
    }
    
    if (data && typeof data === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[sanitizeString(key)] = securityMiddleware.sanitizeRequest(value);
      }
      return sanitized;
    }
    
    return data;
  },

  // Check rate limits
  checkRateLimit: (type: 'api' | 'login', identifier: string): boolean => {
    const limiter = rateLimiters.get(type);
    return limiter ? limiter(identifier) : true;
  },

  // Validate JWT token
  validateToken: (token: string): boolean => {
    if (!token || typeof token !== 'string') return false;
    return isValidJWT(token);
  },

  // Secure headers for requests
  getSecureHeaders: (additionalHeaders: Record<string, string> = {}): Record<string, string> => {
    const config = getSecurityConfig();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...additionalHeaders
    };

    if (config.enableSecurityHeaders) {
      headers['X-Requested-With'] = 'XMLHttpRequest';
    }

    return headers;
  },

  // Check if current session is valid
  isSessionValid: (): boolean => {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    if (!securityMiddleware.validateToken(token)) {
      localStorage.removeItem('authToken');
      return false;
    }

    // Check token expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      
      if (payload.exp && payload.exp < now) {
        localStorage.removeItem('authToken');
        return false;
      }
      
      return true;
    } catch {
      localStorage.removeItem('authToken');
      return false;
    }
  }
};

// Initialize security middleware
export const initializeSecurity = () => {
  const config = getSecurityConfig();
  
  // Set up session validation
  if (config.sessionTimeout) {
    setInterval(() => {
      if (!securityMiddleware.isSessionValid()) {
        window.location.href = '/login';
      }
    }, 60000); // Check every minute
  }
};