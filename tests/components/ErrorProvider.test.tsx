import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import ErrorProvider, { useErrors } from '../../src/components/common/ErrorProvider';
import { ErrorSeverity, ErrorCategory } from '../../src/utils/errorReporter';
import { createInkMock } from '../testUtils';

// Declare mock variables to be used in tests and mock factory
let mockSubscribe: any;
let mockErrorReporter: any;

// Mock errorReporter module
vi.mock('../../src/utils/errorReporter', async () => {
  const actual = await vi.importActual<typeof import('../../src/utils/errorReporter')>('../../src/utils/errorReporter');
  return {
    ...actual,
    __esModule: true,
    // Use the hoisted variables in the mock
    errorReporter: {
      ...actual.errorReporter,
      ...mockErrorReporter,
      subscribe: mockSubscribe,
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
    // Initialize mock variables before each test
    mockSubscribe = vi.fn();
    mockErrorReporter = {
      subscribe: mockSubscribe,
      markAsHandled: vi.fn(),
      getAllErrors: vi.fn().mockReturnValue([]),
      clearErrors: vi.fn(),
      submitFeedback: vi.fn(),
      reportError: vi.fn(),
      shutdown: vi.fn(),
    };
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
  
  it('should add errors when received from error reporter', async () => {
    // Reset mocks before test
    mockSubscribe.mockClear();
    
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
    
    // Get the subscribe callback
    const [subscribeCallback] = mockSubscribe.mock.calls[0];
    
    await act(async () => {
      subscribeCallback(mockError);
    });
    
    // Should update the error count
    expect(screen.getByTestId('error-count').textContent).toBe('1 error');
    
    // Should display the error message
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });
  
  it('should dismiss errors when requested', async () => {
    // Reset mocks before test
    mockSubscribe.mockClear();
    mockErrorReporter.markAsHandled.mockClear();
    
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
    
    // Get the subscribe callback
    const [subscribeCallback] = mockSubscribe.mock.calls[0];
    
    await act(async () => {
      subscribeCallback(mockError);
    });
    
    // Click the dismiss button
    const dismissButton = screen.getByText('Dismiss');
    fireEvent.click(dismissButton);
    
    // Should call markAsHandled with the error id
    expect(mockErrorReporter.markAsHandled).toHaveBeenCalledWith('error-123');
  });
  
  it('should clear all errors when requested', () => {
    // Reset mocks before test
    mockSubscribe.mockClear();
    mockErrorReporter.markAsHandled.mockClear();
    
    render(
      <ErrorProvider>
        <ErrorDisplay />
      </ErrorProvider>
    );
    
    // Simulate receiving multiple errors
    const mockErrors = [
      { id: 'error-1', message: 'Error 1', severity: ErrorSeverity.HIGH, category: ErrorCategory.COMMAND, timestamp: new Date(), handled: false },
      { id: 'error-2', message: 'Error 2', severity: ErrorSeverity.MEDIUM, category: ErrorCategory.NETWORK, timestamp: new Date(), handled: false },
    ];
    
    // Get the subscribe callback
    const [subscribeCallback] = mockSubscribe.mock.calls[0];
    
    act(() => {
      subscribeCallback(mockErrors[0]);
      subscribeCallback(mockErrors[1]);
    });
    
    // Should have 2 errors
    expect(screen.getByTestId('error-count').textContent).toBe('2 errors');
    
    // Clear all errors
    fireEvent.click(screen.getByTestId('clear-errors'));
    
    // Should now have 0 errors
    expect(screen.getByTestId('error-count').textContent).toBe('0 errors');
    
    // Verify markAsHandled was called for each error
    expect(mockErrorReporter.markAsHandled).toHaveBeenCalledTimes(2);
    expect(mockErrorReporter.markAsHandled).toHaveBeenCalledWith('error-1');
    expect(mockErrorReporter.markAsHandled).toHaveBeenCalledWith('error-2');
  });
  
  it('should limit visible errors based on maxVisibleErrors prop', async () => {
    // Reset mocks before test
    mockSubscribe.mockClear();
    
    // Set up the mock to return 5 errors
    const errors = Array(5).fill(0).map((_, i) => ({
      id: `${i}`,
      message: `Error ${i}`,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.UI,
      timestamp: new Date(),
      handled: false,
    }));

    mockErrorReporter.getAllErrors.mockReturnValue(errors);

    render(
      <ErrorProvider maxVisibleErrors={3}>
        <ErrorDisplay />
      </ErrorProvider>
    );

    // Wait for the component to update
    await act(async () => {
      // Wait for any state updates to complete
    });

    // Check that only 3 errors are rendered
    const errorElements = screen.getAllByTestId('error-notification');
    expect(errorElements.length).toBe(3);

    // Check that the first 3 errors are the ones displayed
    expect(screen.getByText('Error 0')).toBeInTheDocument();
    expect(screen.getByText('Error 1')).toBeInTheDocument();
    expect(screen.getByText('Error 2')).toBeInTheDocument();
    expect(screen.queryByText('Error 3')).not.toBeInTheDocument();
    expect(screen.queryByText('Error 4')).not.toBeInTheDocument();
  });
  
  it('should position errors at the top or bottom based on position prop', () => {
    // Test with position="top" (default)
    const { container } = render(
      <ErrorProvider position="top">
        <div>Content</div>
      </ErrorProvider>
    );
    
    // Should have error-container at the top
    const topContainer = container.firstChild as HTMLElement;
    expect(topContainer).not.toBeNull();
    expect(topContainer).toHaveClass('error-container');
    
    // Test with position="bottom"
    const { container: containerBottom } = render(
      <ErrorProvider position="bottom">
        <div>Content</div>
      </ErrorProvider>
    );
    
    // Should have error-container at the bottom
    const bottomContainer = containerBottom.lastChild as HTMLElement;
    expect(bottomContainer).not.toBeNull();
    expect(bottomContainer).toHaveClass('error-container');
  });
});