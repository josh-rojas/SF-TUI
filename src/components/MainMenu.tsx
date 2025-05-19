/**
 * @file MainMenu.tsx
 * @description Main navigation component for SF TUI. Handles the primary menu rendering and routing
 * to different application sections. This is the root component that users interact with after initialization.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import SelectInput, { SelectInputItem } from 'ink-select-input';
import chalk from 'chalk';
import Spinner from 'ink-spinner';
import { OrgManager } from './org/OrgManager';
import { ProjectGenerator } from './project/ProjectGenerator';
import { AliasManager } from './alias/AliasManager';
import { AuthManager } from './auth/AuthManager';
import { MetadataTools } from './metadata/MetadataTools';
import { RunTools } from './run/RunTools';
import { PluginsPanel } from './plugins/PluginsPanel';
import { SettingsMenu } from './settings/SettingsMenu';
import { ErrorProvider, ErrorBoundary, Transition } from './common';
import { Breadcrumb } from './common/Breadcrumb';
import { KeyboardShortcuts } from './common/KeyboardShortcuts';
// Import help context
import { useHelp } from '../context/HelpContext';
// Import package.json version 
import pkg from '../../package.json';

/**
 * Represents a menu item in the main navigation
 * @interface MenuItem
 * @extends SelectInputItem<string>
 * @property {string} label - Display text for the menu item
 * @property {string} value - Unique identifier for the menu item
 * @property {string} description - Help text shown when the item is selected
 */
interface MenuItem extends SelectInputItem<string> {
  label: string;
  value: string;
  description: string;
}

/**
 * Main navigation menu items configuration
 * Defines the structure and order of items in the main menu
 */
const menuItems: MenuItem[] = [
  {
    label: '🔄  Org Manager',
    value: 'org',
    description: 'Manage your Salesforce orgs (scratch, sandbox, production)'
  },
  {
    label: '🚀  Project Generator',
    value: 'project',
    description: 'Create new Salesforce projects and packages'
  },
  {
    label: '🔑  Auth Manager',
    value: 'auth',
    description: 'Authenticate with Salesforce orgs'
  },
  {
    label: '🏷️  Alias Manager',
    value: 'alias',
    description: 'Manage your Salesforce CLI aliases'
  },
  {
    label: '📦  Metadata Tools',
    value: 'metadata',
    description: 'Deploy, retrieve, and manage metadata'
  },
  {
    label: '⚡  Run Tools',
    value: 'run',
    description: 'Run Apex, Flows, and more'
  },
  {
    label: '🧩  Plugins',
    value: 'plugins',
    description: 'Manage CLI plugins'
  },
  {
    label: '⚙️  Settings',
    value: 'settings',
    description: 'Configure application preferences and appearance'
  },
  {
    label: '❌  Exit',
    value: 'exit',
    description: 'Exit SF TUI'
  },
];

/**
 * MainMenu Component
 * 
 * The root navigation component that renders the main menu and handles routing
 * between different sections of the application. It manages:
 * - Menu state and selection
 * - Contextual help display
 * - Splash screen animation
 * - Keyboard navigation
 * 
 * @component
 * @example
 * return <MainMenu />
 */
// Map of menu item values to their display names
const MENU_ITEM_NAMES: Record<string, string> = {
  org: 'Org Manager',
  project: 'Project Generator',
  auth: 'Auth Manager',
  alias: 'Alias Manager',
  metadata: 'Metadata Tools',
  run: 'Run Tools',
  plugins: 'Plugins',
  settings: 'Settings'
};

