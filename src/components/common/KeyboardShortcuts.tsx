≈import React from 'react';
import { Box, Text, useInput } from 'ink';

type Shortcut = {
  key: string;
  description: string;
};

type KeyboardShortcutsProps = {
  shortcuts: Shortcut[];
  visible?: boolean;
  onClose?: () => void;
};

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts,
  visible = false,
  onClose,
}) => {
  // Close on '?' press when visible
  useInput((input, key) => {
    if (visible && (input === '?' || key.escape) && onClose) {
      onClose();
    }
  });

  if (!visible) return null;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box 
        flexDirection="column" 
        borderStyle="round" 
        borderColor="cyan"
        padding={1}
      >
        <Text bold>Keyboard Shortcuts</Text>
      <Box flexDirection="column" marginTop={1}>
        {shortcuts.map((shortcut, index) => (
          <Box key={index}>
            <Text color="cyan" bold>{shortcut.key.padEnd(10)}</Text>
            <Text> {shortcut.description}</Text>
          </Box>
        ))}
      </Box>
        <Text color="gray" italic>
          Press ESC or ? to close
        </Text>
      </Box>
    </Box>
  );
};

export default KeyboardShortcuts;
