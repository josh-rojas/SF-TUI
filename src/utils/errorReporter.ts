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
export interface ErrorReport {
  id: string;
  timestamp: Date;
  message: string;
  error?: Error;
  severity: ErrorSeverity;
  category: ErrorCategory;
  context?: string;
  details?: Record<string, any>;
  userAction?: string;
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

class ErrorReporter {
  private static instance: ErrorReporter;
  private errors: Map<string, ErrorReport> = new Map();
  private subscribers: ErrorReporterSubscriber[] = [];
  private generateErrorId = (): string => `error-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  private constructor() {}

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
      error?: Error,
      severity?: ErrorSeverity,
      category?: ErrorCategory,
      context?: string,
      details?: Record<string, any>,
      userAction?: string,
    }
  ): ErrorReport {
    // Handle the case where the second parameter is an Error object
    let error: Error | undefined;
    let severity = ErrorSeverity.MEDIUM;
    let category = ErrorCategory.UNKNOWN;
    let context: string | undefined;
    let details: Record<string, any> | undefined;
    let userAction: string | undefined;
    
    if (errorOrOptions instanceof Error) {
      error = errorOrOptions;
    } else if (errorOrOptions) {
      error = errorOrOptions.error;
      severity = errorOrOptions.severity || severity;
      category = errorOrOptions.category || category;
      context = errorOrOptions.context;
      details = errorOrOptions.details;
      userAction = errorOrOptions.userAction;
    }
    
    // Create the error report
    const report: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      message,
      error,
      severity,
      category,
      context,
      details,
      userAction,
      handled: false,
    };
    
    // Store the error
    this.errors.set(report.id, report);
    
    // Log the error
    const logLevel = this.severityToLogLevel(severity);
    const logMessage = context ? `[${context}] ${message}` : message;
    const logDetails = {
      ...details,
      errorId: report.id,
      category,
      severity,
    };
    
    logger.log(logLevel, logMessage, logDetails, error);
    
    // Notify subscribers
    this.notifySubscribers(report);
    
    return report;
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
  }

  // Submit user feedback for an error
  public submitFeedback(feedback: UserFeedback): void {
    // In a real implementation, this would send the feedback to a server
    // For now, we'll just log it
    logger.info(`User feedback received for error ${feedback.errorId}`, { feedback });
  }

  // Helper methods for common error categories
  public reportCommandError(message: string, error?: Error, details?: Record<string, any>): ErrorReport {
    return this.reportError(message, {
      error,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.COMMAND,
      details,
      userAction: 'Try running the command again or check the command arguments.',
    });
  }

  public reportNetworkError(message: string, error?: Error, details?: Record<string, any>): ErrorReport {
    return this.reportError(message, {
      error,
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.NETWORK,
      details,
      userAction: 'Check your internet connection and try again.',
    });
  }

  public reportAuthError(message: string, error?: Error, details?: Record<string, any>): ErrorReport {
    return this.reportError(message, {
      error,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.AUTH,
      details,
      userAction: 'Try logging in again using sf org login web.',
    });
  }

  public reportValidationError(message: string, error?: Error, details?: Record<string, any>): ErrorReport {
    return this.reportError(message, {
      error,
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.VALIDATION,
      details,
      userAction: 'Check your input values and try again.',
    });
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
    logger.fatal('Uncaught exception', { error });
    process.exit(1);
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
    logger.error('Unhandled promise rejection', { error });
  });
}