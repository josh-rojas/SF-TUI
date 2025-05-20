import { logger, LogLevel } from './logger';

// Define error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

// Define error categories
export enum ErrorCategory {
  UI = 'UI',
  NETWORK = 'NETWORK',
  FILESYSTEM = 'FILESYSTEM',
  COMMAND = 'COMMAND',
  AUTH = 'AUTH',
  PLUGIN = 'PLUGIN',
  VALIDATION = 'VALIDATION',
  UNKNOWN = 'UNKNOWN',
}

// Define error report interface

/**
 * Defines the structure for detailed information accompanying an error report.
 * Can include any relevant key-value pairs.
 */
export type ErrorDetails = Record<string, any>;

export interface ErrorReport {
  id: string;
  timestamp: Date;
  message: string;
  error: Error | null;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context: string | null;
  details: ErrorDetails | null;
  userAction: string | null;
  handled: boolean;
}

// Define user feedback interface
export interface UserFeedback {
  errorId: string;
  timestamp: Date;
  description: string;
  reproduce?: string;
  contact?: string;
}

// Define subscribers for error notifications
type ErrorReporterSubscriber = (error: ErrorReport) => void;

const MAX_ERROR_REPORTS = 100; // Maximum number of error reports to store
const ERROR_REPORT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // 1 hour in milliseconds

