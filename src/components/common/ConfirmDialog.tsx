import React, { useCallback, useMemo } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';
import Button from './Button';
import Modal from './Modal';

type ConfirmDialogProps = {
  /**
   * Whether the dialog is open
   * @default false
   */
  isOpen?: boolean;
  
  /**
   * Dialog title
   * @default 'Confirm'
   */
  title?: string;
  
  /**
   * The confirmation message to display
   */
  message: string | React.ReactNode;
  
  /**
   * Label for the confirm button
   * @default 'Confirm'
   */
  confirmLabel?: string;
  
  /**
   * Label for the cancel button
   * @default 'Cancel'
   */
  cancelLabel?: string;
  
  /**
   * Variant for the confirm button
   * @default 'primary'
   */
  confirmVariant?: 'primary' | 'danger' | 'success' | 'warning' | 'info' | 'default';
  
  /**
   * Variant for the cancel button
   * @default 'default'
   */
  cancelVariant?: 'primary' | 'danger' | 'success' | 'warning' | 'info' | 'default';
  
  /**
   * Whether to show the cancel button
   * @default true
   */
  showCancel?: boolean;
  
  /**
   * Whether the dialog should close when clicking the backdrop
   * @default true
   */
  closeOnBackdropClick?: boolean;
  
  /**
   * Callback when the dialog is confirmed
   */
  onConfirm: () => void;
  
  /**
   * Callback when the dialog is cancelled or closed
   */
  onCancel: () => void;
  
  /**
   * Additional styles for the dialog container
   */
  style?: React.CSSProperties;
};

/**
 * A confirmation dialog component for the TUI
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen = false,
  title = 'Confirm',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  cancelVariant = 'default',
  showCancel = true,
  closeOnBackdropClick = true,
  onConfirm,
  onCancel,
  style = {},
}) => {
  const theme = useTheme();
  
  // Handle confirm action
  const handleConfirm = useCallback(() => {
    onConfirm();
  }, [onConfirm]);
  
  // Handle cancel action
  const handleCancel = useCallback(() => {
    onCancel();
  }, [onCancel]);
  
  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (closeOnBackdropClick) {
      onCancel();
    }
  }, [closeOnBackdropClick, onCancel]);
  
  // Footer with action buttons
  const footer = useMemo(() => (
    <Box justifyContent="flex-end" gap={1}>
      {showCancel && (
        <Button 
          variant={cancelVariant} 
          onPress={handleCancel}
        >
          {cancelLabel}
        </Button>
      )}
      <Button 
        variant={confirmVariant} 
        onPress={handleConfirm}
      >
        {confirmLabel}
      </Button>
    </Box>
  ), [
    showCancel, 
    cancelVariant, 
    cancelLabel, 
    confirmVariant, 
    confirmLabel, 
    handleCancel, 
    handleConfirm
  ]);
  
  // Content with message
  const content = useMemo(() => (
    <Box flexDirection="column" gap={1}>
      {typeof message === 'string' ? (
        <Text>{message}</Text>
      ) : (
        message
      )}
    </Box>
  ), [message]);
  
  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={handleCancel}
      style={style}
      showBackdrop={true}
      showCloseButton={false}
    >
      <Box flexDirection="column" gap={2}>
        {content}
        {footer}
      </Box>
    </Modal>
  );
};

export default ConfirmDialog;
