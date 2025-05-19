import React, { useState } from 'react';
import { Box, useApp } from 'ink';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider, getTheme } from './themes';
import { KeyboardProvider, ShortcutAction } from './context/KeyboardShortcuts';
import { HelpProvider, ContextualHelp } from './context/HelpContext';
import { NotificationProvider, NotificationCenter } from './context/NotificationContext';
import Tutorial from './components/tutorial/Tutorial';
import MainMenu from './components/MainMenu';
import StatusBar from './components/common/StatusBar';
import HelpScreen from './components/common/HelpScreen';
import { ErrorProvider } from './components/common';

// AppContent component that uses the context
const AppContent: React.FC = () => {
  const { state, setTheme, toggleStatusBar, toggleHelp } = useAppContext();
  const [showHelp, setShowHelp] = useState(false);
  const { exit } = useApp();
  
  // Available themes in order
  const availableThemes = ['base', 'dark', 'highContrast', 'salesforce'];
  
  // Action handlers for keyboard shortcuts
  const actionHandlers: {[key in ShortcutAction]?: () => void} = {
    help: () => setShowHelp(true),
    quit: () => exit(),
    toggleStatusBar: () => toggleStatusBar(),
    toggleTheme: () => {
      const currentIndex = availableThemes.indexOf(state.themeName);
      const nextIndex = (currentIndex + 1) % availableThemes.length;
      setTheme(availableThemes[nextIndex]);
    },
  };
  
  return (
    <KeyboardProvider actionHandlers={actionHandlers}>
      <ThemeProvider theme={state.theme}>
        <HelpProvider>
          <NotificationProvider>
            <ErrorProvider position="top" maxVisibleErrors={2}>
              <Box flexDirection="column" height="100%">
                <Box flexGrow={1}>
                  <Tutorial>
                    {showHelp ? (
                      <HelpScreen onClose={() => setShowHelp(false)} />
                    ) : (
                      <>
                        <MainMenu />
                        <ContextualHelp />
                        <NotificationCenter />
                      </>
                    )}
                  </Tutorial>
                </Box>
                
                {state.showStatusBar && (
                  <StatusBar />
                )}
              </Box>
            </ErrorProvider>
          </NotificationProvider>
        </HelpProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
};

// Main App component that provides the context
const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;