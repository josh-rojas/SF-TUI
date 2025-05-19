import { execa } from 'execa';
import { cacheService } from './cache';
import { logger } from './logger';

export interface CommandOptions {
  /**
   * Working directory for the command
   */
  cwd?: string;
  
  /**
   * Environment variables for the command
   */
  env?: Record<string, string>;
  
  /**
   * Whether to enable caching for this command
   * Default: true
   */
  cache?: boolean;
  
  /**
   * Cache time-to-live in milliseconds
   * Default: 5 minutes (from cache service)
   */
  cacheTTL?: number;
  
  /**
   * Command timeout in milliseconds
   * Default: 60000 (1 minute)
   */
  timeout?: number;
  
  /**
   * Whether to throw on non-zero exit code
   * Default: true
   */
  throwOnError?: boolean;
}

export interface CommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  fromCache: boolean;
}

const DEFAULT_OPTIONS: CommandOptions = {
  cache: true,
  timeout: 60000,
  throwOnError: true,
};

/**
 * Execute a command with caching support
 * 
 * @param command The command to execute
 * @param args Command arguments
 * @param options Command options
 * @returns Command result
 */
export async function executeCommand(
  command: string,
  args: string[] = [],
  options: CommandOptions = {}
): Promise<CommandResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Skip cache for commands that modify state
  const modifyingCommands = ['create', 'delete', 'deploy', 'push', 'pull', 'install', 'uninstall', 'auth'];
  const shouldUseCache = opts.cache && 
    !args.some(arg => modifyingCommands.some(cmd => arg.includes(cmd)));
  
  if (shouldUseCache) {
    const cacheKey = cacheService.generateKey(command, args);
    const cachedResult = cacheService.get(cacheKey);
    
    if (cachedResult) {
      logger.debug(`Cache hit for command: ${command} ${args.join(' ')}`);
      return {
        ...cachedResult,
        fromCache: true,
      };
    }
  }
  
  try {
    logger.debug(`Executing command: ${command} ${args.join(' ')}`);
    
    const result = await execa(command, args, {
      cwd: opts.cwd,
      env: { ...process.env, ...opts.env },
      timeout: opts.timeout,
      reject: opts.throwOnError,
    });
    
    const commandResult: CommandResult = {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      fromCache: false,
    };
    
    // Cache successful results
    if (shouldUseCache && result.exitCode === 0) {
      const cacheKey = cacheService.generateKey(command, args);
      cacheService.set(cacheKey, commandResult);
    }
    
    return commandResult;
  } catch (error: any) {
    if (error.exitCode !== undefined) {
      // This is an execa error with exit code
      return {
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        exitCode: error.exitCode,
        fromCache: false,
      };
    }
    
    // This is some other error
    throw error;
  }
}

/**
 * Execute a Salesforce CLI command with caching support
 * 
 * @param args Command arguments
 * @param options Command options
 * @returns Command result
 */
export async function executeSfCommand(
  args: string[] = [],
  options: CommandOptions = {}
): Promise<CommandResult> {
  return executeCommand('sf', args, options);
}

/**
 * Invalidate cache for a specific command or command pattern
 * 
 * @param command The command to invalidate cache for
 * @param args Optional arguments to include in the invalidation key
 */
export function invalidateCommandCache(command: string, args: string[] = []): void {
  const cacheKey = cacheService.generateKey(command, args);
  cacheService.invalidate(cacheKey);
}

/**
 * Clear the entire command cache
 */
export function clearCommandCache(): void {
  cacheService.clear();
}