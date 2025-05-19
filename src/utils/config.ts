import { homedir } from 'os';
import { join } from 'path';
import { promises as fs } from 'fs';
import { logger } from './logger';

const CONFIG_DIR = join(homedir(), '.sftui');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

export interface AppConfig {
  firstRun: boolean;
  user: {
    fullName: string;
    defaultOrg: string;
    enableAnalytics: boolean;
    theme: 'light' | 'dark' | 'system';
  };
  version: string;
}

const defaultConfig: AppConfig = {
  firstRun: true,
  user: {
    fullName: '',
    defaultOrg: '',
    enableAnalytics: true,
    theme: 'system'
  },
  version: '1.0.0'
};

export const loadConfig = async (): Promise<AppConfig> => {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // Config file doesn't exist, return default config
        await saveConfig(defaultConfig);
        return defaultConfig;
      }
      throw error;
    }
  } catch (error) {
    logger.error('Failed to load config', { error });
    return defaultConfig;
  }
};

export const saveConfig = async (config: Partial<AppConfig>): Promise<void> => {
  try {
    const currentConfig = await loadConfig();
    const updatedConfig = { ...currentConfig, ...config };
    
    await fs.writeFile(
      CONFIG_FILE,
      JSON.stringify(updatedConfig, null, 2),
      'utf8'
    );
  } catch (error) {
    logger.error('Failed to save config', { error });
    throw error;
  }
};

export const markFirstRunComplete = async (userConfig: Partial<AppConfig['user']> = {}) => {
  try {
    const currentConfig = await loadConfig();
    await saveConfig({
      firstRun: false,
      user: {
        ...currentConfig.user,
        ...userConfig
      },
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    logger.error('Failed to mark first run as complete', { error });
    throw error;
  }
};
