/**
 * @file FirstTimeWizard.tsx
 * @description A multi-step wizard that guides new users through the initial setup
 * of the SF TUI application. Collects user preferences and configuration settings
 * that will be used throughout the application.
 */

import React, { useState } from 'react';
import { Box, Text, useInput, useApp, Newline } from 'ink';
import SelectInput from 'ink-select-input';
import chalk from 'chalk';
import { TextInput } from './common/TextInput';
import ErrorBoundary from './common/ErrorBoundary';
import { logger } from '../utils/logger';

/**
 * Represents the different steps in the first-time wizard flow
 */
type WizardStep = 'welcome' | 'configure' | 'complete';

/**
 * Configuration object containing user preferences collected during setup
 * 
 * @interface WizardConfig
 * @property {string} fullName - User's full name for personalization
 * @property {string} defaultOrg - Alias of the default org to use
 * @property {boolean} enableAnalytics - Whether to enable anonymous usage analytics
 * @property {'light'|'dark'|'system'} theme - Preferred color theme
 */
interface WizardConfig {
  fullName: string;
  defaultOrg: string;
  enableAnalytics: boolean;
  theme: 'light' | 'dark' | 'system';
}

/**
 * FirstTimeWizard Component
 * 
 * A multi-step form that collects initial configuration from new users.
 * Guides users through setting up their preferences and connects to their first org.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {() => void} props.onComplete - Callback when wizard completes successfully
 * @returns {JSX.Element} The wizard UI
 * 
 * @example
 * <FirstTimeWizard onComplete={() => console.log('Setup complete')} />
 */
export const FirstTimeWizard = ({ onComplete }: { onComplete: () => void }) => {
  // Wizard state
  const [step, setStep] = useState<WizardStep>('welcome');
  
  // User configuration being collected
  const [config, setConfig] = useState<WizardConfig>({
    fullName: '',
    defaultOrg: '',
    enableAnalytics: true,
    theme: 'system'
  });
  
  // Form input state
  const [inputValue, setInputValue] = useState('');
  const [currentField, setCurrentField] = useState<keyof WizardConfig | null>(null);
  
  // Access to Ink's app context for exit handling
  const { exit } = useApp();

  const handleWelcomeSelect = (item: { value: string }) => {
    if (item.value === 'start') {
      setStep('configure');
      setCurrentField('fullName');
    } else if (item.value === 'exit') {
      exit();
    }
  };

  const handleInputSubmit = () => {
    if (!inputValue.trim()) return;
    
    if (currentField) {
      setConfig(prev => ({
        ...prev,
        [currentField]: currentField === 'enableAnalytics' 
          ? inputValue.toLowerCase() === 'y' 
          : inputValue
      }));
      
      // Move to next field or complete
      const fields: (keyof WizardConfig)[] = ['fullName', 'defaultOrg', 'enableAnalytics', 'theme'];
      const currentIndex = fields.indexOf(currentField);
      
      if (currentIndex < fields.length - 1) {
        setCurrentField(fields[currentIndex + 1]);
        setInputValue('');
      } else {
        setStep('complete');
      }
    }
  };

  const handleComplete = () => {
    // Save configuration
    logger.info('First-time setup completed', { config });
    // Here you would typically save the config to a file or state management
    onComplete();
  };

  const renderWelcome = () => (
    <Box flexDirection="column" padding={2}>
      <Box marginBottom={2}>
        <Text>🎉 Welcome to SF TUI! 🎉</Text>
      </Box>
      <Box marginBottom={2}>
        <Text>This looks like your first time using SF TUI. Let's get you set up!</Text>
      </Box>
      <Box marginTop={2}>
        <SelectInput
          items={[
            { label: 'Start Setup', value: 'start' },
            { label: 'Exit', value: 'exit' }
          ]}
          onSelect={handleWelcomeSelect}
        />
      </Box>
    </Box>
  );

  const renderConfigure = () => {
    const fieldConfigs = {
      fullName: {
        prompt: 'What is your full name?',
        description: 'This will be used to personalize your experience.'
      },
      defaultOrg: {
        prompt: 'Enter your default Salesforce org username',
        description: 'You can change this later in settings.'
      },
      enableAnalytics: {
        prompt: 'Enable anonymous usage analytics? (y/n)',
        description: 'Help improve SF TUI by sharing anonymous usage data.'
      },
      theme: {
        prompt: 'Select theme (light/dark/system)',
        description: 'Choose your preferred color scheme.'
      }
    };

    const currentConfig = fieldConfigs[currentField as keyof typeof fieldConfigs] || {};

    return (
      <Box flexDirection="column" padding={2}>
        <Box marginBottom={2}>
          <Text>🔧 Setup Configuration</Text>
        </Box>
        <Box marginBottom={1}>
          <Text>{currentConfig.prompt}</Text>
        </Box>
        {currentConfig.description && (
          <Box marginBottom={2}>
            <Text color="gray">{currentConfig.description}</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleInputSubmit}
            placeholder={currentField === 'enableAnalytics' ? 'y/n' : ''}
          />
        </Box>
      </Box>
    );
  };

  const renderComplete = () => (
    <Box flexDirection="column" padding={2}>
      <Box marginBottom={2}>
        <Text>✅ Setup Complete!</Text>
      </Box>
      <Box marginBottom={2}>
        <Text>Thank you for setting up SF TUI. Here's a quick overview:</Text>
      </Box>
      <Box marginLeft={2} flexDirection="column">
        <Text>• Name: {config.fullName}</Text>
        <Text>• Default Org: {config.defaultOrg || 'Not set'}</Text>
        <Text>• Analytics: {config.enableAnalytics ? 'Enabled' : 'Disabled'}</Text>
        <Text>• Theme: {config.theme}</Text>
      </Box>
      <Box marginTop={2}>
        <Text>Press any key to continue to the main menu...</Text>
      </Box>
    </Box>
  );

  useInput((input, key) => {
    if (step === 'complete' && key.return) {
      handleComplete();
    }
  });

  return (
    <ErrorBoundary>
      <Box flexDirection="column" borderStyle="round" borderColor="cyan" padding={1}>
        {step === 'welcome' && renderWelcome()}
        {step === 'configure' && renderConfigure()}
        {step === 'complete' && renderComplete()}
      </Box>
    </ErrorBoundary>
  );
};

export /**
 * Wraps FirstTimeWizard with ErrorBoundary to handle any rendering errors
 * 
 * @component
 * @private
 */
const FirstTimeWizardWithErrorBoundary = (props: { onComplete: () => void }) => (
  <ErrorBoundary>
    <FirstTimeWizard {...props} />
  </ErrorBoundary>
);
