import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import ThemeSwitcher from './ThemeSwitcher';
import KeyboardShortcutsEditor from './KeyboardShortcutsEditor';
import { useTheme, ThemeProvider, getTheme } from '../../themes';
import { ErrorBoundary } from '../common';

interface SettingsMenuItem {
  label: string;
  value: string;
  description: string;
}

interface SettingsMenuProps {
  onBack: () => void;
}

const menuItems: SettingsMenuItem[] = [
  {
    label: '🎨 Theme Settings',
    value: 'theme',
    description: 'Customize the application theme'
  },
  {
    label: '⌨️  Keyboard Shortcuts',
    value: 'shortcuts',
    description: 'View and customize keyboard shortcuts'
  },
  {
    label: '🔄 Back to Main Menu',
    value: 'back',
    description: 'Return to the main menu'
  }
];

export const SettingsMenu: React.FC<SettingsMenuProps> = ({ onBack }) => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [currentTheme, setCurrentTheme] = useState<string>('base');
  const theme = useTheme();

  // Handle Escape key to go back
  useInput((input, key) => {
    if (key.escape) {
      if (selectedItem) {
        setSelectedItem(null);
      } else {
        onBack();
      }
    }
  });

  const handleThemeChange = (newTheme: string) => {
    setCurrentTheme(newTheme);
  };

  // Render content based on selected menu item
  const renderContent = () => {
    if (!selectedItem) {
      return (
        <Box flexDirection="column">
          <Text bold>Settings</Text>
          <Box marginY={1}>
            <Text>Configure application preferences and appearance</Text>
          </Box>
          
          <SelectInput
            items={menuItems}
            onSelect={(item) => {
              if (item.value === 'back') {
                onBack();
              } else {
                setSelectedItem(item.value);
              }
            }}
            itemComponent={({ isSelected, label, item }: { isSelected: boolean, label: string, item: SettingsMenuItem }) => (
              <Box>
                <Text color={isSelected ? theme.colors.primary : theme.colors.text}>{label}</Text>
                <Text> </Text>
                <Text color="gray">{item.description}</Text>
              </Box>
            )}
          />
          
          <Box marginTop={1}>
            <Text color="gray" italic>
              Press Esc to go back
            </Text>
          </Box>
        </Box>
      );
    }

    // Theme Settings
    if (selectedItem === 'theme') {
      return (
        <ThemeProvider theme={getTheme(currentTheme)}>
          <ThemeSwitcher 
            onBack={() => setSelectedItem(null)} 
            onThemeChange={handleThemeChange}
          />
        </ThemeProvider>
      );
    }

    // Keyboard Shortcuts Editor
    if (selectedItem === 'shortcuts') {
      return (
        <KeyboardShortcutsEditor 
          onBack={() => setSelectedItem(null)} 
        />
      );
    }

    return null;
  };

  return (
    <ErrorBoundary componentName="SettingsMenu">
      <Box flexDirection="column" padding={1}>
        {renderContent()}
      </Box>
    </ErrorBoundary>
  );
};

export default SettingsMenu;