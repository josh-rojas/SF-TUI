import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { deepMerge } from '../utils/helpers';
import { Theme } from '../themes';

// Get the directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import ShortcutConfig type for keyboard shortcuts
import { ShortcutConfig } from '../context/KeyboardShortcuts';
import { CacheOptions } from '../utils/cache';

// Default configuration
export interface Config {
  theme: string;
  editor: string;
  defaultOrg?: string;
  apiVersion: string;
  plugins: string[];
  telemetry: boolean;
  keyboardShortcuts?: ShortcutConfig;
  cache: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    commandCache: {
      enabled: boolean;
      exclude: string[];
    };
  };
  experimental: {
    features: string[];
  };
  [key: string]: any;
}

const defaultConfig: Config = {
  theme: 'salesforce',
  editor: process.env.EDITOR || 'code',
  defaultOrg: undefined,
  apiVersion: '58.0',
  plugins: [],
  telemetry: true,
  keyboardShortcuts: {},
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5 minutes
    maxSize: 10 * 1024 * 1024, // 10MB
    commandCache: {
      enabled: true,
      exclude: [
        'org:create',
        'org:delete',
        'auth',
        'deploy',
        'retrieve',
        'push',
        'pull',
        'data:import',
        'data:export',
        'apex:execute',
      ],
    },
  },
  experimental: {
    features: [],
  },
};

// Path to the config file
const CONFIG_DIR = path.join(os.homedir(), '.sftui');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

// Ensure config directory exists
const ensureConfigDir = () => {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
};

// Load configuration from file
const loadConfig = (): Config => {
  try {
    ensureConfigDir();
    
    if (fs.existsSync(CONFIG_FILE)) {
      const configData = fs.readFileSync(CONFIG_FILE, 'utf8');
      return deepMerge({ ...defaultConfig }, JSON.parse(configData));
    }
    
    // If no config file exists, create one with defaults
    saveConfig(defaultConfig);
    return { ...defaultConfig };
  } catch (error) {
    console.error('Error loading configuration:', error);
    return { ...defaultConfig };
  }
};

// Save configuration to file
const saveConfig = (config: Partial<Config>): void => {
  try {
    ensureConfigDir();
    const currentConfig = loadConfig();
    const newConfig = deepMerge(currentConfig, config);
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf8');
  } catch (error) {
    console.error('Error saving configuration:', error);
  }
};

// Get a configuration value
const getConfig = <T = any>(key?: string): T => {
  const config = loadConfig();
  return key ? config[key] : (config as any);
};

// Set a configuration value
const setConfig = (key: string, value: any): void => {
  const config = loadConfig();
  const newConfig = { ...config, [key]: value };
  saveConfig(newConfig);
};

// Reset configuration to defaults
const resetConfig = (): void => {
  saveConfig(defaultConfig);
};

// Get cache options from config
const getCacheOptions = (): CacheOptions => {
  const cacheConfig = getConfig<Config['cache']>('cache');
  return {
    enabled: cacheConfig.enabled,
    ttl: cacheConfig.ttl,
    maxSize: cacheConfig.maxSize,
    cacheDir: path.join(CONFIG_DIR, 'cache'),
  };
};

// Get theme configuration
const getTheme = (themeName?: string): Theme => {
  const theme = themeName || getConfig<string>('theme');
  return require('../themes').getTheme(theme);
};

// Export configuration methods
export const config = {
  get: getConfig,
  set: setConfig,
  reset: resetConfig,
  getTheme,
  getCacheOptions,
  get path() {
    return CONFIG_FILE;
  },
  get dir() {
    return CONFIG_DIR;
  },
};

// Initialize default configuration if it doesn't exist
ensureConfigDir();
if (!fs.existsSync(CONFIG_FILE)) {
  saveConfig(defaultConfig);
}

export default config;