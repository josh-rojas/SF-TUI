import { Command, Flags } from '@oclif/core';
import { render } from 'ink';
import * as React from 'react';
import App from '../App';
import { logger } from '../utils/logger';

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

    if (flags.debug) {
      logger.level = 'debug';
      logger.info('Debug mode enabled');
    }
    
    // Render the main App component
    render(React.createElement(App));
  }
}
