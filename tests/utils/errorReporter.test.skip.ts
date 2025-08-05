import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  errorReporter,
  ErrorSeverity,
  ErrorCategory,
  setupGlobalErrorHandlers
} from '../../src/utils/errorReporter';
import { logger } from '../../src/utils/logger';

// Mock logger
vi.mock('../../src/utils/logger', () => {
  return {
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
      log: vi.fn(),
    },
    LogLevel: {
      DEBUG: 'DEBUG',
      INFO: 'INFO',
      WARN: 'WARN',
      ERROR: 'ERROR',
      FATAL: 'FATAL',
    },
  };
});

describe('ErrorReporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    errorReporter.clearErrors();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should report errors', () => {
    const message = 'Test error';
    const error = new Error('Error details');
    
    const report = errorReporter.reportError(message, {
      error,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.COMMAND,
      context: 'TestContext',
    });
    
    // Verify the report structure
    expect(report).toMatchObject({
      message,
      error,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.COMMAND,
      context: 'TestContext',
      handled: false,
    });
    
    // Verify that ID and timestamp are generated
    expect(report.id).toBeDefined();
    expect(report.timestamp).toBeInstanceOf(Date);
    
    // Verify that logger was called
    expect(logger.log).toHaveBeenCalled();
    
    // Verify that the error was stored
    const storedErrors = errorReporter.getAllErrors();
    expect(storedErrors).toHaveLength(1);
    expect(storedErrors[0].id).toBe(report.id);
  });
  
  it('should report errors with error object as second parameter', () => {
    const message = 'Test error';
    const error = new Error('Error details');
    
    const report = errorReporter.reportError(message, error);
    
    // Verify the report structure
    expect(report).toMatchObject({
      message,
      error,
      severity: ErrorSeverity.MEDIUM, // Default
      category: ErrorCategory.UNKNOWN, // Default
      handled: false,
    });
    
    // Verify that logger was called
    expect(logger.log).toHaveBeenCalled();
  });

  it('should mark errors as handled', () => {
    const report = errorReporter.reportError('Test error');
    
    // Verify that error is initially not handled
    expect(report.handled).toBe(false);
    
    // Mark as handled
    errorReporter.markAsHandled(report.id);
    
    // Verify that error is now handled
    const storedError = errorReporter.getError(report.id);
    expect(storedError?.handled).toBe(true);
  });

  it('should clear all errors', () => {
    // Add some errors
    errorReporter.reportError('Error 1');
    errorReporter.reportError('Error 2');
    errorReporter.reportError('Error 3');
    
    // Verify errors were added
    expect(errorReporter.getAllErrors()).toHaveLength(3);
    
    // Clear errors
    errorReporter.clearErrors();
    
    // Verify errors were cleared
    expect(errorReporter.getAllErrors()).toHaveLength(0);
  });

  it('should get a specific error by ID', () => {
    const error1 = errorReporter.reportError('Error 1');
    const error2 = errorReporter.reportError('Error 2');
    
    // Get error by ID
    const retrievedError = errorReporter.getError(error1.id);
    
    // Verify the retrieved error
    expect(retrievedError).toBeDefined();
    expect(retrievedError?.id).toBe(error1.id);
    expect(retrievedError?.message).toBe('Error 1');
  });

  it('should handle subscriber notifications', () => {
    // Create a subscriber
    const subscriber = vi.fn();
    
    // Subscribe to errors
    const unsubscribe = errorReporter.subscribe(subscriber);
    
    // Report an error
    const report = errorReporter.reportError('Test error');
    
    // Verify subscriber was called
    expect(subscriber).toHaveBeenCalledWith(report);
    
    // Unsubscribe
    unsubscribe();
    
    // Report another error
    errorReporter.reportError('Another error');
    
    // Verify subscriber was not called again
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('should handle errors in subscribers', () => {
    // Create a subscriber that throws an error
    const subscriber = vi.fn().mockImplementation(() => {
      throw new Error('Subscriber error');
    });
    
    // Subscribe to errors
    errorReporter.subscribe(subscriber);
    
    // Report an error
    errorReporter.reportError('Test error');
    
    // Verify subscriber was called
    expect(subscriber).toHaveBeenCalled();
    
    // Verify error was logged
    expect(logger.error).toHaveBeenCalled();
  });

  it('should submit user feedback', () => {
    const report = errorReporter.reportError('Test error');
    
    // Submit feedback
    const feedback = {
      errorId: report.id,
      timestamp: new Date(),
      description: 'User feedback description',
      reproduce: 'Steps to reproduce',
      contact: 'user@example.com',
    };
    
    errorReporter.submitFeedback(feedback);
    
    // Verify that logger was called
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining('User feedback received'),
      expect.objectContaining({ feedback })
    );
  });

  describe('Helper methods for common error categories', () => {
    it('should report command errors', () => {
      const error = new Error('Command failed');
      const report = errorReporter.reportCommandError('Command error', error);
      
      expect(report.category).toBe(ErrorCategory.COMMAND);
      expect(report.severity).toBe(ErrorSeverity.MEDIUM);
      expect(report.userAction).toBeDefined();
    });
    
    it('should report network errors', () => {
      const error = new Error('Network failed');
      const report = errorReporter.reportNetworkError('Network error', error);
      
      expect(report.category).toBe(ErrorCategory.NETWORK);
      expect(report.severity).toBe(ErrorSeverity.MEDIUM);
      expect(report.userAction).toBeDefined();
    });
    
    it('should report auth errors', () => {
      const error = new Error('Auth failed');
      const report = errorReporter.reportAuthError('Auth error', error);
      
      expect(report.category).toBe(ErrorCategory.AUTH);
      expect(report.severity).toBe(ErrorSeverity.HIGH);
      expect(report.userAction).toBeDefined();
    });
    
    it('should report validation errors', () => {
      const error = new Error('Validation failed');
      const report = errorReporter.reportValidationError('Validation error', error);
      
      expect(report.category).toBe(ErrorCategory.VALIDATION);
      expect(report.severity).toBe(ErrorSeverity.LOW);
      expect(report.userAction).toBeDefined();
    });
  });
});

