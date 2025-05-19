import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { logger, LogLevel } from '../../src/utils/logger';

// Mock fs module
vi.mock('fs', async () => {
  return {
    default: {
      existsSync: vi.fn(),
      statSync: vi.fn(),
      mkdirSync: vi.fn(),
      appendFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      unlinkSync: vi.fn(),
      renameSync: vi.fn(),
    },
    existsSync: vi.fn(),
    statSync: vi.fn(),
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    renameSync: vi.fn(),
  };
});

// Mock console
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'info').mockImplementation(() => {});

describe('Logger', () => {
  const tempLogPath = path.join(os.tmpdir(), 'sf-tui-test.log');
  
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Configure logger to use test file
    logger.configure({
      logLevel: LogLevel.DEBUG,
      logFilePath: tempLogPath,
      consoleOutput: true,
      fileOutput: true,
    });
    
    // Mock fs.existsSync to return true for log directory
    (fs.existsSync as any).mockImplementation((path: string) => {
      if (path === tempLogPath) return false;
      return true;
    });
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should create log directory if it does not exist', () => {
    // Mock fs.existsSync to return false for log directory
    (fs.existsSync as any).mockReturnValueOnce(false);
    
    // Configure logger
    logger.configure({
      logFilePath: tempLogPath,
    });
    
    // Verify mkdirSync was called
    expect(fs.mkdirSync).toHaveBeenCalled();
  });
  
  it('should log debug messages', () => {
    const message = 'Debug message';
    logger.debug(message);
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // Verify appendFileSync was called
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      tempLogPath,
      expect.stringContaining(message),
    );
  });
  
  it('should log info messages', () => {
    const message = 'Info message';
    logger.info(message);
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // Verify appendFileSync was called
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      tempLogPath,
      expect.stringContaining(message),
    );
  });
  
  it('should log warning messages', () => {
    const message = 'Warning message';
    logger.warn(message);
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // Verify appendFileSync was called
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      tempLogPath,
      expect.stringContaining(message),
    );
  });
  
  it('should log error messages', () => {
    const message = 'Error message';
    logger.error(message);
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // Verify appendFileSync was called
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      tempLogPath,
      expect.stringContaining(message),
    );
  });
  
  it('should log fatal messages', () => {
    const message = 'Fatal message';
    logger.fatal(message);
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // Verify appendFileSync was called
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      tempLogPath,
      expect.stringContaining(message),
    );
  });
  
  it('should include error stack trace in logs', () => {
    const message = 'Error with stack trace';
    const error = new Error('Test error');
    logger.error(message, {}, error);
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // Verify appendFileSync was called with error stack
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      tempLogPath,
      expect.stringContaining('Stack Trace'),
    );
  });
  
  it('should include details in logs', () => {
    const message = 'Message with details';
    const details = { key: 'value', count: 42 };
    logger.info(message, details);
    
    // Verify console.log was called
    expect(console.log).toHaveBeenCalled();
    
    // Verify appendFileSync was called with details
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      tempLogPath,
      expect.stringContaining('Details'),
    );
  });
  
  it('should not log messages below configured level', () => {
    // Configure logger to only log ERROR and higher
    logger.configure({
      logLevel: LogLevel.ERROR,
    });
    
    logger.debug('Debug message');
    logger.info('Info message');
    logger.warn('Warning message');
    
    // Verify console.log was not called for these levels
    expect(console.log).not.toHaveBeenCalled();
    expect(fs.appendFileSync).not.toHaveBeenCalled();
    
    // Verify that ERROR level is still logged
    logger.error('Error message');
    expect(console.log).toHaveBeenCalled();
    expect(fs.appendFileSync).toHaveBeenCalled();
  });
  
  it('should check log rotation when writing to file', () => {
    // Mock fs.existsSync and fs.statSync for log rotation
    (fs.existsSync as any).mockReturnValueOnce(true);
    (fs.statSync as any).mockReturnValueOnce({ size: 10 * 1024 * 1024 }); // 10MB
    
    logger.configure({
      maxLogFileSize: 5 * 1024 * 1024, // 5MB
    });
    
    logger.info('Log message');
    
    // Verify that log rotation was attempted
    expect(fs.existsSync).toHaveBeenCalledWith(tempLogPath);
    expect(fs.statSync).toHaveBeenCalledWith(tempLogPath);
  });
  
  it('should rotate logs when file size exceeds max size', () => {
    // Mock fs.existsSync and fs.statSync for log rotation
    (fs.existsSync as any).mockReturnValueOnce(true);
    (fs.statSync as any).mockReturnValueOnce({ size: 10 * 1024 * 1024 }); // 10MB
    
    logger.configure({
      maxLogFileSize: 5 * 1024 * 1024, // 5MB
      maxLogFiles: 3,
    });
    
    logger.info('Log message');
    
    // Verify that log rotation was performed
    expect(fs.renameSync).toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalledWith(tempLogPath, '');
  });
  
  it('should clear logs when requested', () => {
    // Mock fs.existsSync for clearLogs
    (fs.existsSync as any).mockReturnValueOnce(true);
    
    logger.clearLogs();
    
    // Verify that writeFileSync was called to clear the log file
    expect(fs.writeFileSync).toHaveBeenCalledWith(tempLogPath, '');
  });
  
  it('should handle errors when creating log directory', () => {
    // Mock fs.existsSync to return false for log directory
    (fs.existsSync as any).mockReturnValueOnce(false);
    
    // Mock fs.mkdirSync to throw an error
    (fs.mkdirSync as any).mockImplementationOnce(() => {
      throw new Error('Cannot create directory');
    });
    
    // Configure logger
    logger.configure({
      logFilePath: tempLogPath,
    });
    
    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();
    
    // Log a message, should not try to write to file
    logger.info('Test message');
    
    // Verify appendFileSync was not called
    expect(fs.appendFileSync).not.toHaveBeenCalled();
  });
  
  it('should handle errors when writing to log file', () => {
    // Mock fs.appendFileSync to throw an error
    (fs.appendFileSync as any).mockImplementationOnce(() => {
      throw new Error('Cannot write to file');
    });
    
    // Log a message
    logger.info('Test message');
    
    // Verify console.error was called
    expect(console.error).toHaveBeenCalled();
  });
});

describe('handleError utility function', () => {
  it('should log errors and return an Error object', () => {
    const { handleError } = require('../../src/utils/logger');
    const error = new Error('Test error');
    const context = 'TestContext';
    const details = { key: 'value' };
    
    // Spy on logger.error
    const errorSpy = vi.spyOn(logger, 'error');
    
    // Call handleError
    const result = handleError(error, context, details);
    
    // Verify logger.error was called with correct arguments
    expect(errorSpy).toHaveBeenCalledWith(
      '[TestContext] Test error',
      details,
      error
    );
    
    // Verify that an Error object was returned
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe('Test error');
  });
  
  it('should convert non-Error objects to Error objects', () => {
    const { handleError } = require('../../src/utils/logger');
    const errorMessage = 'This is a string error';
    
    // Spy on logger.error
    const errorSpy = vi.spyOn(logger, 'error');
    
    // Call handleError with a string
    const result = handleError(errorMessage);
    
    // Verify logger.error was called
    expect(errorSpy).toHaveBeenCalled();
    
    // Verify that an Error object was returned
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe(errorMessage);
  });
});