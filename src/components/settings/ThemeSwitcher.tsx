import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { useTheme, getTheme, ThemeProvider } from '../../themes';
import { CustomBox } from '../common/Box';
import { useAppContext } from '../../context/AppContext';

interface ThemeOption {
  label: string;
  value: string;
  description: string;
}

interface ThemeSwitcherProps {
  onBack: () => void;
  onThemeChange?: (theme: string) => void;
}

const themeOptions: ThemeOption[] = [
  {
    label: '🌞 Base Theme',
    value: 'base',
    description: 'Default light theme with Salesforce colors'
  },
  {
    label: '🌙 Dark Theme',
    value: 'dark',
    description: 'Dark theme for low-light environments'
  },
  {
    label: '🔍 High Contrast',
    value: 'highContrast',
    description: 'Enhanced contrast for better accessibility'
  },
  {
    label: '⚡ Salesforce Lightning',
    value: 'salesforce',
    description: 'Official Salesforce Lightning color scheme'
  }
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ onBack, onThemeChange }) => {
  const { state, setTheme } = useAppContext();
  const [selectedTheme, setSelectedTheme] = useState<string>(state.themeName);
  const [previewTheme, setPreviewTheme] = useState<string>(state.themeName);
  const theme = useTheme();

  // Handle Escape key to go back
  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  // Apply the selected theme when it changes
  useEffect(() => {
    if (onThemeChange) {
      onThemeChange(selectedTheme);
    }
    setTheme(selectedTheme);
  }, [selectedTheme, onThemeChange, setTheme]);

  const handleThemeSelect = (item: { value: string }) => {
    setSelectedTheme(item.value);
  };

  // Preview a theme on hover without selecting it
  const handleHighlight = (item: { value: string }) => {
    setPreviewTheme(item.value);
  };

  // Create a preview box to show theme colors
  const ThemePreview = ({ themeName }: { themeName: string }) => {
    const previewTheme = getTheme(themeName);
    
    return (
      <ThemeProvider theme={previewTheme}>
        <CustomBox title="Theme Preview" borderStyle="round" padding={1} width={40}>
          <Box flexDirection="column">
            <Text>Primary: <Text color={previewTheme.colors.primary}>■■■</Text></Text>
            <Text>Secondary: <Text color={previewTheme.colors.secondary}>■■■</Text></Text>
            <Text>Success: <Text color={previewTheme.colors.success}>■■■</Text></Text>
            <Text>Warning: <Text color={previewTheme.colors.warning}>■■■</Text></Text>
            <Text>Error: <Text color={previewTheme.colors.error}>■■■</Text></Text>
            <Text>Info: <Text color={previewTheme.colors.info}>■■■</Text></Text>
            <Text>Text: <Text color={previewTheme.colors.text}>■■■</Text></Text>
            <Text>Border: <Text color={previewTheme.colors.border}>■■■</Text></Text>
          </Box>
        </CustomBox>
      </ThemeProvider>
    );
  };

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold>Theme Settings</Text>
      </Box>
      
      <Box flexDirection="row" gap={2}>
        <Box flexDirection="column" width="50%">
          <Text bold>Select a Theme</Text>
          <SelectInput
            items={themeOptions}
            onSelect={handleThemeSelect}
            onHighlight={handleHighlight}
            itemComponent={({ isSelected, label, item }: { isSelected: boolean, label: string, item: ThemeOption }) => (
              <Box>
                <Text color={isSelected ? theme.colors.primary : theme.colors.text}>{label}</Text>
                <Text> </Text>
                <Text color="gray">{item.description}</Text>
              </Box>
            )}
          />
        </Box>
        
        <Box width="50%">
          <ThemePreview themeName={previewTheme} />
        </Box>
      </Box>
      
      <Box marginTop={1}>
        <Text>Current theme: <Text bold>{selectedTheme}</Text></Text>
      </Box>
      
      <Box marginTop={1}>
        <Text color="gray" italic>
          Press Esc to go back
        </Text>
      </Box>
    </Box>
  );
};

export default ThemeSwitcher;