class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: Map<string, ErrorReport> = new Map(); // Stores errors by ID
  private errorOrder: string[] = []; // Stores error IDs in the order they were reported (for FIFO eviction)
  private subscribers: ErrorReporterSubscriber[] = [];
  private cleanupInterval: NodeJS.Timeout | null = null;
  private generateErrorId = (): string => `error-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  private constructor() {
    this.cleanupInterval = setInterval(() => this.cleanupOldErrors(), CLEANUP_INTERVAL_MS);
  }

  public static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  // Subscribe to error notifications
  public subscribe(callback: ErrorReporterSubscriber): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  // Notify all subscribers of an error
  private notifySubscribers(error: ErrorReport): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber(error);
      } catch (err) {
        logger.error('Error in error subscriber', { subscriberError: err });
      }
    }
  }

  // Map severity to log level
  private severityToLogLevel(severity: ErrorSeverity): LogLevel {
    switch (severity) {
      case ErrorSeverity.LOW:
        return LogLevel.INFO;
      case ErrorSeverity.MEDIUM:
        return LogLevel.WARN;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return LogLevel.ERROR;
      default:
        return LogLevel.ERROR;
    }
  }

  // Report a new error
  public reportError(
    message: string,
    errorOrOptions?: Error | {
      error?: Error | null;
      severity?: ErrorSeverity;
      category?: ErrorCategory;
      context?: string | null;
      details?: ErrorDetails | null;
      userAction?: string | null;
    } | null | undefined
  ): ErrorReport {
    // Clean up old errors before adding a new one to manage memory
    this.cleanupOldErrors();

    // Process the error or options
    let errorObj: Error | null = null;
    let errorSeverity = ErrorSeverity.MEDIUM;
    let errorCategory = ErrorCategory.UNKNOWN;
    let errorContext: string | null = null;
    let errorDetails: ErrorDetails | null = null;
    let errorUserAction: string | null = null;

    if (errorOrOptions) {
      if (errorOrOptions instanceof Error) {
        errorObj = errorOrOptions;
      } else {
        const options = errorOrOptions;
        
        if ('error' in options) {
          errorObj = options.error || null;
        }
        if ('severity' in options && options.severity !== undefined) {
          errorSeverity = options.severity;
        }
        if ('category' in options && options.category !== undefined) {
          errorCategory = options.category;
        }
        if ('context' in options) {
          errorContext = options.context || null;
        }
        if ('details' in options) {
          errorDetails = options.details || null;
        }
        if ('userAction' in options) {
          errorUserAction = options.userAction || null;
        }
      }
    }

    const report: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message,
      error: errorObj,
      severity: errorSeverity,
      category: errorCategory,
      context: errorContext,
      details: errorDetails,
      userAction: errorUserAction,
      handled: false,
    };

    // Store the error
    this.errors.set(report.id, report);
    this.errorOrder.push(report.id);

    // Log the error using the appropriate log level
    const currentLogLevel = this.severityToLogLevel(report.severity);
    const errorMessage = report.error?.message ?? '';
    const currentLogMessage = errorMessage ? `${message}: ${errorMessage}` : message;
    
    const currentLogDetails: Record<string, unknown> = {};
    
    if (errorMessage) {
      currentLogDetails.error = errorMessage;
    }
    if (report.error?.stack) {
      currentLogDetails.stack = report.error.stack;
    }
    if (report.details) {
      Object.assign(currentLogDetails, report.details);
    }
    
    const errorToLog = report.error ?? undefined;
    
    switch (currentLogLevel) {
      case LogLevel.ERROR:
        logger.error(currentLogMessage, currentLogDetails, errorToLog);
        break;
      case LogLevel.WARN:
        logger.warn(currentLogMessage, currentLogDetails, errorToLog);
        break;
      case LogLevel.FATAL:
        logger.fatal(currentLogMessage, currentLogDetails, errorToLog);
        break;
      default:
        logger.info(currentLogMessage, currentLogDetails);
        break;
    }
    
    // Notify subscribers
    this.notifySubscribers(report);
    
    return report;
  }

  /**
   * Cleans up errors that are older than the defined TTL.
   * @private
   */
  private cleanupOldErrors(): void {
    const now = Date.now();
    const newErrorOrder: string[] = [];
    for (const errorId of this.errorOrder) {
      const errorReport = this.errors.get(errorId);
      if (errorReport && (now - errorReport.timestamp.getTime()) < ERROR_REPORT_TTL_MS) {
        newErrorOrder.push(errorId); // Keep if not expired
      } else {
        this.errors.delete(errorId); // Delete expired from map
      }
    }
    this.errorOrder = newErrorOrder;
  }

  // Mark an error as handled
  public markAsHandled(errorId: string): void {
    const error = this.errors.get(errorId);
    if (error) {
      error.handled = true;
      this.errors.set(errorId, error);
    }
  }

  // Get all errors
  public getAllErrors(): ErrorReport[] {
    return Array.from(this.errors.values());
  }

  // Get a specific error by ID
  public getError(errorId: string): ErrorReport | undefined {
    return this.errors.get(errorId);
  }

  // Clear all errors
  public clearErrors(): void {
    this.errors.clear();
    this.errorOrder = [];
    logger.info('All error reports cleared.');
  }

  // Submit user feedback for an error
  public submitFeedback(feedback: UserFeedback): void {
    // In a real implementation, this would send the feedback to a server
    // For now, we'll just log it
    logger.info(`User feedback received for error ${feedback.errorId}`, { feedback });
  }

  // Helper methods for common error categories
  public reportCommandError(message: string, error?: Error | null, details: ErrorDetails | null = null): ErrorReport {
    return this.reportError(message, {
      error: error || null,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.COMMAND,
      details: details || null,
      userAction: 'Please check the command and try again.',
    });
  }

  public reportNetworkError(message: string, error?: Error | null, details: ErrorDetails | null = null): ErrorReport {
    return this.reportError(message, {
      error: error || null,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.NETWORK,
      details: details || null,
      userAction: 'Please check your network connection and try again.',
    });
  }

  public reportAuthError(message: string, error?: Error | null, details: ErrorDetails | null = null): ErrorReport {
    return this.reportError(message, {
      error: error || null,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTH,
      details: details || null,
      userAction: 'Please check your credentials and try again.',
    });
  }

  public reportValidationError(message: string, error?: Error | null, details: ErrorDetails | null = null): ErrorReport {
    return this.reportError(message, {
      error: error || null,
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.VALIDATION,
      details: details || null,
      userAction: 'Please check your input and try again.',
    });
  }

  /**
   * Gracefully shuts down the error reporter, clearing any intervals.
   */
  public shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    // Perform any other cleanup if necessary
    logger.info('ErrorReporter shutdown complete.');
  }
}

// Export a singleton instance
export const errorReporter = ErrorReporter.getInstance();

// Global error handler for uncaught exceptions
export function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    errorReporter.reportError('Uncaught exception', {
      error,
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.UNKNOWN,
      userAction: 'Please report this issue to the developers.',
    });
    
    // Log the error and exit gracefully
    logger.fatal('Uncaught exception', { originalError: error.message, stack: error.stack });
    // Ensure logger flushes before exiting
    if (typeof logger.shutdown === 'function') {
      logger.shutdown().then(() => {
        errorReporter.shutdown();
        process.exit(1);
      }).catch(() => {
        errorReporter.shutdown();
        process.exit(1);
      });
    } else {
      errorReporter.shutdown();
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));
    
    errorReporter.reportError('Unhandled promise rejection', {
      error,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.UNKNOWN,
      userAction: 'Please report this issue to the developers.',
    });
    
    // Log the error but don't exit
    logger.error('Unhandled promise rejection', { originalError: error.message, stack: error.stack, promiseDetails: promise });
  });
}
