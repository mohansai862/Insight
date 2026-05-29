import { logger } from '@/utils/logger';
/**
 * Centralized logging utility for React frontend
 * Only logs in development mode
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (!this.isDevelopment) return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    switch (level) {
      case 'error':
        logger.error(prefix, message, ...args);
        break;
      case 'warn':
        logger.warn(prefix, message, ...args);
        break;
      case 'debug':
        logger.debug(prefix, message, ...args);
        break;
      default:
        logger.info(prefix, message, ...args);
    }
  }

  info(message: string, ...args: any[]) {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log('error', message, ...args);
  }

  debug(message: string, ...args: any[]) {
    this.log('debug', message, ...args);
  }
}

export const logger = new Logger();