describe('setupGlobalErrorHandlers', () => {
  const originalProcessOn = process.on;
  const originalProcessExit = process.exit;
  
  beforeEach(() => {
    // Mock process.on and process.exit
    process.on = vi.fn() as any;
    process.exit = vi.fn() as any;
    
    // Reset error reporter
    errorReporter.clearErrors();
    
    // Clear all mocks
    vi.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original process methods
    process.on = originalProcessOn;
    process.exit = originalProcessExit;
  });
  
  it('should set up handlers for uncaught exceptions', () => {
    setupGlobalErrorHandlers();
    
    // Verify process.on was called for uncaught exceptions
    expect(process.on).toHaveBeenCalledWith(
      'uncaughtException',
      expect.any(Function)
    );
    
    // Simulate an uncaught exception
    const handler = (process.on as any).mock.calls.find(
      call => call[0] === 'uncaughtException'
    )[1];
    
    const error = new Error('Uncaught error');
    handler(error);
    
    // Verify that error was reported
    const errors = errorReporter.getAllErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].severity).toBe(ErrorSeverity.CRITICAL);
    
    // Verify process.exit was called
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  it('should set up handlers for unhandled promise rejections', () => {
    setupGlobalErrorHandlers();
    
    // Verify process.on was called for unhandled rejections
    expect(process.on).toHaveBeenCalledWith(
      'unhandledRejection',
      expect.any(Function)
    );
    
    // Simulate an unhandled rejection
    const handler = (process.on as any).mock.calls.find(
      call => call[0] === 'unhandledRejection'
    )[1];
    
    const error = new Error('Unhandled rejection');
    handler(error, Promise.resolve()); // Second param is the promise
    
    // Verify that error was reported
    const errors = errorReporter.getAllErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].severity).toBe(ErrorSeverity.HIGH);
    
    // Verify process.exit was NOT called (we don't exit for unhandled rejections)
    expect(process.exit).not.toHaveBeenCalled();
  });
  
  it('should handle non-Error rejections', () => {
    setupGlobalErrorHandlers();
    
    // Get the unhandled rejection handler
    const handler = (process.on as any).mock.calls.find(
      call => call[0] === 'unhandledRejection'
    )[1];
    
    // Simulate a non-Error rejection (string)
    handler('String rejection reason', Promise.resolve());
    
    // Verify that error was reported and converted to Error
    const errors = errorReporter.getAllErrors();
    expect(errors).toHaveLength(1);
    expect(errors[0].error).toBeInstanceOf(Error);
    expect(errors[0].error?.message).toBe('String rejection reason');
  });
});