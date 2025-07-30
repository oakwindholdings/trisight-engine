// src/utils/logger.ts
// Logging utility for debug and error tracking
// Provides consistent logging across the application

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  module?: string;
  userId?: string;
  sessionId?: string;
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean = process.env.NODE_ENV === 'development';
  private logLevel: LogLevel = 'info';

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, module: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}${dataStr}`;
  }

  debug(module: string, message: string, data?: any): void {
    if (this.shouldLog('debug') && this.isDevelopment) {
      console.log(this.formatMessage('debug', module, message, data));
    }
  }

  info(module: string, message: string, data?: any): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', module, message, data));
    }
  }

  warn(module: string, message: string, data?: any): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', module, message, data));
    }
  }

  error(module: string, message: string, error?: any): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', module, message, error));
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Export convenience functions
export const logDebug = (module: string, message: string, data?: any) => 
  logger.debug(module, message, data);

export const logInfo = (module: string, message: string, data?: any) => 
  logger.info(module, message, data);

export const logWarn = (module: string, message: string, data?: any) => 
  logger.warn(module, message, data);

export const logError = (module: string, message: string, error?: any) => 
  logger.error(module, message, error);

export const setLogLevel = (level: LogLevel) => logger.setLogLevel(level);

export default logger;