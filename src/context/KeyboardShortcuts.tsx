import React, { createContext, useContext, useState, useEffect } from 'react';
import { useInput } from 'ink';
import { config } from '../config';

// Define shortcut types
export type ShortcutAction = 
  | 'help' 
  | 'back' 
  | 'quit' 
  | 'toggleStatusBar' 
  | 'toggleTheme'
  | 'refresh'
  | 'save'
  | 'create'
  | 'delete'
  | 'search'
  | 'navigate';

export interface Shortcut {
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  shift?: boolean;
  description: string;
  action: ShortcutAction;
  global?: boolean;
}

export interface ShortcutConfig {
  [key: string]: Shortcut;
}

interface KeyboardContextType {
  shortcuts: ShortcutConfig;
  activeShortcuts: Shortcut[];
  registerShortcut: (id: string, shortcut: Shortcut) => void;
  unregisterShortcut: (id: string) => void;
  setContextShortcuts: (shortcuts: Shortcut[]) => void;
  executeAction: (action: ShortcutAction) => void;
}

// Default global shortcuts
const defaultShortcuts: ShortcutConfig = {
  'help': {
    key: '?',
    description: 'Show help',
    action: 'help',
    global: true
  },
  'quit': {
    key: 'q',
    ctrl: true,
    description: 'Quit application',
    action: 'quit',
    global: true
  },
  'back': {
    key: 'escape',
    description: 'Go back',
    action: 'back',
    global: true
  },
  'toggleStatusBar': {
    key: 's',
    ctrl: true,
    description: 'Toggle status bar',
    action: 'toggleStatusBar',
    global: true
  },
  'toggleTheme': {
    key: 't',
    ctrl: true,
    description: 'Cycle themes',
    action: 'toggleTheme',
    global: true
  }
};

// Create context
const KeyboardContext = createContext<KeyboardContextType>({
  shortcuts: defaultShortcuts,
  activeShortcuts: [],
  registerShortcut: () => {},
  unregisterShortcut: () => {},
  setContextShortcuts: () => {},
  executeAction: () => {}
});

// Action handlers must be registered by the parent component
interface KeyboardProviderProps {
  children: React.ReactNode;
  actionHandlers: {
    [key in ShortcutAction]?: () => void;
  };
}

export const KeyboardProvider: React.FC<KeyboardProviderProps> = ({ 
  children, 
  actionHandlers 
}) => {
  // Get custom shortcuts from config
  const customShortcuts = config.get<ShortcutConfig>('keyboardShortcuts') || {};
  
  // Merge default shortcuts with custom ones
  const mergedDefaultShortcuts = { ...defaultShortcuts };
  Object.entries(customShortcuts).forEach(([action, shortcut]) => {
    if (mergedDefaultShortcuts[action]) {
      mergedDefaultShortcuts[action] = { 
        ...mergedDefaultShortcuts[action], 
        ...shortcut,
        // Ensure action and description are preserved
        action: mergedDefaultShortcuts[action].action,
        description: mergedDefaultShortcuts[action].description
      };
    }
  });
  
  const [shortcuts, setShortcuts] = useState<ShortcutConfig>(mergedDefaultShortcuts);
  const [contextShortcuts, setContextShortcuts] = useState<Shortcut[]>([]);
  
  // Combine global shortcuts with context-specific ones
  const activeShortcuts = [
    ...Object.values(shortcuts).filter(s => s.global),
    ...contextShortcuts
  ];
  
  // Update shortcuts when config changes
  useEffect(() => {
    const updatedCustomShortcuts = config.get<ShortcutConfig>('keyboardShortcuts') || {};
    
    // Update shortcuts with any changed custom shortcuts
    const updatedShortcuts = { ...shortcuts };
    Object.entries(updatedCustomShortcuts).forEach(([action, shortcut]) => {
      if (updatedShortcuts[action]) {
        updatedShortcuts[action] = { 
          ...updatedShortcuts[action], 
          ...shortcut,
          // Ensure action and description are preserved
          action: updatedShortcuts[action].action,
          description: updatedShortcuts[action].description
        };
      }
    });
    
    setShortcuts(updatedShortcuts);
  }, []);

  // Register a new shortcut
  const registerShortcut = (id: string, shortcut: Shortcut) => {
    setShortcuts(prev => ({
      ...prev,
      [id]: shortcut
    }));
  };

  // Unregister a shortcut
  const unregisterShortcut = (id: string) => {
    setShortcuts(prev => {
      const newShortcuts = { ...prev };
      delete newShortcuts[id];
      return newShortcuts;
    });
  };

  // Change context-specific shortcuts
  const updateContextShortcuts = (newShortcuts: Shortcut[]) => {
    setContextShortcuts(newShortcuts);
  };

  // Execute action for a shortcut
  const executeAction = (action: ShortcutAction) => {
    const handler = actionHandlers[action];
    if (handler) {
      handler();
    }
  };

  // Handle keyboard input
  useInput((input, key) => {
    // Check if the key combination matches any active shortcuts
    for (const shortcut of activeShortcuts) {
      const matchesKey = 
        shortcut.key === input || 
        shortcut.key === key.name ||
        (shortcut.key === 'escape' && key.escape);
      
      const matchesModifiers = 
        (shortcut.ctrl === undefined || shortcut.ctrl === key.ctrl) &&
        (shortcut.alt === undefined || shortcut.alt === key.alt) &&
        (shortcut.shift === undefined || shortcut.shift === key.shift);
      
      if (matchesKey && matchesModifiers) {
        executeAction(shortcut.action);
        return;
      }
    }
  });

  return (
    <KeyboardContext.Provider
      value={{
        shortcuts,
        activeShortcuts,
        registerShortcut,
        unregisterShortcut,
        setContextShortcuts: updateContextShortcuts,
        executeAction
      }}
    >
      {children}
    </KeyboardContext.Provider>
  );
};

// Hook to use keyboard context
export const useKeyboardShortcuts = () => {
  const context = useContext(KeyboardContext);
  if (!context) {
    throw new Error('useKeyboardShortcuts must be used within a KeyboardProvider');
  }
  return context;
};

export default KeyboardContext;