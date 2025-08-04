import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useInput } from 'ink';
import { createE2ETestEnvironment, renderForE2E } from './e2eUtils';
import ErrorProvider from '../../src/components/common/ErrorProvider';
import { errorReporter, ErrorSeverity, ErrorCategory } from '../../src/utils/errorReporter';
import { Button } from '../../src/components/common/Button';
import ErrorBoundary from '../../src/components/common/ErrorBoundary';

// Create the E2E test environment
const e2e = createE2ETestEnvironment();

// Component that throws an error
const ErrorThrower = ({ shouldThrow = false }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  
  return <div data-testid="error-thrower">No error thrown</div>;
};

// Component with a button that reports an error
const ErrorReporter = () => {
  const handleClick = () => {
    errorReporter.reportError('Button clicked error', {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.UI,
      context: 'ErrorReporter',
      userAction: 'Try clicking a different button.',
    });
  };
  
  return (
    <Button onPress={handleClick}>
      Report Error
    </Button>
  );
};

// Mock useTheme
vi.mock('../../src/themes', () => ({
  useTheme: () => ({
    colors: {
      text: 'white',
      textInverse: 'black',
      background: 'black',
      backgroundHover: 'darkgray',
      highlight: 'blue',
      border: 'gray',
      textMuted: 'lightgray',
      primary: 'blue',
      secondary: 'purple',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'cyan',
    }
  }),
}));

describe('Error Handling E2E Tests', () => {
  beforeEach(() => {
    e2e.setupMocks();
    // Reset error reporter
    errorReporter.clearErrors();
  });
  
  afterEach(() => {
    e2e.cleanupMocks();
  });
  
  it('should catch and display error from ErrorBoundary', async () => {
    const { getByText } = renderForE2E(
      <ErrorProvider>
        <ErrorBoundary>
          <ErrorThrower shouldThrow={true} />
        </ErrorBoundary>
      </ErrorProvider>
    );
    
    // ErrorBoundary should catch the error and display it
    expect(getByText(/Error:/)).toBeDefined();
    expect(getByText(/Test error/)).toBeDefined();
  });
  
  it('should display reported errors', async () => {
    const { getByText } = renderForE2E(
      <ErrorProvider>
        <ErrorReporter />
      </ErrorProvider>
    );
    
    // Simulate clicking the button
    const button = getByText('Report Error');
    
    // Get input handler
    const inputHandler = vi.mocked(useInput).mock.calls[0][0];
    
    // Simulate pressing Enter to click the button
    inputHandler('', { return: true });
    
    // Error notification should be displayed
    expect(getByText(/Button clicked error/)).toBeDefined();
    expect(getByText(/Error: UI/)).toBeDefined();
    expect(getByText(/Try clicking a different button/)).toBeDefined();
  });
  
  it('should dismiss errors when ESC is pressed', async () => {
    const { getByText, queryByText } = renderForE2E(
      <ErrorProvider>
        <ErrorReporter />
      </ErrorProvider>
    );
    
    // Report an error
    errorReporter.reportError('Test error message', {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.COMMAND,
    });
    
    // Error notification should be displayed
    expect(getByText(/Test error message/)).toBeDefined();
    
    // Simulate pressing ESC to dismiss the error
    e2e.simulateKeyPress('escape');
    
    // Error notification should be dismissed
    expect(queryByText(/Test error message/)).toBeNull();
  });
  
  it('should limit the number of visible errors', async () => {
    const { getByText } = renderForE2E(
      <ErrorProvider maxVisibleErrors={2}>
        <div>Test content</div>
      </ErrorProvider>
    );
    
    // Report multiple errors
    errorReporter.reportError('Error 1', { severity: ErrorSeverity.LOW });
    errorReporter.reportError('Error 2', { severity: ErrorSeverity.MEDIUM });
    errorReporter.reportError('Error 3', { severity: ErrorSeverity.HIGH });
    
    // Should show first two errors
    expect(getByText(/Error 1/)).toBeDefined();
    expect(getByText(/Error 2/)).toBeDefined();
    
    // Should show a message about more errors
    expect(getByText(/1 more error/)).toBeDefined();
  });
  
  it('should toggle details display when D key is pressed', async () => {
    const { getByText, queryByText } = renderForE2E(
      <ErrorProvider>
        <div>Test content</div>
      </ErrorProvider>
    );
    
    // Report an error with details
    errorReporter.reportError('Error with details', {
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.COMMAND,
      details: { key: 'value' },
    });
    
    // Details should not be visible initially
    expect(queryByText(/key: value/)).toBeNull();
    
    // Simulate pressing D to show details
    e2e.simulateInput('d');
    
    // Details should now be visible
    expect(getByText(/key: value/)).toBeDefined();
    
    // Simulate pressing D again to hide details
    e2e.simulateInput('d');
    
    // Details should be hidden again
    expect(queryByText(/key: value/)).toBeNull();
  });
  
  it('should render fallback UI when provided to ErrorBoundary', async () => {
    const fallbackUI = <div data-testid="fallback">Custom fallback UI</div>;
    
    const { getByTestId } = renderForE2E(
      <ErrorProvider>
        <ErrorBoundary fallback={fallbackUI}>
          <ErrorThrower shouldThrow={true} />
        </ErrorBoundary>
      </ErrorProvider>
    );
    
    // Custom fallback UI should be rendered
    expect(getByTestId('fallback')).toBeDefined();
  });
});