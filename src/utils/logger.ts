import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Define log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

// Define log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: Record<string, any>;
  stackTrace?: string;
}

// Logger configuration
interface LoggerConfig {
  logLevel: LogLevel;
  consoleOutput: boolean;
  fileOutput: boolean;
  logFilePath: string;
  maxLogFileSize: number; // in bytes
  maxLogFiles: number;
}

// Default configuration
const DEFAULT_CONFIG: LoggerConfig = {
  logLevel: LogLevel.INFO,
  consoleOutput: true,
  fileOutput: true,
  logFilePath: path.join(os.homedir(), '.sf-tui', 'logs', 'sf-tui.log'),
  maxLogFileSize: 5 * 1024 * 1024, // 5MB
  maxLogFiles: 5,
};

class Logger {
  private config: LoggerConfig = DEFAULT_CONFIG;
  private static instance: Logger;

  private constructor() {
    this.ensureLogDirectory();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  // Configure the logger
  public configure(partialConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...partialConfig };
    this.ensureLogDirectory();
  }

  // Ensure the log directory exists
  private ensureLogDirectory(): void {
    if (this.config.fileOutput) {
      const logDir = path.dirname(this.config.logFilePath);
      try {
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
      } catch (error) {
        console.error(`Failed to create log directory: ${error}`);
        this.config.fileOutput = false;
      }
    }
  }

  // Check if we should rotate log files
  private checkLogRotation(): void {
    if (!this.config.fileOutput) return;

    try {
      if (fs.existsSync(this.config.logFilePath)) {
        const stats = fs.statSync(this.config.logFilePath);
        if (stats.size >= this.config.maxLogFileSize) {
          this.rotateLogFiles();
        }
      }
    } catch (error) {
      console.error(`Failed to check log rotation: ${error}`);
    }
  }

  // Rotate log files
  private rotateLogFiles(): void {
    try {
      // Remove oldest log file if we've reached the max number
      const oldestLog = `${this.config.logFilePath}.${this.config.maxLogFiles - 1}`;
      if (fs.existsSync(oldestLog)) {
        fs.unlinkSync(oldestLog);
      }

      // Shift all other log files
      for (let i = this.config.maxLogFiles - 2; i >= 0; i--) {
        const oldPath = i === 0 ? this.config.logFilePath : `${this.config.logFilePath}.${i}`;
        const newPath = `${this.config.logFilePath}.${i + 1}`;
        
        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
        }
      }

      // Create a new empty log file
      fs.writeFileSync(this.config.logFilePath, '');
    } catch (error) {
      console.error(`Failed to rotate log files: ${error}`);
    }
  }

  // Format a log entry for output
  private formatLogEntry(entry: LogEntry): string {
    let formatted = `[${entry.timestamp}] [${entry.level}] ${entry.message}`;
    
    if (entry.details) {
      formatted += `\nDetails: ${JSON.stringify(entry.details, null, 2)}`;
    }
    
    if (entry.stackTrace) {
      formatted += `\nStack Trace: ${entry.stackTrace}`;
    }
    
    return formatted;
  }

  // Write a log entry to the console
  private writeToConsole(entry: LogEntry): void {
    if (!this.config.consoleOutput) return;

    let colorFn;
    switch (entry.level) {
      case LogLevel.DEBUG:
        colorFn = chalk.blue;
        break;
      case LogLevel.INFO:
        colorFn = chalk.white;
        break;
      case LogLevel.WARN:
        colorFn = chalk.yellow;
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        colorFn = chalk.red;
        break;
      default:
        colorFn = chalk.white;
    }

    console.log(colorFn(this.formatLogEntry(entry)));
  }

  // Write a log entry to the log file
  private writeToFile(entry: LogEntry): void {
    if (!this.config.fileOutput) return;

    this.checkLogRotation();

    try {
      const formattedEntry = this.formatLogEntry(entry) + '\n';
      fs.appendFileSync(this.config.logFilePath, formattedEntry);
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  }

  // Create a log entry
  private createLogEntry(level: LogLevel, message: string, details?: Record<string, any>, error?: Error): LogEntry {
    const timestamp = new Date().toISOString();
    const stackTrace = error?.stack;
    
    return {
      timestamp,
      level,
      message,
      details,
      stackTrace,
    };
  }

  // Log a message if the log level permits
  private log(level: LogLevel, message: string, details?: Record<string, any>, error?: Error): void {
    const levelValue = Object.values(LogLevel).indexOf(level);
    const configLevelValue = Object.values(LogLevel).indexOf(this.config.logLevel);
    
    if (levelValue >= configLevelValue) {
      const entry = this.createLogEntry(level, message, details, error);
      this.writeToConsole(entry);
      this.writeToFile(entry);
    }
  }

  // Public logging methods
  public debug(message: string, details?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, details);
  }

  public info(message: string, details?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, details);
  }

  public warn(message: string, details?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.WARN, message, details, error);
  }

  public error(message: string, details?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, details, error);
  }

  public fatal(message: string, details?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.FATAL, message, details, error);
  }

  // Log an error object directly
  public logError(error: Error, message?: string, details?: Record<string, any>): void {
    const errorMessage = message || error.message;
    this.error(errorMessage, details, error);
  }

  // Get the log file path
  public getLogFilePath(): string {
    return this.config.logFilePath;
  }

  // Clear the log file
  public clearLogs(): void {
    if (this.config.fileOutput && fs.existsSync(this.config.logFilePath)) {
      try {
        fs.writeFileSync(this.config.logFilePath, '');
      } catch (error) {
        console.error(`Failed to clear log file: ${error}`);
      }
    }
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

// Utility function to handle and log errors consistently
export function handleError(error: unknown, context?: string, details?: Record<string, any>): Error {
  const errorObject = error instanceof Error ? error : new Error(String(error));
  const contextMessage = context ? `[${context}] ${errorObject.message}` : errorObject.message;
  
  logger.error(contextMessage, details, errorObject);
  
  return errorObject;
}