export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
  enableLogging: boolean;
  logLevel: LogLevel;
  prefix?: string;
}

export class Logger {
  private config: LoggerConfig;
  private readonly logLevels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(config: LoggerConfig) {
    this.config = config;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enableLogging) return false;
    return this.logLevels[level] >= this.logLevels[this.config.logLevel];
  }

  private formatMessage(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    const prefix = this.config.prefix || 'CapacitorAuthManager';
    return `[${timestamp}] [${prefix}] [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), error);
    }
  }

  setLogLevel(level: LogLevel): void {
    this.config.logLevel = level;
  }

  setEnabled(enabled: boolean): void {
    this.config.enableLogging = enabled;
  }
}
