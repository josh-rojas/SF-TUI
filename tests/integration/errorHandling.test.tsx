import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInkMock } from '../testUtils';
import { ErrorSeverity, ErrorCategory, errorReporter } from '../../src/utils/errorReporter';
import { logger } from '../../src/utils/logger';
import { executeCommand } from '../../src/utils/helpers';
import ErrorProvider from '../../src/components/common/ErrorProvider';
import ErrorBoundary from '../../src/components/common/ErrorBoundary';

// Setup mocks
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
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
  handleError: vi.fn((error) => error instanceof Error ? error : new Error(String(error))),
}));

vi.mock('execa', () => {
  const mockExeca = vi.fn();
  
  mockExeca.mockImplementation((command, args) => {
    // Mock a streaming process
    const mockProcess = {
      stdout: {
        on: vi.fn((event, callback) => {
          if (event === 'data') {
            // Simulate stdout data
            callback(Buffer.from('Command output'));
          }
        }),
      },
      stderr: {
        on: vi.fn((event, callback) => {
          if (event === 'data' && command === 'error-command') {
            // Simulate stderr data for error command
            callback(Buffer.from('Command error'));
          }
        }),
      },
    };
    
    // Handle failing commands
    if (command === 'error-command') {
      return {
        ...mockProcess,
        catch: (callback) => {
          callback(new Error('Command failed'));
          return mockProcess;
        },
        then: () => mockProcess,
      };
    }
    
    // Handle successful commands
    return {
      ...mockProcess,
      catch: () => mockProcess,
      then: (callback) => {
        callback({ stdout: 'Command output', stderr: '' });
        return mockProcess;
      },
    };
  });
  
  return {
    execa: mockExeca,
  };
});

// Create an Ink mock
createInkMock();

// Component that triggers an error
const ErrorTrigger = ({ triggerError = false }) => {
  if (triggerError) {
    throw new Error('Test component error');
  }
  return <div data-testid="error-trigger">Component Content</div>;
};

// Component that uses executeCommand
const CommandExecutor = ({ command = 'good-command', args = [] }) => {
  const [result, setResult] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  
  const runCommand = async () => {
    setIsLoading(true);
    try {
      const output = await executeCommand(command, args);
      setResult(output);
    } catch (error) {
      errorReporter.reportError('Command execution failed', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <button data-testid="run-command" onClick={runCommand}>
        Run Command
      </button>
      {isLoading && <div>Loading...</div>}
      {result && <div data-testid="command-result">{JSON.stringify(result)}</div>}
    </div>
  );
};

// Test application component
const TestApp = ({ triggerError = false, command = 'good-command' }) => {
  return (
    <ErrorProvider>
      <ErrorBoundary>
        <div data-testid="app-content">
          <h1>Test Application</h1>
          <ErrorTrigger triggerError={triggerError} />
          <CommandExecutor command={command} />
        </div>
      </ErrorBoundary>
    </ErrorProvider>
  );
};

describe('Error Handling Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset error reporter
    errorReporter.clearErrors();
    
    // Suppress React's error boundary warnings in tests
    const originalConsoleError = console.error;
    console.error = (...args) => {
      if (/React will try to recreate this component tree/.test(args[0])) {
        return;
      }
      originalConsoleError(...args);
    };
    
    return () => {
      console.error = originalConsoleError;
    };
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should successfully render application without errors', () => {
    render(<TestApp />);
    
    // App content should be visible
    expect(screen.getByTestId('app-content')).toBeDefined();
    expect(screen.getByTestId('error-trigger')).toBeDefined();
    
    // No error notification should be present
    expect(screen.queryByTestId('error-notification')).toBeNull();
  });
  
  it('should catch and display component errors', () => {
    // Suppress React errors for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(<TestApp triggerError={true} />);
    
    // Error notification should be displayed
    expect(screen.getByTestId('error-notification')).toBeDefined();
    
    // Error should be reported to errorReporter
    expect(logger.log).toHaveBeenCalled();
    
    spy.mockRestore();
  });
  
  it('should handle command execution errors', async () => {
    render(<TestApp command="error-command" />);
    
    // Execute command that will fail
    fireEvent.click(screen.getByTestId('run-command'));
    
    // Wait for error to be processed
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Error should be logged
    expect(logger.debug).toHaveBeenCalled();
    
    // Error should be reported
    expect(logger.log).toHaveBeenCalled();
  });
  
  it('should handle successful command execution', async () => {
    render(<TestApp />);
    
    // Execute command that will succeed
    fireEvent.click(screen.getByTestId('run-command'));
    
    // Wait for command to complete
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Success should be logged
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('Command completed successfully'),
      expect.anything()
    );
    
    // No error should be reported
    expect(errorReporter.getAllErrors()).toHaveLength(0);
  });
  
  it('should allow dismissing errors', async () => {
    // Manually report an error
    errorReporter.reportError('Test error', {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.COMMAND,
    });
    
    render(<TestApp />);
    
    // Error notification should be displayed
    expect(screen.getByTestId('error-notification')).toBeDefined();
    
    // Dismiss the error
    const useInputMock = require('ink').useInput;
    const escapeHandler = useInputMock.mock.calls[0][0];
    
    act(() => {
      escapeHandler('', { escape: true });
    });
    
    // Error should be marked as handled
    const errors = errorReporter.getAllErrors();
    expect(errors[0].handled).toBe(true);
    
    // Error notification should be removed
    expect(screen.queryByTestId('error-notification')).toBeNull();
  });
});