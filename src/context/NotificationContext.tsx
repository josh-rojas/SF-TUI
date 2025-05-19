import React, { createContext, useContext, useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { v4 as uuidv4 } from 'uuid';
import { useTheme } from '../themes';
import { Transition } from '../components/common';

// Notification types
export type NotificationType = 'success' | 'error' | 'warning' | 'info' | 'progress';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  autoDismiss?: boolean;
  dismissAfter?: number; // ms
  progress?: number;
  maxProgress?: number;
  createdAt: Date;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Context type
interface NotificationContextType {
  notifications: Notification[];
  showNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => string;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  dismissNotification: (id: string) => void;
  dismissAll: () => void;
}

// Create context
const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  showNotification: () => '',
  updateNotification: () => {},
  dismissNotification: () => {},
  dismissAll: () => {},
});

// Provider component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);

  // Show a new notification
  const showNotification = (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = uuidv4();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
    };
    
    setNotifications(prev => [...prev, newNotification]);
    setVisibleNotifications(prev => [...prev, id]);
    
    // Auto-dismiss if enabled
    if (notification.autoDismiss) {
      const timeout = notification.dismissAfter || 5000;
      setTimeout(() => {
        dismissNotification(id);
      }, timeout);
    }
    
    return id;
  };

  // Update an existing notification
  const updateNotification = (id: string, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, ...updates } : notification
      )
    );
  };

  // Dismiss a notification
  const dismissNotification = (id: string) => {
    // Trigger onDismiss callback if exists
    const notification = notifications.find(n => n.id === id);
    if (notification?.onDismiss) {
      notification.onDismiss();
    }
    
    // Remove from visible notifications
    setVisibleNotifications(prev => prev.filter(notificationId => notificationId !== id));
    
    // Remove after animation completes
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 300);
  };

  // Dismiss all notifications
  const dismissAll = () => {
    notifications.forEach(notification => {
      if (notification.onDismiss) {
        notification.onDismiss();
      }
    });
    
    setVisibleNotifications([]);
    setTimeout(() => {
      setNotifications([]);
    }, 300);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      updateNotification,
      dismissNotification,
      dismissAll,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification renderer component
export const NotificationCenter: React.FC = () => {
  const { notifications, dismissNotification } = useNotifications();
  const [visibleNotifications, setVisibleNotifications] = useState<string[]>([]);
  const theme = useTheme();

  useEffect(() => {
    // Update the list of visible notifications based on new notifications
    setVisibleNotifications(prevVisible => {
      const currentIds = notifications.map(n => n.id);
      return [...prevVisible.filter(id => currentIds.includes(id)), ...currentIds.filter(id => !prevVisible.includes(id))];
    });
  }, [notifications]);

  // Get notification color based on type
  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      case 'progress':
        return theme.colors.primary;
      default:
        return theme.colors.text;
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      case 'progress':
        return '⟳';
      default:
        return '•';
    }
  };

  // Render a single notification
  const renderNotification = (notification: Notification) => {
    const { id, type, title, message, progress, maxProgress, actions } = notification;
    const color = getNotificationColor(type);
    const icon = getNotificationIcon(type);
    const isVisible = visibleNotifications.includes(id);

    // For progress notifications
    const showProgress = type === 'progress' && typeof progress === 'number';
    const progressPercentage = showProgress 
      ? Math.round((progress / (maxProgress || 100)) * 100) 
      : 0;
    
    return (
      <Transition
        key={id}
        type="slide-left"
        duration={300}
        visible={isVisible}
      >
        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={color}
          marginY={1}
          padding={1}
          width={60}
        >
          <Box>
            <Text color={color}>{icon} </Text>
            <Text bold>{title}</Text>
            <Box flexGrow={1} />
            <Text color={theme.colors.textMuted} onPress={() => dismissNotification(id)}>×</Text>
          </Box>
          
          <Box marginY={1}>
            <Text>{message}</Text>
          </Box>
          
          {showProgress && (
            <Box marginY={1}>
              <Box width={50}>
                <Text color={color}>
                  {Array(Math.floor(progressPercentage / 2)).fill('█').join('')}
                  {Array(50 - Math.floor(progressPercentage / 2)).fill('░').join('')}
                </Text>
              </Box>
              <Box marginLeft={1}>
                <Text>{progressPercentage}%</Text>
              </Box>
            </Box>
          )}
          
          {actions && actions.length > 0 && (
            <Box marginTop={1}>
              {actions.map((action, index) => (
                <Box key={index} marginRight={2}>
                  <Text 
                    color={theme.colors.primary} 
                    underline 
                    onPress={action.action}
                  >
                    {action.label}
                  </Text>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Transition>
    );
  };

  return (
    <Box flexDirection="column" position="absolute" right={1} top={1} width={60}>
      {notifications.map(renderNotification)}
    </Box>
  );
};

export default NotificationContext;