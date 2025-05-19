import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import TutorialOverlay from './TutorialOverlay';
import { useTheme } from '../../themes';

// Tutorial steps
const tutorialSteps = [
  {
    id: 'welcome',
    element: 'main-menu',
    title: 'Welcome to SF TUI',
    content: (
      <Box flexDirection="column">
        <Text>Welcome to Salesforce Terminal UI! This tutorial will guide you through the main features of the application.</Text>
        <Text> </Text>
        <Text>Press <Text color="cyan" bold>Next</Text> to continue or <Text color="red">Skip Tutorial</Text> to exit.</Text>
      </Box>
    ),
    position: 'right',
  },
  {
    id: 'navigation',
    element: 'main-menu',
    title: 'Basic Navigation',
    content: (
      <Box flexDirection="column">
        <Text>You can navigate through the application using:</Text>
        <Text>• <Text bold>Arrow keys</Text>: Move through menus and lists</Text>
        <Text>• <Text bold>Enter</Text>: Select an item or confirm an action</Text>
        <Text>• <Text bold>Esc</Text>: Go back to the previous screen</Text>
      </Box>
    ),
    position: 'right',
  },
  {
    id: 'orgs',
    element: 'org-manager',
    title: 'Managing Orgs',
    content: (
      <Box flexDirection="column">
        <Text>The <Text bold>Org Manager</Text> allows you to:</Text>
        <Text>• View all connected Salesforce orgs</Text>
        <Text>• Set default orgs and DevHubs</Text>
        <Text>• Open orgs directly in your browser</Text>
        <Text>• Log out of orgs when needed</Text>
      </Box>
    ),
    position: 'bottom',
  },
  {
    id: 'metadata',
    element: 'metadata-tools',
    title: 'Metadata Tools',
    content: (
      <Box flexDirection="column">
        <Text>The <Text bold>Metadata Tools</Text> help you:</Text>
        <Text>• Deploy code and configurations to orgs</Text>
        <Text>• Retrieve metadata from orgs</Text>
        <Text>• Compare metadata between different environments</Text>
      </Box>
    ),
    position: 'left',
  },
  {
    id: 'run',
    element: 'run-tools',
    title: 'Run Tools',
    content: (
      <Box flexDirection="column">
        <Text>The <Text bold>Run Tools</Text> allow you to:</Text>
        <Text>• Execute Apex code directly</Text>
        <Text>• Run SOQL queries</Text>
        <Text>• Trigger flows and processes</Text>
        <Text>• Analyze results in a structured format</Text>
      </Box>
    ),
    position: 'top',
  },
  {
    id: 'shortcuts',
    element: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    content: (
      <Box flexDirection="column">
        <Text>SF TUI supports keyboard shortcuts:</Text>
        <Text>• <Text bold>?</Text>: Show help</Text>
        <Text>• <Text bold>Ctrl+Q</Text>: Quit application</Text>
        <Text>• <Text bold>Ctrl+S</Text>: Toggle status bar</Text>
        <Text>• <Text bold>Ctrl+T</Text>: Cycle through themes</Text>
      </Box>
    ),
    position: 'left',
  },
  {
    id: 'settings',
    element: 'settings',
    title: 'Settings',
    content: (
      <Box flexDirection="column">
        <Text>The <Text bold>Settings</Text> menu lets you:</Text>
        <Text>• Change the application theme</Text>
        <Text>• Configure keyboard shortcuts</Text>
        <Text>• View and manage other preferences</Text>
      </Box>
    ),
    position: 'right',
  },
  {
    id: 'completion',
    element: 'main-menu',
    title: 'Tutorial Complete!',
    content: (
      <Box flexDirection="column">
        <Text>Congratulations! You've completed the basic tutorial.</Text>
        <Text> </Text>
        <Text>Remember, you can press <Text bold>?</Text> at any time to get context-sensitive help.</Text>
        <Text> </Text>
        <Text>Happy Salesforce development!</Text>
      </Box>
    ),
    position: 'bottom',
  },
];

// Persistent storage key
const TUTORIAL_COMPLETED_KEY = 'sf-tui-tutorial-completed';

interface TutorialProps {
  children: React.ReactNode;
}

export const Tutorial: React.FC<TutorialProps> = ({ children }) => {
  const [showTutorial, setShowTutorial] = useState(false);
  const [initialStep, setInitialStep] = useState(0);
  const theme = useTheme();

  // Check if this is first run
  useEffect(() => {
    // In a real implementation, this would use localStorage or a config file
    // For now, we'll just show the tutorial
    const shouldShowTutorial = true;
    
    if (shouldShowTutorial) {
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  // Handle tutorial completion
  const handleComplete = () => {
    setShowTutorial(false);
    
    // In a real implementation, this would save to localStorage or a config file
    console.log('Tutorial completed and marked as done');
  };

  // Handle tutorial skip
  const handleSkip = () => {
    setShowTutorial(false);
    
    // In a real implementation, this would save to localStorage or a config file
    console.log('Tutorial skipped and marked as done');
  };

  // Jump to a specific tutorial step
  const jumpToStep = (stepId: string) => {
    const stepIndex = tutorialSteps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1) {
      setInitialStep(stepIndex);
      setShowTutorial(true);
    }
  };

  return (
    <Box position="relative">
      {children}
      
      <TutorialOverlay
        steps={tutorialSteps}
        isActive={showTutorial}
        onComplete={handleComplete}
        onSkip={handleSkip}
        initialStep={initialStep}
      />
    </Box>
  );
};

export default Tutorial;