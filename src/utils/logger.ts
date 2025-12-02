type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class Logger {
  private level: LogLevel = 'info';
  private prefix: string = '[bitbucket-mcp]';

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private formatMessage(level: LogLevel, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';
    return `${timestamp} ${this.prefix} [${level.toUpperCase()}] ${message}${dataStr}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.error(this.formatMessage('debug', message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.error(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.error(this.formatMessage('warn', message, data));
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }
}

export const logger = new Logger();

