import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { defaultLoggerConfig, validateLoggerConfig, LoggerConfig as ExternalLoggerConfig } from '../config/loggerConfig';
import { LogFormatter, LogDetails as FormatterLogDetails } from './logFormatter';
import { LogRotationService } from './logRotationService';

/**
 * Log levels enumeration.
 * @enum {string}
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  FATAL = 'FATAL',
}

/**
 * Represents a log entry.
 * @interface LogEntry
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: FormatterLogDetails; // Use LogDetails from formatter
  stackTrace?: string;
}

// Use the imported LoggerConfig interface
type InternalLoggerConfig = ExternalLoggerConfig;

// Constants for flushing and queue size remain relevant for the logger's write buffer
const FLUSH_INTERVAL_MS = 5000; // Flush queue every 5 seconds
const MAX_QUEUE_SIZE = 100; // Flush queue if it reaches this size

/**
 * Logger class that provides logging functionality.
 * Implements console and file logging with log rotation and asynchronous writes.
 * Uses LogFormatter for formatting and LogRotationService for rotation.
 * @class
 */
class Logger {
  private config: InternalLoggerConfig;
  private static instance: Logger;
  private logQueue: LogEntry[] = [];
  private flushTimeout: NodeJS.Timeout | null = null;
  private isFlushing = false;

  private formatter: LogFormatter;
  private rotationService: LogRotationService;

  private constructor() {
    try {
      this.config = validateLoggerConfig(defaultLoggerConfig);
    } catch (error) {
      console.error(`Invalid logger configuration: ${error instanceof Error ? error.message : String(error)}. Using default values.`);
      this.config = { // Fallback config
        logLevel: 'INFO',
        consoleOutput: true,
        fileOutput: false,
        logFilePath: '',
        maxLogFileSize: 1 * 1024 * 1024,
        maxLogFiles: 1,
      };
    }

    this.formatter = new LogFormatter();
    this.rotationService = new LogRotationService(this.config);

    this.ensureLogDirectory();
    this.setupFlushInterval();

    // Graceful shutdown
    process.on('exit', this.handleExit.bind(this));
    process.on('SIGINT', this.handleSignal.bind(this));
    process.on('SIGTERM', this.handleSignal.bind(this));
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
  }

  /**
   * Returns the singleton instance of Logger.
   * @returns {Logger} Logger instance.
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Configure the logger with partial configuration.
   * @param partialConfig - Partial LoggerConfig object.
   */
  public configure(partialConfig: Partial<InternalLoggerConfig>): void {
    try {
      this.config = validateLoggerConfig({ ...this.config, ...partialConfig });
    } catch (error) {
       console.error(`Invalid partial logger configuration: ${error instanceof Error ? error.message : String(error)}. Configuration not applied.`);
       return;
    }
    // Update rotation service config if main config changes
    this.rotationService.updateConfig(this.config);
    this.ensureLogDirectory();
  }

  /**
   * Ensures that the log directory exists with appropriate permissions.
   * If directory creation fails, disables file output.
   * @private
   */
  private ensureLogDirectory(): void {
    if (this.config.fileOutput && this.config.logFilePath) {
      const logDir = path.dirname(this.config.logFilePath);
      try {
        if (!fs.existsSync(logDir)) {
          fs.mkdirSync(logDir, { recursive: true });
        }
      } catch (error) {
        console.error(`Failed to create log directory '${logDir}': ${error instanceof Error ? error.message : String(error)}. Disabling file output.`);
        this.config.fileOutput = false;
        // Also update rotation service if file output is disabled
        this.rotationService.updateConfig({ fileOutput: false }); 
      }
    } else {
      this.config.fileOutput = false; // Disable if no path
      this.rotationService.updateConfig({ fileOutput: false });
    }
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

    console.log(colorFn(this.formatter.format(entry)));
  }

