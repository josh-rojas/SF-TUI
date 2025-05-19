import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ErrorProvider, { useErrors } from '../../src/components/common/ErrorProvider';
import { ErrorSeverity, ErrorCategory } from '../../src/utils/errorReporter';
import { createInkMock } from '../testUtils';

// Mock errorReporter
vi.mock('../../src/utils/errorReporter', () => {
  const mockSubscribe = vi.fn();
  
  return {
    errorReporter: {
      subscribe: mockSubscribe,
      markAsHandled: vi.fn(),
    },
    ErrorSeverity: {
      LOW: 'LOW',
      MEDIUM: 'MEDIUM',
      HIGH: 'HIGH',
      CRITICAL: 'CRITICAL',
    },
    ErrorCategory: {
      UI: 'UI',
      NETWORK: 'NETWORK',
      FILESYSTEM: 'FILESYSTEM',
      COMMAND: 'COMMAND',
      AUTH: 'AUTH',
      PLUGIN: 'PLUGIN',
      VALIDATION: 'VALIDATION',
      UNKNOWN: 'UNKNOWN',
    },
  };
});

// Mock ErrorNotification component
vi.mock('../../src/components/common/ErrorNotification', () => {
  return {
    default: ({ error, onDismiss }) => (
      <div data-testid="error-notification">
        <span data-testid="error-message">{error.message}</span>
        <button data-testid="dismiss-button" onClick={onDismiss}>Dismiss</button>
      </div>
    ),
  };
});

// Create an Ink mock
createInkMock();

// Test component that uses the useErrors hook
const ErrorDisplay = () => {
  const { errors, dismissError, clearErrors } = useErrors();
  
  return (
    <div>
      <p data-testid="error-count">{errors.length} errors</p>
      <button data-testid="clear-errors" onClick={clearErrors}>Clear All</button>
      {errors.map(error => (
        <div key={error.id} data-testid="error-item">
          <span>{error.message}</span>
          <button onClick={() => dismissError(error.id)}>Dismiss</button>
        </div>
      ))}
    </div>
  );
};

