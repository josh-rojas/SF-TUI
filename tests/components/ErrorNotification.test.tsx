import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ErrorNotification from '../../src/components/common/ErrorNotification';
import { ErrorSeverity, ErrorCategory } from '../../src/utils/errorReporter';
import { createInkMock } from '../testUtils';

// Mock errorReporter
vi.mock('../../src/utils/errorReporter', () => ({
  errorReporter: {
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
}));

// Mock useTheme
vi.mock('../../src/themes', () => ({
  useTheme: () => ({
    colors: {
      info: 'blue',
      warning: 'yellow',
      error: 'red',
      primary: 'cyan',
      textMuted: 'gray',
    },
  }),
}));

// Mock Ink
createInkMock();

describe('ErrorNotification', () => {
  const mockError = {
    id: 'error-123',
    timestamp: new Date(),
    message: 'Test error message',
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.COMMAND,
    context: 'TestContext',
    details: { key: 'value' },
    userAction: 'Try this to fix the issue',
    handled: false,
    error: new Error('Detailed error info'),
  };
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  it('renders basic error notification', () => {
    render(<ErrorNotification error={mockError} />);
    
    // Verify error message is displayed
    expect(screen.getByText('Test error message')).toBeDefined();
    
    // Verify severity and category are displayed
    expect(screen.getByText(/Error: COMMAND/)).toBeDefined();
    
    // Verify user action is displayed
    expect(screen.getByText(/Try this to fix the issue/)).toBeDefined();
  });
  
  it('renders with details when expanded', () => {
    render(<ErrorNotification error={mockError} showDetails={true} />);
    
    // Verify error ID is displayed
    expect(screen.getByText(/error-123/)).toBeDefined();
    
    // Verify context is displayed
    expect(screen.getByText(/TestContext/)).toBeDefined();
    
    // Verify details are displayed
    expect(screen.getByText(/key: value/)).toBeDefined();
    
    // Verify stack trace is displayed
    expect(screen.getByText(/Stack Trace:/)).toBeDefined();
  });
  
  it('calls onDismiss when dismissed', () => {
    const onDismiss = vi.fn();
    render(
      <ErrorNotification 
        error={mockError} 
        dismissible={true} 
        onDismiss={onDismiss} 
      />
    );
    
    // Simulate escape key press to dismiss
    const useInputMock = require('ink').useInput;
    const escapeHandler = useInputMock.mock.calls[0][0];
    
    escapeHandler('', { escape: true });
    
    // Verify onDismiss was called
    expect(onDismiss).toHaveBeenCalled();
  });
  
  it('marks error as handled when dismissed', () => {
    const errorReporter = require('../../src/utils/errorReporter').errorReporter;
    
    render(
      <ErrorNotification 
        error={mockError} 
        dismissible={true} 
        markAsHandled={true} 
      />
    );
    
    // Simulate escape key press to dismiss
    const useInputMock = require('ink').useInput;
    const escapeHandler = useInputMock.mock.calls[0][0];
    
    escapeHandler('', { escape: true });
    
    // Verify markAsHandled was called
    expect(errorReporter.markAsHandled).toHaveBeenCalledWith('error-123');
  });
  
  it('toggles details display when D key is pressed', () => {
    render(<ErrorNotification error={mockError} />);
    
    // Simulate D key press
    const useInputMock = require('ink').useInput;
    const keyHandler = useInputMock.mock.calls[0][0];
    
    // No details initially
    expect(screen.queryByText(/Error ID:/)).toBeNull();
    
    // Press D to show details
    keyHandler('d', {});
    
    // Details should now be visible
    expect(screen.getByText(/Error ID:/)).toBeDefined();
    
    // Press D again to hide details
    keyHandler('d', {});
    
    // Details should be hidden again
    expect(screen.queryByText(/Error ID:/)).toBeNull();
  });
  
  it('auto-dismisses after specified timeout', () => {
    vi.useFakeTimers();
    
    const onDismiss = vi.fn();
    render(
      <ErrorNotification 
        error={mockError} 
        autoDismiss={1000} 
        onDismiss={onDismiss} 
      />
    );
    
    // Fast-forward timer
    vi.advanceTimersByTime(1100);
    
    // Verify onDismiss was called
    expect(onDismiss).toHaveBeenCalled();
    
    vi.useRealTimers();
  });
  
  it('displays different colors based on error severity', () => {
    // Test low severity
    const lowSeverityError = {
      ...mockError,
      severity: ErrorSeverity.LOW,
    };
    
    const { unmount } = render(<ErrorNotification error={lowSeverityError} />);
    
    // Check for blue color for low severity (info color)
    expect(screen.getByText(/Minor: COMMAND/)).toBeDefined();
    
    unmount();
    
    // Test medium severity
    const mediumSeverityError = {
      ...mockError,
      severity: ErrorSeverity.MEDIUM,
    };
    
    render(<ErrorNotification error={mediumSeverityError} />);
    
    // Check for yellow color for medium severity (warning color)
    expect(screen.getByText(/Warning: COMMAND/)).toBeDefined();
  });
});