export const MainMenu = () => {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [animationFrame, setAnimationFrame] = useState<number>(0);
  const [showContent, setShowContent] = useState<boolean>(false);
  const [transitionComplete, setTransitionComplete] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const { exit } = useApp();
  const { setContextualHelp } = useHelp();
  
  /**
   * Updates the contextual help based on the currently selected menu item
   * This effect runs whenever the selectedItem changes to ensure help content is relevant
   * to the current context.
   */
  useEffect(() => {
    if (!selectedItem) {
      setContextualHelp(['navigation', 'shortcuts', 'themes']);
    } else {
      switch (selectedItem) {
        case 'org':
          setContextualHelp(['orgs', 'navigation']);
          break;
        case 'metadata':
          setContextualHelp(['metadata', 'orgs']);
          break;
        case 'settings':
          setContextualHelp(['themes', 'shortcuts']);
          break;
        default:
          setContextualHelp(['navigation', 'shortcuts']);
      }
    }
  }, [selectedItem, setContextualHelp]);
  
  // Initial splash screen animation effect
  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 2000);
      
      // Animation frames
      const animation = setInterval(() => {
        setAnimationFrame(prev => (prev + 1) % 10);
      }, 100);
      
      return () => {
        clearTimeout(timer);
        clearInterval(animation);
      };
    }
  }, [showSplash]);
  
  // Handle content transitions after splash screen
  useEffect(() => {
    if (!showSplash && !showContent) {
      // Small delay before showing content
      const timer = setTimeout(() => {
        setShowContent(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showSplash, showContent]);

  const renderSplashScreen = () => {
    // Animated elements
    const spinnerTypes = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    const spinner = spinnerTypes[animationFrame];
    
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" marginY={2}>
        <Text color="blue">
          {chalk.bold.blue('   ████████╗███████╗ █████╗ ███╗   ███╗')}
        </Text>
        <Text color="blue">
          {chalk.bold.blue('   ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║')}
        </Text>
        <Text color="cyan">
          {chalk.bold.cyan('      ██║   █████╗  ███████║██╔████╔██║')}
        </Text>
        <Text color="cyan">
          {chalk.bold.cyan('      ██║   ██╔══╝  ██╔══██║██║╚██╔╝██║')}
        </Text>
        <Text color="cyanBright">
          {chalk.bold.cyanBright('      ██║   ███████╗██║  ██║██║ ╚═╝ ██║')}
        </Text>
        <Text color="cyanBright">
          {chalk.bold.cyanBright('      ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝')}
        </Text>
        <Text> </Text>
        <Text bold color="blue">
          {chalk.bold.blue('███████╗ █████╗ ██╗     ███████╗███████╗ ██████╗ ██████╗  ██████╗███████╗')}
        </Text>
        <Text bold color="cyan">
          {chalk.bold.cyan('██╔════╝██╔══██╗██║     ██╔════╝██╔════╝██╔═══██╗██╔══██╗██╔════╝██╔════╝')}
        </Text>
        <Text bold color="cyanBright">
          {chalk.bold.cyanBright('███████╗███████║██║     █████╗  ███████╗██║   ██║██████╔╝██║     █████╗  ')}
        </Text>
        <Text bold color="cyanBright">
          {chalk.bold.cyanBright('╚════██║██╔══██║██║     ██╔══╝  ╚════██║██║   ██║██╔══██╗██║     ██╔══╝  ')}
        </Text>
        <Text bold color="blueBright">
          {chalk.bold.blueBright('███████║██║  ██║███████╗███████╗███████║╚██████╔╝██║  ██║╚██████╗███████╗')}
        </Text>
        <Text bold color="blueBright">
          {chalk.bold.blueBright('╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝ ╚═════╝╚══════╝')}
        </Text>
        <Text> </Text>
        <Text color="cyanBright">
          {`${spinner} Loading Terminal User Interface...`}
        </Text>
      </Box>
    );
  };

  const renderHeader = () => (
    <Box flexDirection="column" marginBottom={1} borderStyle="round" borderColor="cyanBright" padding={1}>
      <Text bold color="cyan">
        {chalk.bold.cyanBright('╔═══╗╔═══╗     ╔════╗╔╗ ╔╗╔═══╗')}
      </Text>
      <Text bold color="cyan">
        {chalk.bold.cyanBright('║╔═╗║║╔══╝     ║╔╗╔╗║║║ ║║║╔═╗║')}
      </Text>
      <Text bold color="cyan">
        {chalk.bold.cyanBright('║╚══╗║╚══╗     ╚╝║║╚╝║║ ║║║║ ║║')}
      </Text>
      <Text bold color="cyan">
        {chalk.bold.cyanBright('╚══╗║║╔══╝       ║║  ║║ ║║║║ ║║')}
      </Text>
      <Text bold color="cyan">
        {chalk.bold.cyanBright('║╚═╝║║║          ║║  ║╚═╝║║╚═╝║')}
      </Text>
      <Text bold color="cyan">
        {chalk.bold.cyanBright('╚═══╝╚╝          ╚╝  ╚═══╝╚═══╝')}
      </Text>
      <Text> </Text>
      <Text color="gray" italic>Salesforce Terminal User Interface - Interactive CLI</Text>
      <Text color="gray" italic>v{pkg.version}</Text>
      <Text> </Text>
    </Box>
  );

  const renderContent = () => {
    if (!selectedItem) {
      return (
        <Box flexDirection="column">
          <Text bold>What would you like to do?</Text>
          <SelectInput
            items={menuItems}
            onSelect={(item) => {
              if (item.value === 'exit') {
                exit();
                return;
              }
              setSelectedItem(item.value);
            }}
            itemComponent={({ isSelected = false, label = '' }) => {
              // Find the menu item to get its description
              const item = menuItems.find(item => item.label === label);
              return (
                <Box>
                  <Text color={isSelected ? 'cyan' : 'white'}>{label}</Text>
                  <Text>  </Text>
                  <Text color="gray">{item?.description}</Text>
                </Box>
              );
            }}
          />
        </Box>
      );
    }

    // Render the selected component
    switch (selectedItem) {
      case 'org':
        return <OrgManager onBack={() => setSelectedItem(null)} />;
      case 'project':
        return <ProjectGenerator onBack={() => setSelectedItem(null)} />;
      case 'auth':
        return <AuthManager onBack={() => setSelectedItem(null)} />;
      case 'alias':
        return <AliasManager onBack={() => setSelectedItem(null)} />;
      case 'metadata':
        return <MetadataTools onBack={() => setSelectedItem(null)} />;
      case 'run':
        return <RunTools onBack={() => setSelectedItem(null)} />;
      case 'plugins':
        return <PluginsPanel onBack={() => setSelectedItem(null)} />;
      case 'settings':
        return <SettingsMenu onBack={() => setSelectedItem(null)} />;
      default:
        return null;
    }
  };

  // Toggle keyboard shortcuts help
  const toggleShortcuts = useCallback(() => {
    setShowShortcuts(prev => !prev);
  }, []);

  // Handle global keyboard shortcuts
  useInput((input, key) => {
    // Toggle shortcuts help
    if (input === '?') {
      toggleShortcuts();
      return;
    }

    // Handle splash screen
    if (showSplash && key.return) {
      setShowSplash(false);
    }
  });

  // Get current breadcrumb items
  const getBreadcrumbs = () => {
    const items = [{ label: 'Main Menu', active: !selectedItem }];
    
    if (selectedItem) {
      items.push({
        label: MENU_ITEM_NAMES[selectedItem] || selectedItem,
        active: true
      });
    }
    
    return items;
  };

  // Common keyboard shortcuts
  const shortcuts = [
    { key: '↑↓', description: 'Navigate menu items' },
    { key: 'Enter', description: 'Select menu item' },
    { key: 'Esc', description: 'Go back' },
    { key: '?', description: 'Show/hide keyboard shortcuts' },
  ];

  // Render either splash screen or main menu with transitions
  return (
    <ErrorProvider position="top" maxVisibleErrors={2}>
      <ErrorBoundary componentName="MainMenu">
        {showSplash ? (
          <Box flexDirection="column" padding={1} alignItems="center" justifyContent="center">
            {renderSplashScreen()}
            <Text color="gray" italic>
              Press Enter to continue
            </Text>
          </Box>
        ) : (
          <Box flexDirection="column" padding={1}>
            <Transition 
              type="fade" 
              duration={400} 
              visible={showContent}
              onComplete={() => setTransitionComplete(true)}
            >
              {renderHeader()}
            </Transition>
            
            <Transition 
              type="slide-up" 
              duration={500} 
              visible={showContent && transitionComplete}
            >
              <Box flexDirection="column">
                {/* Breadcrumb Navigation */}
                <Breadcrumb items={getBreadcrumbs()} />
                
                {/* Main Content */}
                {renderContent()}
                
                {/* Keyboard Shortcuts Help */}
                <KeyboardShortcuts 
                  shortcuts={shortcuts}
                  visible={showShortcuts}
                  onClose={toggleShortcuts}
                />
                
                {/* Help Text */}
                {!showShortcuts && (
                  <>
                    <Text> </Text>
                    <Text color="gray" italic>
                      Press <Text bold>?</Text> for keyboard shortcuts
                    </Text>
                  </>
                )}
              </Box>
            </Transition>
          </Box>
        )}
      </ErrorBoundary>
    </ErrorProvider>
  );
};

export default MainMenu;
