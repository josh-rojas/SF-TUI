import React, { createContext, useContext, useState, useEffect } from 'react';
import { getTheme, Theme } from '../themes';

interface AppState {
  themeName: string;
  theme: Theme;
  selectedOrg?: string;
  devhubOrg?: string;
  showStatusBar: boolean;
  showHelp: boolean;
}

interface AppContextType {
  state: AppState;
  setTheme: (themeName: string) => void;
  setSelectedOrg: (org?: string) => void;
  setDevhubOrg: (org?: string) => void;
  toggleStatusBar: () => void;
  toggleHelp: () => void;
}

// Default state
const defaultState: AppState = {
  themeName: 'base',
  theme: getTheme('base'),
  selectedOrg: undefined,
  devhubOrg: undefined,
  showStatusBar: true,
  showHelp: false,
};

// Create context with default values
const AppContext = createContext<AppContextType>({
  state: defaultState,
  setTheme: () => {},
  setSelectedOrg: () => {},
  setDevhubOrg: () => {},
  toggleStatusBar: () => {},
  toggleHelp: () => {},
});

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);

  // Methods to update state
  const setTheme = (themeName: string) => {
    setState(prev => ({
      ...prev,
      themeName,
      theme: getTheme(themeName),
    }));
  };

  const setSelectedOrg = (org?: string) => {
    setState(prev => ({
      ...prev,
      selectedOrg: org,
    }));
  };

  const setDevhubOrg = (org?: string) => {
    setState(prev => ({
      ...prev,
      devhubOrg: org,
    }));
  };

  const toggleStatusBar = () => {
    setState(prev => ({
      ...prev,
      showStatusBar: !prev.showStatusBar,
    }));
  };

  const toggleHelp = () => {
    setState(prev => ({
      ...prev,
      showHelp: !prev.showHelp,
    }));
  };

  // Create context value
  const contextValue: AppContextType = {
    state,
    setTheme,
    setSelectedOrg,
    setDevhubOrg,
    toggleStatusBar,
    toggleHelp,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the app context
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;