import React, { useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../../themes';
import { ErrorReport, ErrorSeverity, errorReporter } from '../../utils/errorReporter';
import Divider from './Divider';
import { truncate } from '../../utils/helpers';

interface ErrorNotificationProps {
  /**
   * The error report to display
   */
  error: ErrorReport;
  
  /**
   * Whether to show detailed information
   * @default false
   */
  showDetails?: boolean;
  
  /**
   * Whether the notification should be dismissible
   * @default true
   */
  dismissible?: boolean;
  
  /**
   * Callback when the notification is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Time in milliseconds after which the notification will auto-dismiss
   * Set to 0 to disable auto-dismiss
   * @default 0
   */
  autoDismiss?: number;
  
  /**
   * Whether to mark the error as handled when dismissed
   * @default true
   */
  markAsHandled?: boolean;
}

/**
 * A specialized notification component for displaying error information
 */
const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  showDetails = false,
  dismissible = true,
  onDismiss,
  autoDismiss = 0,
  markAsHandled = true,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  const [showDetailsState, setShowDetailsState] = useState(showDetails);
  
  // Get the appropriate color based on error severity
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return theme.colors.info;
      case ErrorSeverity.MEDIUM:
        return theme.colors.warning;
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return theme.colors.error;
      default:
        return theme.colors.error;
    }
  };

  // Get severity display name
  const getSeverityName = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.LOW:
        return 'Minor';
      case ErrorSeverity.MEDIUM:
        return 'Warning';
      case ErrorSeverity.HIGH:
        return 'Error';
      case ErrorSeverity.CRITICAL:
        return 'Critical';
      default:
        return 'Error';
    }
  };
  
  // Handle auto-dismiss
  useEffect(() => {
    if (!isVisible || !autoDismiss) return;
    
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismiss);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isVisible, autoDismiss]);
  
  // Handle dismiss action
  const handleDismiss = () => {
    if (!dismissible && !autoDismiss) return;
    
    setIsVisible(false);
    
    if (markAsHandled) {
      errorReporter.markAsHandled(error.id);
    }
    
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Handle keyboard input
  useInput((input, key) => {
    if (key.escape && dismissible) {
      handleDismiss();
    }
    
    if (input === 'd' || input === 'D') {
      setShowDetailsState(!showDetailsState);
    }
  });
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  const severityColor = getSeverityColor(error.severity);
  
  return (
    <Box 
      flexDirection="column"
      borderStyle="round"
      borderColor={severityColor}
      padding={1}
    >
      {/* Header with severity and category */}
      <Box flexDirection="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Text bold color={severityColor}>
            {getSeverityName(error.severity)}: {error.category}
          </Text>
        </Box>
        {dismissible && (
          <Box>
            <Text 
              color={theme.colors.textMuted}
              dimColor
              onClick={handleDismiss}
            >
              [ESC to close]
            </Text>
          </Box>
        )}
      </Box>
      
      {/* Error message */}
      <Box marginY={1}>
        <Text wrap="wrap">{error.message}</Text>
      </Box>
      
      {/* User action suggestion if available */}
      {error.userAction && (
        <Box marginY={1}>
          <Text italic color={theme.colors.info}>
            Suggestion: {error.userAction}
          </Text>
        </Box>
      )}
      
      {/* Show details toggle */}
      <Box marginY={1}>
        <Text dimColor>
          Press 'D' to {showDetailsState ? 'hide' : 'show'} details
        </Text>
      </Box>
      
      {/* Error details when expanded */}
      {showDetailsState && (
        <Box flexDirection="column" marginTop={1}>
          <Divider />
          <Box marginY={1}>
            <Text bold>Error ID:</Text>
            <Text> </Text>
            <Text>{error.id}</Text>
          </Box>
          
          {error.context && (
            <Box marginY={1}>
              <Text bold>Context:</Text>
              <Text> </Text>
              <Text>{error.context}</Text>
            </Box>
          )}
          
          <Box marginY={1}>
            <Text bold>Time:</Text>
            <Text> </Text>
            <Text>{error.timestamp.toLocaleString()}</Text>
          </Box>
          
          {error.details && Object.keys(error.details).length > 0 && (
            <Box flexDirection="column" marginY={1}>
              <Text bold>Details:</Text>
              {Object.entries(error.details).map(([key, value]) => (
                <Text key={key}>
                  {key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Text>
              ))}
            </Box>
          )}
          
          {error.error?.stack && (
            <Box flexDirection="column" marginY={1}>
              <Text bold>Stack Trace:</Text>
              <Box 
                flexDirection="column"
                borderStyle="single"
                borderColor={theme.colors.textMuted}
                paddingX={1}
                height={5}
                overflow="auto"
                marginTop={1}
              >
                {error.error.stack.split('\n').map((line, i) => (
                  <Text key={i} dimColor wrap="wrap">{truncate(line, 100)}</Text>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ErrorNotification;