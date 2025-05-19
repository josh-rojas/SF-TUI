import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Box } from 'ink';
import { errorReporter, ErrorReport } from '../../utils/errorReporter';
import ErrorNotification from './ErrorNotification';

// Create a context for errors
interface ErrorContextType {
  // List of active errors
  errors: ErrorReport[];
  // Dismiss a specific error
  dismissError: (errorId: string) => void;
  // Clear all errors
  clearErrors: () => void;
}

const ErrorContext = createContext<ErrorContextType>({
  errors: [],
  dismissError: () => {},
  clearErrors: () => {},
});

// Custom hook to access the error context
export const useErrors = () => useContext(ErrorContext);

interface ErrorProviderProps {
  children: ReactNode;
  
  /**
   * Maximum number of error notifications to show at once
   * @default 3
   */
  maxVisibleErrors?: number;
  
  /**
   * Whether to position the error container at the top or bottom
   * @default 'top'
   */
  position?: 'top' | 'bottom';
}

/**
 * Provider component that manages error notifications throughout the app
 */
const ErrorProvider: React.FC<ErrorProviderProps> = ({
  children,
  maxVisibleErrors = 3,
  position = 'top',
}) => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  
  // Subscribe to error reporter
  useEffect(() => {
    const unsubscribe = errorReporter.subscribe((error) => {
      setErrors((prev) => {
        // Check if we already have this error
        if (prev.some(e => e.id === error.id)) {
          return prev;
        }
        // Add new error to the beginning of the array
        return [error, ...prev];
      });
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Dismiss a specific error
  const dismissError = (errorId: string) => {
    errorReporter.markAsHandled(errorId);
    setErrors((prev) => prev.filter(error => error.id !== errorId));
  };
  
  // Clear all errors
  const clearErrors = () => {
    errors.forEach(error => {
      errorReporter.markAsHandled(error.id);
    });
    setErrors([]);
  };
  
  // Visible errors (limited by maxVisibleErrors)
  const visibleErrors = errors.slice(0, maxVisibleErrors);
  
  return (
    <ErrorContext.Provider value={{ errors, dismissError, clearErrors }}>
      <Box flexDirection="column">
        {position === 'top' && visibleErrors.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            {visibleErrors.map((error) => (
              <ErrorNotification
                key={error.id}
                error={error}
                onDismiss={() => dismissError(error.id)}
              />
            ))}
            {errors.length > maxVisibleErrors && (
              <Box justifyContent="center" marginY={1}>
                <Box borderStyle="single" paddingX={1}>
                  <Box>
                    {errors.length - maxVisibleErrors} more {errors.length - maxVisibleErrors === 1 ? 'error' : 'errors'} not shown
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
        
        {children}
        
        {position === 'bottom' && visibleErrors.length > 0 && (
          <Box flexDirection="column" marginTop={1}>
            {visibleErrors.map((error) => (
              <ErrorNotification
                key={error.id}
                error={error}
                onDismiss={() => dismissError(error.id)}
              />
            ))}
            {errors.length > maxVisibleErrors && (
              <Box justifyContent="center" marginY={1}>
                <Box borderStyle="single" paddingX={1}>
                  <Box>
                    {errors.length - maxVisibleErrors} more {errors.length - maxVisibleErrors === 1 ? 'error' : 'errors'} not shown
                  </Box>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </ErrorContext.Provider>
  );
};

export default ErrorProvider;