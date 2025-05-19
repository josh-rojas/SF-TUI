/**
 * @file ErrorBoundary.tsx
 * @description A React Error Boundary component that catches JavaScript errors in child components,
 * logs them to the error reporting service, and displays a fallback UI. This component helps prevent
 * the entire application from crashing when an error occurs in the UI.
 */

import React, { Component, ReactNode, ErrorInfo } from 'react';
import { Box, Text } from 'ink';
import { errorReporter, ErrorSeverity, ErrorCategory } from '../../utils/errorReporter';
import ErrorNotification from './ErrorNotification';

/**
 * Props for the ErrorBoundary component
 * 
 * @interface ErrorBoundaryProps
 * @property {ReactNode} children - Child components to be wrapped by the error boundary
 * @property {string} [id] - Optional identifier for the boundary (useful for debugging)
 * @property {string} [componentName] - Name of the component where the boundary is used
 * @property {boolean} [showError=true] - Whether to show the error UI
 * @property {ReactNode} [fallback] - Custom fallback UI to display when an error occurs
 */
interface ErrorBoundaryProps {
  /**
   * The child components to render
   */
  children: ReactNode;
  
  /**
   * Optional identifier for this boundary to help with debugging
   */
  id?: string;
  
  /**
   * Component name or context for better error reporting
   */
  componentName?: string;
  
  /**
   * Whether to show the error UI or just silently report it
   * @default true
   */
  showError?: boolean;
  
  /**
   * Fallback UI to show when an error occurs
   * If not provided, a default error UI will be shown
   */
  fallback?: ReactNode;
}

/**
 * Internal state of the ErrorBoundary component
 * 
 * @interface ErrorBoundaryState
 * @property {boolean} hasError - Whether an error has been caught
 * @property {Error | null} error - The error that was caught
 * @property {ErrorInfo | null} errorInfo - Additional error information
 * @property {string | null} errorId - Unique identifier for the reported error
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

/**
 * ErrorBoundary Component
 * 
 * A reusable error boundary that catches JavaScript errors in its child component tree,
 * logs those errors, and displays a fallback UI instead of the component tree that crashed.
 * 
 * @class ErrorBoundary
 * @extends {Component<ErrorBoundaryProps, ErrorBoundaryState>}
 * @example
 * <ErrorBoundary componentName="MyComponent">
 *   <MyComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Report the error to our error reporting service
    const { id, componentName } = this.props;
    const context = componentName || (id ? `ErrorBoundary(${id})` : 'ErrorBoundary');
    
    const errorReport = errorReporter.reportError(`UI Error in ${context}`, {
      error,
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.UI,
      context,
      details: {
        componentStack: errorInfo.componentStack,
      },
      userAction: 'Try refreshing the application or report this issue to the developers.',
    });
    
    this.setState({
      errorInfo,
      errorId: errorReport.id,
    });
  }

  render(): ReactNode {
    const { children, showError = true, fallback } = this.props;
    const { hasError, error, errorId } = this.state;

    if (hasError) {
      if (!showError) {
        return null;
      }

      if (fallback) {
        return fallback;
      }

      if (error && errorId) {
        // Get the error report from the reporter
        const errorReport = errorReporter.getError(errorId);
        
        if (errorReport) {
          return (
            <Box flexDirection="column" paddingY={1}>
              <ErrorNotification error={errorReport} />
            </Box>
          );
        }
      }

      // Fallback error UI if we can't get the error report
      return (
        <Box flexDirection="column" borderStyle="round" borderColor="red" padding={1}>
          <Text bold color="red">An error occurred in this component</Text>
          {error && (
            <Text wrap="wrap">{error.message}</Text>
          )}
          <Text>Please try again or restart the application.</Text>
        </Box>
      );
    }

    return children;
  }
}

export default ErrorBoundary;