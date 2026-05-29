/**
 * Security utilities for preventing common vulnerabilities
 */

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/[<>\"'&]/g, (match) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[match] || match;
    });
}

// Sanitize HTML content
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string') return '';
  
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/<object[^>]*>.*?<\/object>/gi, '')
    .replace(/<embed[^>]*>/gi, '')
    .replace(/<link[^>]*>/gi, '')
    .replace(/<meta[^>]*>/gi, '');
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email);
}

// Validate phone number
export function isValidPhone(phoneNumber: string): boolean {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return typeof phoneNumber === 'string' && phoneRegex.test(phoneNumber.replace(/[\s\-\(\)]/g, ''));
}

// Validate URL
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

// Validate JWT token format
export function isValidJWT(token: string): boolean {
  const jwtPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
  return typeof token === 'string' && jwtPattern.test(token);
}

// Validate hex color
export function isValidHexColor(color: string): boolean {
  const hexPattern = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return typeof color === 'string' && hexPattern.test(color);
}

// Safe JSON parsing
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    if (typeof json !== 'string') return defaultValue;
    
    const trimmed = json.trim();
    if (!trimmed) return defaultValue;
    
    // Basic validation for JSON format
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[') && 
        !trimmed.startsWith('"') && !trimmed.match(/^(true|false|null|\d+)$/)) {
      return defaultValue;
    }
    
    return JSON.parse(json);
  } catch {
    return defaultValue;
  }
}

// Prevent path traversal
export function sanitizePath(path: string): string {
  if (typeof path !== 'string') return '';
  
  return path
    .replace(/\.\./g, '')
    .replace(/[<>:"|?*]/g, '')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/');
}

// Rate limiting helper
export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>();
  
  return (key: string): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const keyRequests = requests.get(key)!;
    
    // Remove old requests outside the window
    const validRequests = keyRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return false; // Rate limit exceeded
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    return true; // Request allowed
  };
}

// Content Security Policy helper
export function generateCSPNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Secure random string generator
export function generateSecureId(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  
  return Array.from(array, byte => chars[byte % chars.length]).join('');
}