import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../../themes';
import { useKeyboardShortcuts, Shortcut } from '../../context/KeyboardShortcuts';
import { CustomBox } from './Box';

interface HelpScreenProps {
  onClose: () => void;
  title?: string;
}

export const HelpScreen: React.FC<HelpScreenProps> = ({ 
  onClose,
  title = 'Keyboard Shortcuts'
}) => {
  const theme = useTheme();
  const { activeShortcuts } = useKeyboardShortcuts();
  
  // Group shortcuts by section
  const globalShortcuts = activeShortcuts.filter(s => s.global);
  const contextShortcuts = activeShortcuts.filter(s => !s.global);
  
  // Handle ESC key to close
  useInput((input, key) => {
    if (key.escape || input === 'q') {
      onClose();
    }
  });
  
  // Render a shortcut row
  const renderShortcut = (shortcut: Shortcut) => {
    const keyText = [
      shortcut.ctrl ? 'Ctrl+' : '',
      shortcut.alt ? 'Alt+' : '',
      shortcut.shift ? 'Shift+' : '',
      shortcut.key.toUpperCase()
    ].join('');
    
    return (
      <Box key={shortcut.action} marginY={0}>
        <Box width={16}>
          <Text bold color={theme.colors.primary}>{keyText}</Text>
        </Box>
        <Box>
          <Text>{shortcut.description}</Text>
        </Box>
      </Box>
    );
  };
  
  return (
    <CustomBox 
      title={title}
      borderStyle="round"
      borderColor={theme.colors.primary}
      padding={1}
      width={60}
    >
      <Box flexDirection="column">
        {globalShortcuts.length > 0 && (
          <>
            <Text bold>Global Shortcuts</Text>
            <Box flexDirection="column" marginY={1}>
              {globalShortcuts.map(renderShortcut)}
            </Box>
          </>
        )}
        
        {contextShortcuts.length > 0 && (
          <>
            <Text bold>Context Shortcuts</Text>
            <Box flexDirection="column" marginY={1}>
              {contextShortcuts.map(renderShortcut)}
            </Box>
          </>
        )}
        
        <Box marginTop={1}>
          <Text color="gray" italic>Press ESC or q to close</Text>
        </Box>
      </Box>
    </CustomBox>
  );
};

export default HelpScreen;