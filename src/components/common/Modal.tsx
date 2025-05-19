import React, { useCallback, useEffect } from 'react';
import { Box, Text, useFocus, useInput } from 'ink';
import { useTheme } from '../../themes';
import Button from './Button';

type ModalProps = {
  /**
   * Whether the modal is open
   * @default false
   */
  isOpen?: boolean;
  
  /**
   * Modal title
   */
  title: string;
  
  /**
   * Modal content
   */
  children: React.ReactNode;
  
  /**
   * Width of the modal
   * @default 60
   */
  width?: number;
  
  /**
   * Height of the modal
   */
  height?: number | 'auto';
  
  /**
   * Whether to show a close button
   * @default true
   */
  showCloseButton?: boolean;
  
  /**
   * Label for the close button
   * @default 'Close'
   */
  closeButtonLabel?: string;
  
  /**
   * Whether to show a backdrop
   * @default true
   */
  showBackdrop?: boolean;
  
  /**
   * Callback when the modal is closed
   */
  onClose?: () => void;
  
  /**
   * Additional styles for the modal container
   */
  style?: React.CSSProperties;
  
  /**
   * Additional props for the modal content
   */
  contentProps?: React.ComponentProps<typeof Box>;
};

/**
 * A modal dialog component for the TUI
 */
const Modal: React.FC<ModalProps> = ({
  isOpen = false,
  title,
  children,
  width = 60,
  height = 'auto',
  showCloseButton = true,
  closeButtonLabel = 'Close',
  showBackdrop = true,
  onClose,
  style = {},
  contentProps = {},
}) => {
  const theme = useTheme();
  
  // Handle escape key to close modal
  useInput(
    (input, key) => {
      if (key.escape && onClose) {
        onClose();
      }
    },
    { isActive: isOpen }
  );
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      // Add any necessary side effects when modal opens
      return () => {
        // Cleanup when modal closes
      };
    }
  }, [isOpen]);
  
  // Don't render if not open
  if (!isOpen) return null;
  
  // Calculate modal position and dimensions
  const modalStyles: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: `${width}%`,
    maxWidth: '90%',
    minHeight: typeof height === 'number' ? `${height}%` : 'auto',
    maxHeight: '90%',
    backgroundColor: theme.colors.background,
    borderStyle: 'single',
    borderColor: theme.colors.border,
    flexDirection: 'column',
    ...style,
  };
  
  // Backdrop styles
  const backdropStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };
  
  // Header styles
  const headerStyles: React.CSSProperties = {
    borderBottomStyle: 'single',
    borderBottomColor: theme.colors.border,
    paddingX: 1,
    paddingY: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 3,
  };
  
  // Content styles
  const contentStyles: React.CSSProperties = {
    padding: 1,
    flexGrow: 1,
    overflow: 'hidden',
  };
  
  // Footer styles
  const footerStyles: React.CSSProperties = {
    borderTopStyle: 'single',
    borderTopColor: theme.colors.border,
    padding: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: 4,
  };
  
  return (
    <Box {...(showBackdrop ? { style: backdropStyles } : {})}>
      <Box style={modalStyles}>
        {/* Header */}
        <Box style={headerStyles}>
          <Text bold>{title}</Text>
          {showCloseButton && onClose && (
            <Button 
              variant="text" 
              onPress={onClose}
              style={{ padding: 0, height: 1 }}
            >
              ✕
            </Button>
          )}
        </Box>
        
        {/* Content */}
        <Box {...contentProps} style={{ ...contentStyles, ...contentProps.style }}>
          {children}
        </Box>
        
        {/* Footer */}
        <Box style={footerStyles}>
          {onClose && (
            <Button 
              variant="secondary" 
              onPress={onClose}
            >
              {closeButtonLabel}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Modal;
