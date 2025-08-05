import fs from 'fs-extra';
import { LoggerConfig as ExternalLoggerConfig } from '../config/loggerConfig'; // Assuming this is the main config

type RotationConfig = Pick<ExternalLoggerConfig, 'logFilePath' | 'maxLogFileSize' | 'maxLogFiles' | 'fileOutput'>;

const MAX_ROTATION_RETRIES = 3;
const ROTATION_RETRY_DELAY_MS = 1000;

/**
 * Service responsible for log file rotation.
 * @class
 */
export class LogRotationService {
  private config: RotationConfig;
  private rotationRetries = 0;
  // Use a simplified console logger for rotation service internal issues
  // to avoid circular dependencies or complex logger passthrough.
  private internalLogger = {
    error: (message: string, details?: any) => console.error(`[LogRotationService] ${message}`, details || ''),
    info: (message: string, details?: any) => console.log(`[LogRotationService] ${message}`, details || ''),
  };


  /**
   * Creates an instance of LogRotationService.
   * @param config - The configuration for log rotation.
   */
  constructor(config: RotationConfig) {
    this.config = config;
  }
  
  /**
   * Updates the configuration for the rotation service.
   * @param newConfig - The new partial configuration.
   */
  public updateConfig(newConfig: Partial<RotationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }


  /**
   * Checks if log rotation is needed based on file size and performs rotation.
   */
  public async checkAndRotate(): Promise<void> {
    if (!this.config.fileOutput || !this.config.logFilePath) {
      return;
    }

    try {
      const fileExists = await fs.pathExists(this.config.logFilePath);
      if (fileExists) {
        const stats = await fs.stat(this.config.logFilePath);
        if (stats.size >= this.config.maxLogFileSize) {
          await this.rotate();
        }
      }
    } catch (error) {
      this.internalLogger.error(`Failed to check log rotation for ${this.config.logFilePath}:`, error);
    }
  }

  /**
   * Rotates the log files with retry logic.
   */
  private async rotate(): Promise<void> {
    if (!this.config.fileOutput || !this.config.logFilePath) {
      this.internalLogger.error('Rotation skipped: File output disabled or log path not set.');
      return;
    }
    
    this.internalLogger.info(`Attempting to rotate log file: ${this.config.logFilePath}`);

    try {
      const oldestLog = `${this.config.logFilePath}.${this.config.maxLogFiles - 1}`;
      if (await fs.pathExists(oldestLog)) {
        await fs.unlink(oldestLog);
        this.internalLogger.info(`Deleted oldest log: ${oldestLog}`);
      }

      for (let i = this.config.maxLogFiles - 2; i >= 0; i--) {
        const oldPath = i === 0 ? this.config.logFilePath : `${this.config.logFilePath}.${i}`;
        const newPath = `${this.config.logFilePath}.${i + 1}`;
        if (await fs.pathExists(oldPath)) {
          await fs.rename(oldPath, newPath);
          this.internalLogger.info(`Renamed ${oldPath} to ${newPath}`);
        }
      }
      // Create a new empty log file. This also handles the case where the original log file didn't exist.
      await fs.writeFile(this.config.logFilePath, ''); 
      this.internalLogger.info(`Created new log file: ${this.config.logFilePath}`);
      this.rotationRetries = 0; // Reset retries on success
    } catch (error) {
      this.rotationRetries++;
      const errorMessage = `Failed to rotate log files (attempt ${this.rotationRetries}) for ${this.config.logFilePath}: ${error instanceof Error ? error.message : String(error)}`;
      this.internalLogger.error(errorMessage);

      if (this.rotationRetries < MAX_ROTATION_RETRIES) {
        this.internalLogger.info(`Retrying rotation in ${ROTATION_RETRY_DELAY_MS}ms...`);
        await new Promise(resolve => setTimeout(resolve, ROTATION_RETRY_DELAY_MS));
        await this.rotate(); // Retry
      } else {
        this.internalLogger.error(`Max rotation retries reached for ${this.config.logFilePath}. Rotation failed for this cycle.`);
        // Consider if fileOutput should be disabled here for the main logger if rotation is critical.
        // For now, it just means rotation failed, but logging might continue to the oversized file.
      }
    }
  }
}

