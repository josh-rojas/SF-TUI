import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { useTheme } from '../../themes';
import { ShortcutAction, Shortcut } from '../../context/KeyboardShortcuts';
import { config } from '../../config';
import { useKeyboardShortcuts } from '../../context/KeyboardShortcuts';
import { TextInput, Modal, ConfirmDialog } from '../common';

interface KeyboardShortcutsEditorProps {
  onBack: () => void;
}

interface ShortcutItem {
  label: string;
  value: string;
  shortcut: Shortcut;
}

// Helper function to format key display
const formatKeyDisplay = (shortcut: Shortcut): string => {
  const parts = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.shift) parts.push('Shift');
  
  // Format special keys
  let key = shortcut.key;
  if (key === 'escape') key = 'Esc';
  else if (key === 'return') key = 'Enter';
  else if (key === 'space') key = 'Space';
  
  parts.push(key.length === 1 ? key.toUpperCase() : key);
  
  return parts.join('+');
};

// Action descriptions for better UI
const actionDescriptions: Record<ShortcutAction, string> = {
  help: 'Show help screen',
  back: 'Go back/cancel',
  quit: 'Quit the application',
  toggleStatusBar: 'Show/hide status bar',
  toggleTheme: 'Switch between themes',
  refresh: 'Refresh current view',
  save: 'Save changes',
  create: 'Create new item',
  delete: 'Delete selected item',
  search: 'Search',
  navigate: 'Navigate'
};

