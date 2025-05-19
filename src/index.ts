#!/usr/bin/env node

import { run } from '@oclif/core';
import { logger, setupGlobalErrorHandlers } from './utils';
import React from 'react';
import { render } from 'ink';
import App from './App';

// Enable source map support for better error messages
import 'source-map-support/register';

// Set up global error handlers
setupGlobalErrorHandlers();

// Initialize logger and other services
logger.info('Starting SF TUI');

// Execute the CLI
// With ESModule support
run([import.meta.url])
  .then(() => {
    // Render the app with Ink
    const { waitUntilExit } = render(React.createElement(App));
    
    // Wait for app to exit
    return waitUntilExit();
  })
  .then(() => {
    // Log successful completion
    logger.info('SF TUI completed successfully');
    // Exit with success code
    process.exit(0);
  })
  .catch((error) => {
    // Log the error using our logger
    logger.fatal('Error running SF TUI', { error });
    // Exit with error code
    process.exit(1);
  });
