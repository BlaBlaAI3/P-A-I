/**
 * BUDDY Logging System
 * Simple, effective logging for tracking BUDDY's activities and learning
 */

import * as fs from 'fs';
import * as path from 'path';

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  BUDDY = 'BUDDY', // Special level for BUDDY-specific events
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  metadata?: Record<string, any>;
}

export class Logger {
  private logsDir: string;
  private logFile: string;

  constructor(logsDir: string = path.join(process.cwd(), 'LOGS')) {
    this.logsDir = logsDir;
    this.logFile = path.join(
      logsDir,
      `buddy-${this.getDateString()}.log`
    );

    // Ensure logs directory exists
    this.ensureLogsDir();
  }

  private ensureLogsDir(): void {
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  private getDateString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  private formatLogEntry(entry: LogEntry): string {
    const metaStr = entry.metadata
      ? ` | ${JSON.stringify(entry.metadata)}`
      : '';
    return `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}${metaStr}\n`;
  }

  public log(
    level: LogLevel,
    category: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: this.getTimestamp(),
      level,
      category,
      message,
      metadata,
    };

    const formatted = this.formatLogEntry(entry);

    // Write to file
    try {
      fs.appendFileSync(this.logFile, formatted, 'utf8');
    } catch (error) {
      console.error('Failed to write log:', error);
    }

    // Also output to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(formatted.trim());
    }
  }

  // Convenience methods
  public debug(category: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, category, message, metadata);
  }

  public info(category: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, category, message, metadata);
  }

  public warn(category: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, category, message, metadata);
  }

  public error(category: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, category, message, metadata);
  }

  public buddy(category: string, message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.BUDDY, category, message, metadata);
  }

  // Specialized logging methods
  public logInteraction(action: string, context?: Record<string, any>): void {
    this.buddy('INTERACTION', action, context);
  }

  public logSuggestion(suggestion: string, accepted: boolean): void {
    this.buddy('SUGGESTION', suggestion, { accepted });
  }

  public logPattern(pattern: string, details?: Record<string, any>): void {
    this.buddy('PATTERN', pattern, details);
  }

  public logLearning(learning: string, source?: string): void {
    this.buddy('LEARNING', learning, { source });
  }

  // Read recent logs
  public getRecentLogs(lines: number = 50): string[] {
    try {
      const content = fs.readFileSync(this.logFile, 'utf8');
      const allLines = content.split('\n').filter(line => line.trim());
      return allLines.slice(-lines);
    } catch (error) {
      return [];
    }
  }

  // Get logs for a specific date
  public getLogsForDate(date: string): string {
    const dateLogFile = path.join(this.logsDir, `buddy-${date}.log`);
    try {
      return fs.readFileSync(dateLogFile, 'utf8');
    } catch (error) {
      return '';
    }
  }

  // Clean old logs (keep last N days)
  public cleanOldLogs(keepDays: number = 30): void {
    try {
      const files = fs.readdirSync(this.logsDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - keepDays);

      files.forEach(file => {
        if (file.startsWith('buddy-') && file.endsWith('.log')) {
          const filePath = path.join(this.logsDir, file);
          const stats = fs.statSync(filePath);

          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
            this.info('CLEANUP', `Deleted old log file: ${file}`);
          }
        }
      });
    } catch (error) {
      this.error('CLEANUP', 'Failed to clean old logs', { error: String(error) });
    }
  }
}

// Singleton instance
let loggerInstance: Logger | null = null;

export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

// Export default instance
export default getLogger();