export const KeyboardShortcutsEditor: React.FC<KeyboardShortcutsEditorProps> = ({ onBack }) => {
  const { shortcuts } = useKeyboardShortcuts();
  const theme = useTheme();
  const [shortcutsList, setShortcutsList] = useState<ShortcutItem[]>([]);
  const [selectedShortcut, setSelectedShortcut] = useState<Shortcut | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [isCtrl, setIsCtrl] = useState(false);
  const [isAlt, setIsAlt] = useState(false);
  const [isShift, setIsShift] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [listeningForKey, setListeningForKey] = useState(false);
  
  // Initialize shortcuts list
  useEffect(() => {
    loadShortcuts();
  }, [shortcuts]);
  
  // Load shortcuts from config
  const loadShortcuts = () => {
    const customShortcuts = config.get('keyboardShortcuts') || {};
    
    // Combine default shortcuts with user customizations
    const combinedShortcuts = {
      ...shortcuts,
      ...customShortcuts
    };
    
    const items = Object.entries(combinedShortcuts).map(([id, shortcut]) => ({
      label: `${actionDescriptions[shortcut.action] || shortcut.action}`,
      value: id,
      shortcut
    }));
    
    setShortcutsList(items);
  };

  // Handle key presses
  useInput((input, key) => {
    if (listeningForKey) {
      // When listening for a new key binding
      if (key.escape) {
        setListeningForKey(false);
        return;
      }
      
      // Capture the pressed key
      let capturedKey = '';
      if (key.return) capturedKey = 'return';
      else if (key.escape) capturedKey = 'escape';
      else if (key.tab) capturedKey = 'tab';
      else if (key.backspace) capturedKey = 'backspace';
      else if (key.delete) capturedKey = 'delete';
      else if (key.upArrow) capturedKey = 'up';
      else if (key.downArrow) capturedKey = 'down';
      else if (key.leftArrow) capturedKey = 'left';
      else if (key.rightArrow) capturedKey = 'right';
      else if (key.meta) capturedKey = 'meta';
      else if (key.space) capturedKey = 'space';
      else if (input) capturedKey = input;
      
      if (capturedKey) {
        setNewKey(capturedKey);
        setIsCtrl(key.ctrl);
        setIsAlt(key.alt);
        setIsShift(key.shift);
        setListeningForKey(false);
        setIsEditing(true);
      }
      
      return;
    }
    
    if (isEditing) {
      if (key.escape) {
        setIsEditing(false);
        return;
      }
      
      if (key.return) {
        saveShortcut();
        return;
      }
      
      // Toggle modifier keys
      if (input === 'c') {
        setIsCtrl(!isCtrl);
        return;
      }
      
      if (input === 'a') {
        setIsAlt(!isAlt);
        return;
      }
      
      if (input === 's') {
        setIsShift(!isShift);
        return;
      }
      
      return;
    }
    
    if (showConfirm) {
      return;
    }
    
    if (selectedShortcut && !isEditing) {
      if (input === 'k') {
        startKeyCapture();
        return;
      }
    }
    
    // Handle reset shortcut keys
    if (input === 'r' && !selectedShortcut) {
      resetToDefaults();
      return;
    }
    
    if (key.escape) {
      if (selectedShortcut) {
        setSelectedShortcut(null);
      } else {
        onBack();
      }
    }
  });

  // Save the shortcut changes
  const saveShortcut = () => {
    if (!selectedShortcut) return;
    
    // Check for conflicts
    const conflictingShortcut = shortcutsList.find(item => 
      item.shortcut.key === newKey && 
      item.shortcut.ctrl === isCtrl && 
      item.shortcut.alt === isAlt && 
      item.shortcut.shift === isShift &&
      item.shortcut.action !== selectedShortcut.action
    );
    
    if (conflictingShortcut) {
      setConfirmMessage(`This key combination is already used for "${actionDescriptions[conflictingShortcut.shortcut.action]}". Override?`);
      setShowConfirm(true);
      return;
    }
    
    // Apply the changes
    applyShortcutChange();
  };

  // Apply the new shortcut
  const applyShortcutChange = () => {
    if (!selectedShortcut) return;
    
    // Create updated shortcut
    const updatedShortcut: Shortcut = {
      ...selectedShortcut,
      key: newKey,
      ctrl: isCtrl,
      alt: isAlt,
      shift: isShift
    };
    
    // Get current custom shortcuts
    const customShortcuts = config.get('keyboardShortcuts') || {};
    
    // Update the custom shortcuts
    const updatedCustomShortcuts = {
      ...customShortcuts,
      [selectedShortcut.action]: updatedShortcut
    };
    
    // Save to config
    config.set('keyboardShortcuts', updatedCustomShortcuts);
    
    // Update the UI list
    const updatedList = shortcutsList.map(item => {
      if (item.shortcut.action === selectedShortcut.action) {
        return {
          ...item,
          shortcut: updatedShortcut
        };
      }
      return item;
    });
    
    setShortcutsList(updatedList);
    setIsEditing(false);
    setShowConfirm(false);
  };

  // Handle selection of a shortcut to edit
  const handleSelectShortcut = (item: ShortcutItem) => {
    setSelectedShortcut(item.shortcut);
    setNewKey(item.shortcut.key);
    setIsCtrl(!!item.shortcut.ctrl);
    setIsAlt(!!item.shortcut.alt);
    setIsShift(!!item.shortcut.shift);
  };

  // Start the key capture mode
  const startKeyCapture = () => {
    setListeningForKey(true);
  };

  // Reset all shortcuts to defaults
  const resetToDefaults = () => {
    // Clear all custom shortcuts
    config.set('keyboardShortcuts', {});
    
    // Reload the shortcuts list
    loadShortcuts();
    
    // Show a confirmation message
    setConfirmMessage('All keyboard shortcuts have been reset to default values.');
    setShowConfirm(true);
  };

  // Render shortcut list
  const renderShortcutsList = () => {
    return (
      <Box flexDirection="column">
        <Text bold>Keyboard Shortcuts</Text>
        <Box marginY={1}>
          <Text>Select a shortcut to customize</Text>
        </Box>
        
        <SelectInput
          items={shortcutsList}
          onSelect={handleSelectShortcut}
          itemComponent={({ isSelected, label, item }: { isSelected: boolean, label: string, item: ShortcutItem }) => (
            <Box>
              <Text color={isSelected ? theme.colors.primary : theme.colors.text}>
                {label}
              </Text>
              <Text> </Text>
              <Text color={theme.colors.secondary}>
                {formatKeyDisplay(item.shortcut)}
              </Text>
            </Box>
          )}
        />
        
        <Box marginY={1} flexDirection="column">
          <Text>Press </Text>
          <Text color={theme.colors.secondary}>r</Text>
          <Text> to reset all shortcuts to defaults</Text>
        </Box>
        
        <Box marginTop={1}>
          <Text color="gray" italic>
            Press Esc to go back
          </Text>
        </Box>
      </Box>
    );
  };

  // Render shortcut editor
  const renderShortcutEditor = () => {
    if (!selectedShortcut) return null;
    
    return (
      <Box flexDirection="column">
        <Text bold>Edit Shortcut: {actionDescriptions[selectedShortcut.action]}</Text>
        
        <Box marginY={1} flexDirection="column">
          <Box marginBottom={1}>
            <Text>Current: </Text>
            <Text color={theme.colors.secondary}>{formatKeyDisplay(selectedShortcut)}</Text>
          </Box>
          
          {isEditing ? (
            <>
              <Box marginBottom={1}>
                <Text>New: </Text>
                <Text color={theme.colors.primary}>
                  {isCtrl ? 'Ctrl+' : ''}
                  {isAlt ? 'Alt+' : ''}
                  {isShift ? 'Shift+' : ''}
                  {newKey.length === 1 ? newKey.toUpperCase() : newKey}
                </Text>
              </Box>
              
              <Box marginY={1} flexDirection="column">
                <Box marginBottom={1}>
                  <Text bold>Modifier keys:</Text>
                </Box>
                <Box marginLeft={2} flexDirection="column">
                  <Box>
                    <Text color={isCtrl ? theme.colors.primary : theme.colors.text}>
                      [x] Ctrl
                    </Text>
                    <Text> - Press </Text>
                    <Text color={theme.colors.secondary}>c</Text>
                    <Text> to toggle</Text>
                  </Box>
                  <Box>
                    <Text color={isAlt ? theme.colors.primary : theme.colors.text}>
                      [x] Alt
                    </Text>
                    <Text> - Press </Text>
                    <Text color={theme.colors.secondary}>a</Text>
                    <Text> to toggle</Text>
                  </Box>
                  <Box>
                    <Text color={isShift ? theme.colors.primary : theme.colors.text}>
                      [x] Shift
                    </Text>
                    <Text> - Press </Text>
                    <Text color={theme.colors.secondary}>s</Text>
                    <Text> to toggle</Text>
                  </Box>
                </Box>
              </Box>
              
              <Box marginTop={2} flexDirection="column">
                <Text>Press </Text>
                <Text color={theme.colors.secondary}>Enter</Text>
                <Text> to save or </Text>
                <Text color={theme.colors.secondary}>Esc</Text>
                <Text> to cancel</Text>
              </Box>
            </>
          ) : (
            <Box marginTop={1} flexDirection="column">
              <Text>Press </Text>
              <Text color={theme.colors.secondary}>k</Text>
              <Text> to assign a new key, or </Text>
              <Text color={theme.colors.secondary}>Esc</Text>
              <Text> to go back</Text>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  // Render the component based on state
  if (showConfirm) {
    return (
      <ConfirmDialog
        message={confirmMessage}
        onConfirm={() => {
          applyShortcutChange();
        }}
        onCancel={() => {
          setShowConfirm(false);
        }}
      />
    );
  }

  if (listeningForKey) {
    return (
      <Modal title="Capturing Keyboard Input">
        <Box flexDirection="column" alignItems="center" padding={1}>
          <Text>Press any key or key combination</Text>
          <Text color="gray">(Esc to cancel)</Text>
        </Box>
      </Modal>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      {selectedShortcut ? renderShortcutEditor() : renderShortcutsList()}
    </Box>
  );
};

export default KeyboardShortcutsEditor;