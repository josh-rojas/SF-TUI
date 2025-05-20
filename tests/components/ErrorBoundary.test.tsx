import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ErrorBoundary from '../../src/components/common/ErrorBoundary';
import { createInkMock } from '../testUtils';

// Mock errorReporter
const mockReportError = vi.fn().mockReturnValue({ id: 'mock-error-id' });
const mockGetError = vi.fn().mockReturnValue({
  id: 'mock-error-id',
  message: 'Error from boundary',
  severity: 'HIGH',
  category: 'UI',
});

vi.mock('../../src/utils/errorReporter', () => ({
  errorReporter: {
    reportError: mockReportError,
    getError: mockGetError,
  },
  ErrorSeverity: {
    HIGH: 'HIGH',
  },
  ErrorCategory: {
    UI: 'UI',
  },
}));

// Mock ErrorNotification component
vi.mock('../../src/components/common/ErrorNotification', () => {
  return {
    default: ({ error }) => (
      <div data-testid="error-notification">
        <span data-testid="error-message">{error.message}</span>
      </div>
    ),
  };
});

// Create an Ink mock
createInkMock();

// Component that throws an error
class Thrower extends React.Component {
  render(): React.ReactNode {
    throw new Error('Test error');
    return null; // This line is unreachable but satisfies TypeScript
  }
}

// Component that throws an error in a lifecycle method
class LifecycleThrower extends React.Component<{}, {}> {
  componentDidMount(): void {
    throw new Error('Lifecycle error');
  }
  
  render(): React.ReactNode {
    return <div>Lifecycle Thrower</div>;
  }
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Suppress React's error boundary warning in tests
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
  
  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Child content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByTestId('child')).toBeDefined();
  });
  
  it('should catch errors and display error UI', () => {
    const errorReporter = require('../../src/utils/errorReporter').errorReporter;
    
    // Use separate test block for error boundary testing
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    
    // Verify error was reported
    expect(errorReporter.reportError).toHaveBeenCalled();
    
    // Verify error notification is displayed
    expect(screen.getByTestId('error-notification')).toBeDefined();
    
    spy.mockRestore();
  });
  
  it('should include component name in error context', () => {
    const errorReporter = require('../../src/utils/errorReporter').errorReporter;
    
    // Use separate test block for error boundary testing
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary componentName="TestComponent">
        <Thrower />
      </ErrorBoundary>
    );
    
    // Verify error was reported with component name
    expect(errorReporter.reportError).toHaveBeenCalledWith(
      'UI Error in TestComponent',
      expect.anything()
    );
    
    spy.mockRestore();
  });
  
  it('should render custom fallback UI if provided', () => {
    // Use separate test block for error boundary testing
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary
        fallback={<div data-testid="custom-fallback">Custom error UI</div>}
      >
        <Thrower />
      </ErrorBoundary>
    );
    
    // Verify custom fallback is displayed
    expect(screen.getByTestId('custom-fallback')).toBeDefined();
    
    spy.mockRestore();
  });
  
  it('should not display error UI if showError is false', () => {
    // Use separate test block for error boundary testing
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary showError={false}>
        <Thrower />
      </ErrorBoundary>
    );
    
    // Verify nothing is rendered
    expect(screen.queryByTestId('error-notification')).toBeNull();
    
    spy.mockRestore();
  });
  
  it('should catch errors in lifecycle methods', () => {
    const errorReporter = require('../../src/utils/errorReporter').errorReporter;
    
    // Use separate test block for error boundary testing
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <LifecycleThrower />
      </ErrorBoundary>
    );
    
    // Verify error was reported
    expect(errorReporter.reportError).toHaveBeenCalled();
    
    // Verify error notification is displayed
    expect(screen.getByTestId('error-notification')).toBeDefined();
    
    spy.mockRestore();
  });
  
  it('should include error details in report', () => {
    const errorReporter = require('../../src/utils/errorReporter').errorReporter;
    
    // Use separate test block for error boundary testing
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary id="test-boundary">
        <Thrower />
      </ErrorBoundary>
    );
    
    // Verify error was reported with details
    expect(errorReporter.reportError).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        severity: 'HIGH',
        category: 'UI',
        details: expect.objectContaining({
          componentStack: expect.anything(),
        }),
      })
    );
    
    spy.mockRestore();
  });
});