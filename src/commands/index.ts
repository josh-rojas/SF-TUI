import { Command, Flags } from '@oclif/core';
import { render, Text } from 'ink';
import * as React from 'react';
import { MainMenu } from '../components/MainMenu';
import { FirstTimeWizardWithErrorBoundary } from '../components/FirstTimeWizard';
import SplashScreen from '../components/SplashScreen';
import { loadConfig, markFirstRunComplete } from '../utils/config';
import { logger } from '../utils/logger';
import ErrorBoundary from '../components/common/ErrorBoundary';

export default class SFTUI extends Command {
  static description = 'Salesforce TUI - An interactive terminal UI for Salesforce CLI';

  static examples = [
    `$ sft`, // Default command
    `$ sft --help`,
    `$ sft --version`,
  ];

  static flags = {
    version: Flags.boolean({
      char: 'v',
      description: 'Show version',
      required: false,
    }),
    help: Flags.help({ char: 'h' }),
    debug: Flags.boolean({
      description: 'Enable debug mode',
      default: false,
    }),
  };

  async run() {
    const { flags } = await this.parse(SFTUI);

    if (flags.version) {
      this.log(`SF TUI v${this.config.version}`);
      return;
    }

    // Show splash screen first
    const renderMainMenu = () => React.createElement(MainMenu);
    
    const renderWithErrorBoundary = (component: React.ReactNode) => 
      React.createElement(
        ErrorBoundary,
        { children: component }
      );

    const handleWizardComplete = async (config: any) => {
      // Mark first run as complete and save user preferences
      await markFirstRunComplete({
        fullName: config.user.fullName,
        defaultOrg: config.user.defaultOrg,
        enableAnalytics: config.user.enableAnalytics,
        theme: config.user.theme
      });
      
      // Show main menu after wizard completes
      render(renderWithErrorBoundary(renderMainMenu()));
    };

    const handleSplashComplete = async () => {
      try {
        // Load configuration after splash screen
        const config = await loadConfig();
        
        // Check if this is the first run
        if (config.firstRun) {
          logger.info('First run detected, showing welcome wizard');
          
          // Render the first-time wizard
          render(
            renderWithErrorBoundary(
              React.createElement(FirstTimeWizardWithErrorBoundary, {
                onComplete: () => handleWizardComplete(config)
              })
            )
          );
        } else {
          // Render the main menu for returning users
          logger.info('Returning user detected, showing main menu');
          render(renderWithErrorBoundary(renderMainMenu()));
        }
      } catch (error) {
        logger.error('Error initializing application', { error });
        
        // Fallback to main menu if there's an error loading config
        render(renderWithErrorBoundary(renderMainMenu()));
      }
    };

    // Initial render with splash screen
    render(
      renderWithErrorBoundary(
        React.createElement(SplashScreen, {
          onComplete: handleSplashComplete
        })
      )
    );
  }
}
