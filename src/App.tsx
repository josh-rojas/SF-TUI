import React, { useState, useEffect } from 'react';
import { Box, useApp } from 'ink';
import { AppProvider, useAppContext } from './context/AppContext';
import { ThemeProvider } from './themes';
import { KeyboardProvider, ShortcutAction } from './context/KeyboardShortcuts';
import { HelpProvider, ContextualHelp } from './context/HelpContext';
import { NotificationProvider, NotificationCenter } from './context/NotificationContext';
import Tutorial from './components/tutorial/Tutorial';
import MainMenu from './components/MainMenu';
import StatusBar from './components/common/StatusBar';
import HelpScreen from './components/common/HelpScreen';
import { ErrorProvider } from './components/common';
import SplashScreen from './components/SplashScreen';
import { FirstTimeWizardWithErrorBoundary } from './components/FirstTimeWizard';
import { loadConfig, markFirstRunComplete } from './utils/config';
import { logger } from './utils/logger';
import ErrorBoundary from './components/common/ErrorBoundary';

type AppView = 'splash' | 'wizard' | 'main';

const AppContent: React.FC = () => {
  const { state, setTheme, toggleStatusBar } = useAppContext();
  const [showHelp, setShowHelp] = useState(false);
  const { exit } = useApp();
  const [view, setView] = useState<AppView>('splash');
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    if (view === 'splash') {
      // The SplashScreen's onComplete will trigger the next step
    } else if (view === 'main' && !config) {
      // This is the path taken after the splash screen
      const initialize = async () => {
        try {
          const loadedConfig = await loadConfig();
          setConfig(loadedConfig);
          if (loadedConfig.firstRun) {
            logger.info('First run detected, showing welcome wizard');
            setView('wizard');
          } else {
            logger.info('Returning user detected, showing main menu');
          }
        } catch (error) {
          logger.error('Error initializing application', { error });
          // Fallback to main menu if there's an error loading config
        }
      };
      initialize();
    }
  }, [view, config]);

  const handleSplashComplete = () => {
    setView('main');
  };

  const handleWizardComplete = async (wizardData: any) => {
    await markFirstRunComplete({
      fullName: wizardData.user.fullName,
      defaultOrg: wizardData.user.defaultOrg,
      enableAnalytics: wizardData.user.enableAnalytics,
      theme: wizardData.user.theme,
    });
    const newConfig = await loadConfig();
    setConfig(newConfig);
    setView('main');
  };

  const availableThemes = ['base', 'dark', 'highContrast', 'salesforce'];

  const actionHandlers: { [key in ShortcutAction]?: () => void } = {
    help: () => setShowHelp(!showHelp),
    quit: () => exit(),
    toggleStatusBar: () => toggleStatusBar(),
    toggleTheme: () => {
      const currentIndex = availableThemes.indexOf(state.themeName);
      const nextIndex = (currentIndex + 1) % availableThemes.length;
      setTheme(availableThemes[nextIndex]);
    },
  };

  const renderContent = () => {
    if (showHelp) {
      return <HelpScreen onClose={() => setShowHelp(false)} />;
    }
    switch (view) {
      case 'splash':
        return <SplashScreen onComplete={handleSplashComplete} />;
      case 'wizard':
        return <FirstTimeWizardWithErrorBoundary onComplete={handleWizardComplete} />;
      case 'main':
        return (
          <>
            <MainMenu />
            <ContextualHelp />
            <NotificationCenter />
          </>
        );
      default:
        return <MainMenu />;
    }
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
                    {renderContent()}
                  </Tutorial>
                </Box>
                {state.showStatusBar && <StatusBar />}
              </Box>
            </ErrorProvider>
          </NotificationProvider>
        </HelpProvider>
      </ThemeProvider>
    </KeyboardProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App;