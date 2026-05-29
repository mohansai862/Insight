import { logger } from '@/utils/logger';
// src/lib/environment.ts

// Detect if app is running locally (LAN IP or localhost)
const isLocal =
  window.location.hostname.startsWith("30.") ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// Environment configuration
export const environment = {
  // Automatically detect production vs development
  production: !isLocal,

  // Dynamic API base URL (switches automatically)
  apiURL: (window.location.hostname === "crms.tamminademoapps.com")
    ? "http://crms.tamminahub.com/api"  // Force production URL
    : isLocal
    ? "http://localhost:8081/api"  // Local development
    : "http://crms.tamminahub.com/api", // Production backend

  // Optional SIP settings loaded from .env
  sip: {
    server: import.meta.env.VITE_SIP_SERVER,
    username: import.meta.env.VITE_SIP_USERNAME,
    password: import.meta.env.VITE_SIP_PASSWORD,
    realm: import.meta.env.VITE_SIP_REALM,
  },

  // Feature flags and security toggles
  features: {
    enableHttps: import.meta.env.VITE_ENABLE_HTTPS === "false",
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
    tracking: import.meta.env.VITE_ENABLE_TRACKING === "true",
  },
};

// Debug logs for confirmation
logger.info("🌍 Environment Mode:", environment.production ? "Production" : "Development");
logger.info("🔗 API Base URL:", environment.apiURL);