  /**
   * Sets up an interval to flush the log queue.
   * @private
   */
  private setupFlushInterval(): void {
    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
    }
    this.flushTimeout = setInterval(() => this.flushQueue(), FLUSH_INTERVAL_MS);
  }

  /**
   * Adds a log entry to the queue and triggers a flush if needed.
   * @param entry - Log entry to write.
   * @private
   */
  private async writeToFile(entry: LogEntry): Promise<void> {
    if (!this.config.fileOutput || !this.config.logFilePath) return;

    this.logQueue.push(entry);

    // Flush immediately for critical errors or if queue is full
    if (entry.level === LogLevel.FATAL || entry.level === LogLevel.ERROR || this.logQueue.length >= MAX_QUEUE_SIZE) {
      if (this.flushTimeout) clearTimeout(this.flushTimeout); // Clear scheduled flush
      await this.flushQueue();
      this.setupFlushInterval(); // Restart interval
    }
  }

  /**
   * Flushes the log queue to the file.
   * @private
   */
  private async flushQueue(): Promise<void> {
    if (!this.config.fileOutput || !this.config.logFilePath || this.isFlushing || this.logQueue.length === 0) {
      return;
    }

    this.isFlushing = true;
    // Use rotation service. checkAndRotate will handle its own error logging.
    await this.rotationService.checkAndRotate(); 

    // If rotation service disabled fileOutput due to critical errors, re-check.
    if (!this.config.fileOutput) {
        this.isFlushing = false;
        // Consider logging a message that file output was disabled during rotation attempt
        if (this.logQueue.length > 0) {
            console.warn(`[Logger] File output disabled during log rotation attempt. ${this.logQueue.length} log entries in queue will not be written to file.`);
            this.logQueue = []; // Clear queue as entries won't be written
        }
        return;
    }

    const entriesToFlush = [...this.logQueue];
    this.logQueue = []; // Clear queue before async operation

    const formattedEntries = entriesToFlush.map(e => this.formatter.format(e) + '\n').join('');

    try {
      fs.appendFileSync(this.config.logFilePath, formattedEntries);
    } catch (error) {
      console.error(`Failed to write to log file '${this.config.logFilePath}': ${error instanceof Error ? error.message : String(error)}. Entries lost: ${entriesToFlush.length}`);
      // Optionally, re-queue or handle lost entries, e.g., try to log to console if not already
      // For simplicity, we're currently just logging the error.
    } finally {
      this.isFlushing = false;
      // If more items were added while flushing, flush again
      if (this.logQueue.length > 0) {
        // A small delay to prevent tight loop in case of continuous errors
        setTimeout(() => this.flushQueue(), 100);
      }
    }
  }

  /**
   * Handles application exit signals.
   * @private
   */
  private async handleExit(): Promise<void> {
    if (this.flushTimeout) {
      clearInterval(this.flushTimeout);
      this.flushTimeout = null;
    }
    await this.flushQueue(); // Ensure all logs are written before exit
  }

  private async handleSignal(): Promise<void> {
    await this.handleExit();
    process.exit(0);
  }

  private async handleUncaughtException(error: Error): Promise<void> {
    // Log the uncaught exception using the logger itself (if possible)
    // This will attempt to write to console and file (if configured)
    const entry = this.createLogEntry(LogLevel.FATAL, `Uncaught Exception: ${error.message}`, undefined, error);
    this.writeToConsole(entry); // Ensure it gets to console
    if (this.config.fileOutput && this.config.logFilePath) {
       // Try to synchronously write the last fatal error to the file
      try {
        const formattedEntry = this.formatter.format(entry) + '\n';
        fs.appendFileSync(this.config.logFilePath, formattedEntry);
      } catch (e) {
        console.error("Failed to write fatal exception to log file:", e);
      }
    }
    await this.handleExit(); // Attempt to flush any remaining logs
    process.exit(1); // Exit with an error code
  }

  /**
   * Creates a log entry object.
   * @param level - Log level.
   * @param message - Log message.
   * @param details - Additional details (conforming to FormatterLogDetails).
   * @param error - Optional error object.
   * @returns The created log entry.
   * @private
   */
  private createLogEntry(level: LogLevel, message: string, details?: FormatterLogDetails, error?: Error): LogEntry {
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

  /**
   * Logs a message if the log level permits.
   * @param level - Log level.
   * @param message - Log message.
   * @param details - Additional log details (conforming to FormatterLogDetails).
   * @param error - Optional error object.
   * @private
   */
  private log(level: LogLevel, message: string, details?: FormatterLogDetails, error?: Error): void {
    const levelValue = Object.values(LogLevel).indexOf(level);
    const configLevelValue = Object.values(LogLevel).indexOf(this.config.logLevel);
    
    if (levelValue >= configLevelValue) {
      const entry = this.createLogEntry(level, message, details, error);
      this.writeToConsole(entry); // Console output is synchronous
      this.writeToFile(entry);   // File output is asynchronous and queued
    }
  }

  /**
   * Logs a debug message.
   * @param message - Debug message.
   * @param details - Optional additional details (conforming to FormatterLogDetails).
   */
  public debug(message: string, details?: FormatterLogDetails): void {
    this.log(LogLevel.DEBUG, message, details);
  }

  /**
   * Logs an informational message.
   * @param message - Information message.
   * @param details - Optional additional details (conforming to FormatterLogDetails).
   */
  public info(message: string, details?: FormatterLogDetails): void {
    this.log(LogLevel.INFO, message, details);
  }

  /**
   * Logs a warning message.
   * @param message - Warning message.
   * @param details - Optional additional details (conforming to FormatterLogDetails).
   * @param error - Optional error object.
   */
  public warn(message: string, details?: FormatterLogDetails, error?: Error): void {
    this.log(LogLevel.WARN, message, details, error);
  }

  /**
   * Logs an error message.
   * @param message - Error message.
   * @param details - Optional additional details (conforming to FormatterLogDetails).
   * @param error - Optional error object.
   */
  public error(message: string, details?: FormatterLogDetails, error?: Error): void {
    this.log(LogLevel.ERROR, message, details, error);
  }

  /**
   * Logs a fatal error message.
   * @param message - Fatal error message.
   * @param details - Optional additional details (conforming to FormatterLogDetails).
   * @param error - Optional error object.
   */
  public fatal(message: string, details?: FormatterLogDetails, error?: Error): void {
    this.log(LogLevel.FATAL, message, details, error);
  }

  /**
   * Logs an error object directly.
   * @param errorObject - The error object.
   * @param message - Optional message override.
   * @param details - Optional additional details (conforming to FormatterLogDetails).
   */
  public logError(errorObject: Error, message?: string, details?: FormatterLogDetails): void {
    const errorMessage = message || errorObject.message;
    this.error(errorMessage, details, errorObject);
  }

  /**
   * Returns the current log file path.
   * @returns {string} The log file path, or an empty string if file output is disabled.
   */
  public getLogFilePath(): string {
    return this.config.fileOutput ? this.config.logFilePath : '';
  }

  /**
   * Clears the current log file.
   */
  public async clearLogs(): Promise<void> {
    if (this.config.fileOutput && this.config.logFilePath) {
      try {
        // Ensure queue is flushed before clearing
        await this.flushQueue();
        fs.writeFileSync(this.config.logFilePath, '');
        logger.info('Log file cleared.');
      } catch (error) {
        console.error(`Failed to clear log file '${this.config.logFilePath}': ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  /**
   * Gracefully shuts down the logger, flushing any pending logs.
   * Call this before application termination if possible.
   */
  public async shutdown(): Promise<void> {
    await this.handleExit();
    // Remove process listeners to prevent multiple calls if shutdown is explicit
    process.removeListener('exit', this.handleExit);
    process.removeListener('SIGINT', this.handleSignal);
    process.removeListener('SIGTERM', this.handleSignal);
    process.removeListener('uncaughtException', this.handleUncaughtException);
    if (this.flushTimeout) {
        clearInterval(this.flushTimeout);
        this.flushTimeout = null;
    }
  }
}

// Export a singleton instance
export const logger = Logger.getInstance();

/**
 * Utility function to handle and log errors consistently.
 * @param error - The error to handle (can be unknown type).
 * @param context - Optional context string for the error message.
 * @param details - Optional additional details for the log (conforming to FormatterLogDetails).
 * @returns The original error object (or a new Error if input was not an Error).
 */
export function handleError(error: unknown, context?: string, details?: FormatterLogDetails): Error {
  const errorObject = error instanceof Error ? error : new Error(String(error));
  const contextMessage = context ? `[${context}] ${errorObject.message}` : errorObject.message;
  
  logger.error(contextMessage, details, errorObject); // logger.error handles stack trace
  
  return errorObject;
}
