import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';
import Spinner from './Spinner';

type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'loading';

type NotificationProps = {
  /**
   * The type of notification to display
   * @default 'info'
   */
  type?: NotificationType;
  
  /**
   * The notification message to display
   */
  message: string | React.ReactNode;
  
  /**
   * Optional title for the notification
   */
  title?: string;
  
  /**
   * Whether the notification should be dismissible
   * @default false
   */
  dismissible?: boolean;
  
  /**
   * Callback when the notification is dismissed
   */
  onDismiss?: () => void;
  
  /**
   * Time in milliseconds after which the notification will auto-dismiss
   * Set to 0 to disable auto-dismiss
   * @default 5000
   */
  autoDismiss?: number;
  
  /**
   * Additional styles for the notification container
   */
  style?: React.CSSProperties;
};

/**
 * A notification component to display messages to the user
 */
const Notification: React.FC<NotificationProps> = ({
  type = 'info',
  message,
  title,
  dismissible = false,
  onDismiss,
  autoDismiss = 5000,
  style = {},
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(true);
  
  // Icons for different notification types
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    loading: '⏳',
  };
  
  // Colors for different notification types
  const colors = {
    info: theme.colors.info,
    success: theme.colors.success,
    warning: theme.colors.warning,
    error: theme.colors.error,
    loading: theme.colors.primary,
  };
  
  // Handle auto-dismiss
  useEffect(() => {
    if (!isVisible || !autoDismiss || type === 'loading') return;
    
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoDismiss);
    
    return () => {
      clearTimeout(timer);
    };
  }, [isVisible, autoDismiss, type]);
  
  // Handle dismiss action
  const handleDismiss = () => {
    if (!dismissible && !autoDismiss) return;
    
    setIsVisible(false);
    if (onDismiss) {
      onDismiss();
    }
  };
  
  // Don't render if not visible
  if (!isVisible) return null;
  
  // Determine border style based on type
  const borderStyle = {
    single: {
      topLeft: '┌',
      topRight: '┐',
      bottomRight: '┘',
      bottomLeft: '└',
      horizontal: '─',
      vertical: '│',
    },
  };
  
  return (
    <Box 
      flexDirection="column"
      borderStyle="single"
      borderColor={colors[type]}
      paddingX={1}
      paddingY={0}
      style={{
        borderStyle: 'single',
        borderColor: colors[type],
        ...style,
      }}
    >
      {/* Header with title and dismiss button */}
      {(title || dismissible) && (
        <Box flexDirection="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Text bold color={colors[type]}>
              {type !== 'loading' ? icons[type] + ' ' : ''}
              {title || type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </Box>
          {dismissible && (
            <Box>
              <Text 
                color={theme.colors.textMuted}
                onClick={handleDismiss}
                style={{ cursor: 'pointer' }}
              >
                ✕
              </Text>
            </Box>
          )}
        </Box>
      )}
      
      {/* Message content */}
      <Box paddingY={title || dismissible ? 1 : 0}>
        {type === 'loading' ? (
          <Box flexDirection="row" alignItems="center">
            <Spinner type="dots" color={colors[type]} />
            <Text> </Text>
            <Text>{message}</Text>
          </Box>
        ) : (
          <Text>{message}</Text>
        )}
      </Box>
    </Box>
  );
};

export default Notification;