describe('ErrorProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('should subscribe to error reporter on mount', () => {
    const { errorReporter } = require('../../src/utils/errorReporter');
    
    render(
      <ErrorProvider>
        <div data-testid="children">Content</div>
      </ErrorProvider>
    );
    
    // Verify that subscribe was called
    expect(errorReporter.subscribe).toHaveBeenCalled();
    
    // Verify children are rendered
    expect(screen.getByTestId('children')).toBeDefined();
  });
  
  it('should provide error context to children', () => {
    render(
      <ErrorProvider>
        <ErrorDisplay />
      </ErrorProvider>
    );
    
    // Initial state should have 0 errors
    expect(screen.getByTestId('error-count').textContent).toBe('0 errors');
  });
  
  it('should add errors when received from error reporter', () => {
    // Get the subscribe function and mock implementation
    const { errorReporter } = require('../../src/utils/errorReporter');
    let subscriberCallback;
    
    errorReporter.subscribe.mockImplementation((callback) => {
      subscriberCallback = callback;
      return () => {};
    });
    
    render(
      <ErrorProvider>
        <ErrorDisplay />
      </ErrorProvider>
    );
    
    // Simulate receiving an error
    const mockError = {
      id: 'error-123',
      message: 'Test error',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.COMMAND,
      timestamp: new Date(),
      handled: false,
    };
    
    act(() => {
      subscriberCallback(mockError);
    });
    
    // Should now have 1 error
    expect(screen.getByTestId('error-count').textContent).toBe('1 errors');
    
    // Error should be displayed
    expect(screen.getByTestId('error-item')).toBeDefined();
    expect(screen.getByText('Test error')).toBeDefined();
  });
  
  it('should dismiss errors when requested', () => {
    // Get the subscribe function and mock implementation
    const { errorReporter } = require('../../src/utils/errorReporter');
    let subscriberCallback;
    
    errorReporter.subscribe.mockImplementation((callback) => {
      subscriberCallback = callback;
      return () => {};
    });
    
    render(
      <ErrorProvider>
        <ErrorDisplay />
      </ErrorProvider>
    );
    
    // Simulate receiving an error
    const mockError = {
      id: 'error-123',
      message: 'Test error',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.COMMAND,
      timestamp: new Date(),
      handled: false,
    };
    
    act(() => {
      subscriberCallback(mockError);
    });
    
    // Should have 1 error
    expect(screen.getByTestId('error-count').textContent).toBe('1 errors');
    
    // Dismiss the error
    fireEvent.click(screen.getByText('Dismiss'));
    
    // Should now have 0 errors
    expect(screen.getByTestId('error-count').textContent).toBe('0 errors');
    
    // Verify markAsHandled was called
    expect(errorReporter.markAsHandled).toHaveBeenCalledWith('error-123');
  });
  
  it('should clear all errors when requested', () => {
    // Get the subscribe function and mock implementation
    const { errorReporter } = require('../../src/utils/errorReporter');
    let subscriberCallback;
    
    errorReporter.subscribe.mockImplementation((callback) => {
      subscriberCallback = callback;
      return () => {};
    });
    
    render(
      <ErrorProvider>
        <ErrorDisplay />
      </ErrorProvider>
    );
    
    // Simulate receiving multiple errors
    const mockErrors = [
      {
        id: 'error-1',
        message: 'Error 1',
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.COMMAND,
        timestamp: new Date(),
        handled: false,
      },
      {
        id: 'error-2',
        message: 'Error 2',
        severity: ErrorSeverity.MEDIUM,
        category: ErrorCategory.NETWORK,
        timestamp: new Date(),
        handled: false,
      },
    ];
    
    act(() => {
      subscriberCallback(mockErrors[0]);
      subscriberCallback(mockErrors[1]);
    });
    
    // Should have 2 errors
    expect(screen.getByTestId('error-count').textContent).toBe('2 errors');
    
    // Clear all errors
    fireEvent.click(screen.getByTestId('clear-errors'));
    
    // Should now have 0 errors
    expect(screen.getByTestId('error-count').textContent).toBe('0 errors');
    
    // Verify markAsHandled was called for each error
    expect(errorReporter.markAsHandled).toHaveBeenCalledWith('error-1');
    expect(errorReporter.markAsHandled).toHaveBeenCalledWith('error-2');
  });
  
  it('should limit visible errors based on maxVisibleErrors prop', () => {
    // Get the subscribe function and mock implementation
    const { errorReporter } = require('../../src/utils/errorReporter');
    let subscriberCallback;
    
    errorReporter.subscribe.mockImplementation((callback) => {
      subscriberCallback = callback;
      return () => {};
    });
    
    render(
      <ErrorProvider maxVisibleErrors={2}>
        <div>Content</div>
      </ErrorProvider>
    );
    
    // Simulate receiving multiple errors
    const mockErrors = [
      { id: 'error-1', message: 'Error 1', severity: ErrorSeverity.HIGH, category: ErrorCategory.COMMAND, timestamp: new Date(), handled: false },
      { id: 'error-2', message: 'Error 2', severity: ErrorSeverity.MEDIUM, category: ErrorCategory.NETWORK, timestamp: new Date(), handled: false },
      { id: 'error-3', message: 'Error 3', severity: ErrorSeverity.LOW, category: ErrorCategory.AUTH, timestamp: new Date(), handled: false },
    ];
    
    act(() => {
      mockErrors.forEach(error => subscriberCallback(error));
    });
    
    // Should render only 2 error notifications
    const notifications = screen.getAllByTestId('error-notification');
    expect(notifications).toHaveLength(2);
    
    // Should show message about hidden errors
    expect(screen.getByText(/1 more error/)).toBeDefined();
  });
  
  it('should position errors at the top or bottom based on position prop', () => {
    // Test top position (default)
    const { unmount } = render(
      <ErrorProvider position="top">
        <div data-testid="content">Content</div>
      </ErrorProvider>
    );
    
    // Content should appear after the error container
    const container = screen.getByTestId('content').parentElement;
    expect(container.children[0]).not.toBe(screen.getByTestId('content'));
    
    unmount();
    
    // Test bottom position
    render(
      <ErrorProvider position="bottom">
        <div data-testid="content">Content</div>
      </ErrorProvider>
    );
    
    // Content should appear before the error container
    const containerBottom = screen.getByTestId('content').parentElement;
    expect(containerBottom.children[0]).toBe(screen.getByTestId('content'));
  });
});