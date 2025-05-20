/**
 * Logger configuration file.
 *
 * This file exports the default configuration for the logger and error reporter.
 * It supports external configuration via environment variables (SF_TUI_*).
 *
 * @module loggerConfig
 */

export interface LoggerConfig {
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  consoleOutput: boolean;
  fileOutput: boolean;
  logFilePath: string;
  maxLogFileSize: number; // in bytes
  maxLogFiles: number;
}

export const defaultLoggerConfig: LoggerConfig = {
  logLevel: (process.env.SF_TUI_LOG_LEVEL as LoggerConfig['logLevel']) || 'INFO',
  consoleOutput: process.env.SF_TUI_CONSOLE_OUTPUT ? process.env.SF_TUI_CONSOLE_OUTPUT === 'true' : true,
  fileOutput: process.env.SF_TUI_FILE_OUTPUT ? process.env.SF_TUI_FILE_OUTPUT === 'true' : true,
  logFilePath: process.env.SF_TUI_LOG_FILE || `${process.env.HOME}/.sf-tui/logs/sf-tui.log`,
  maxLogFileSize: process.env.SF_TUI_MAX_LOG_FILE_SIZE ? parseInt(process.env.SF_TUI_MAX_LOG_FILE_SIZE, 10) : 5 * 1024 * 1024,
  maxLogFiles: process.env.SF_TUI_MAX_LOG_FILES ? parseInt(process.env.SF_TUI_MAX_LOG_FILES, 10) : 5,
};

/**
 * Validates the logger configuration.
 *
 * @param config - The LoggerConfig object to validate.
 * @returns The validated LoggerConfig.
 * @throws Error if the configuration is invalid.
 */
export function validateLoggerConfig(config: LoggerConfig): LoggerConfig {
  if (!['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'].includes(config.logLevel)) {
    throw new Error(`Invalid log level: ${config.logLevel}`);
  }
  if (typeof config.consoleOutput !== 'boolean') {
    throw new Error(`consoleOutput must be a boolean`);
  }
  if (typeof config.fileOutput !== 'boolean') {
    throw new Error(`fileOutput must be a boolean`);
  }
  if (typeof config.logFilePath !== 'string' || config.logFilePath.trim() === '') {
    throw new Error(`Invalid logFilePath`);
  }
  if (typeof config.maxLogFileSize !== 'number' || config.maxLogFileSize <= 0) {
    throw new Error(`Invalid maxLogFileSize`);
  }
  if (typeof config.maxLogFiles !== 'number' || config.maxLogFiles <= 0) {
    throw new Error(`Invalid maxLogFiles`);
  }
  return config;
}

