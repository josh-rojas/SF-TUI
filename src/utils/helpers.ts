import { execa } from 'execa';
import chalk from 'chalk';
import { TextProps } from 'ink';
import { logger, handleError } from './logger';

// Custom Spinner type that includes the methods we need
interface SpinnerInterface {
  start: (text: string) => SpinnerInterface;
  stop: () => SpinnerInterface;
  succeed: (text?: string) => SpinnerInterface;
  fail: (text?: string) => SpinnerInterface;
  warn: (text?: string) => SpinnerInterface;
  info: (text: string) => SpinnerInterface;
  render: (frame: number) => void;
  text: string;
  stopAndPersist?: (options?: any) => SpinnerInterface;
}

type Spinner = SpinnerInterface;

type CommandOptions = {
  cwd?: string;
  silent?: boolean;
  spinner?: Spinner;
  env?: NodeJS.ProcessEnv;
  timeout?: number;
};

type CommandResult = {
  stdout: string;
  stderr: string;
  exitCode: number;
  command: string;
};

/**
 * Execute a shell command and return the result
 */
export const executeCommand = async (
  command: string,
  args: string[] = [],
  options: CommandOptions = {}
): Promise<CommandResult> => {
  const { cwd = process.cwd(), silent = false, spinner, env, timeout } = options;
  
  if (!silent) {
    const displayCommand = [command, ...args].join(' ');
    spinner?.start(chalk.dim(`$ ${displayCommand}`));
  }
  
  try {
    // Log command execution
    logger.debug(`Executing command: ${command} ${args.join(' ')}`, { cwd, timeout });
    
    const subprocess = execa(command, args, {
      cwd,
      shell: true,
      env: { ...process.env, ...env, FORCE_COLOR: '1' },
      timeout,
    });
    
    // Stream output if not silent
    if (!silent) {
      subprocess.stdout?.on('data', (data) => {
        const output = data.toString().trim();
        spinner?.stopAndPersist({
          symbol: ' ', 
          text: chalk.dim(output)
        });
        logger.debug(`[stdout] ${output}`);
      });
      
      subprocess.stderr?.on('data', (data) => {
        const output = data.toString().trim();
        spinner?.stopAndPersist({
          symbol: chalk.yellow('!'),
          text: chalk.yellow(output)
        });
        logger.warn(`[stderr] ${output}`);
      });
    }
    
    const result = await subprocess;
    
    if (!silent && spinner) {
      spinner.succeed();
    }
    
    // Log successful completion
    logger.debug(`Command completed successfully: ${command}`, {
      exitCode: 0,
      command: [command, ...args].join(' ')
    });
    
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: 0, // execa throws on non-zero exit codes
      command: [command, ...args].join(' '),
    };
  } catch (error: any) {
    // Log the error
    handleError(error, 'executeCommand', {
      command: [command, ...args].join(' '),
      cwd,
      exitCode: error.exitCode || 1
    });
    
    if (!silent && spinner) {
      spinner.fail(chalk.red(`Command failed: ${error.shortMessage || error.message}`));
    }
    
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exitCode: error.exitCode || 1,
      command: [command, ...args].join(' '),
    };
  }
};

/**
 * Format bytes to human-readable string
 */
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format a duration in milliseconds to a human-readable string
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  
  const parts = [];
  
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);
  
  return parts.join(' ') || '0s';
};

/**
 * Truncate text with ellipsis
 */
export const truncate = (text: string, maxLength: number, ellipsis = '…'): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
};

/**
 * Create a debounced function
 */
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  wait: number
): ((...args: Parameters<F>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return function(...args: Parameters<F>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Create a throttled function
 */
export const throttle = <F extends (...args: any[]) => any>(
  func: F,
  limit: number
): ((...args: Parameters<F>) => void) => {
  let inThrottle = false;
  
  return function(...args: Parameters<F>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Deep merge objects
 */
export const deepMerge = <T extends Record<string, any>>(target: T, source: any): T => {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key as keyof T] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
};

/**
 * Check if value is an object
 */
export const isObject = (item: any): item is Record<string, any> => {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
};

/**
 * Generate a random ID
 */
export const generateId = (length = 8): string => {
  return Math.random().toString(36).substring(2, 2 + length);
};

/**
 * Format text with chalk based on props
 */
export const formatText = (text: string, props: TextProps = {}): string => {
  let result = text;
  
  if (props.color) {
    result = chalk.hex(props.color)(result);
  }
  
  if (props.backgroundColor) {
    result = chalk.bgHex(props.backgroundColor)(result);
  }
  
  if (props.bold) {
    result = chalk.bold(result);
  }
  
  if (props.italic) {
    result = chalk.italic(result);
  }
  
  if (props.underline) {
    result = chalk.underline(result);
  }
  
  if (props.dimColor) {
    result = chalk.dim(result);
  }
  
  if (props.inverse) {
    result = chalk.inverse(result);
  }
  
  if (props.strikethrough) {
    result = chalk.strikethrough(result);
  }
  
  return result;
};

/**
 * Create a loading spinner
 */
export const createSpinner = (text: string, spinnerType = 'dots'): Spinner => {
  const framesMap: Record<string, string[]> = {
    dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    line: ['-', '\\', '|', '/'],
  };

  const spinner = {
    interval: 80,
    frames: framesMap[spinnerType] || framesMap.dots,
    text: '',
    start(text: string) {
      this.text = text;
      this.render(0);
      return this;
    },
    stop() {
      process.stdout.write('\r' + ' '.repeat(process.stdout.columns || 80) + '\r');
      return this;
    },
    stopAndPersist(options?: { symbol?: string; text?: string }) {
      this.stop();
      const symbol = options?.symbol ?? ' ';
      const text = options?.text ?? this.text;
      console.log(`${symbol} ${text}`);
      return this;
    },
    succeed(text?: string) {
      this.stop();
      console.log(chalk.green('✓') + ' ' + (text || this.text));
      return this;
    },
    fail(text?: string) {
      this.stop();
      console.error(chalk.red('✗') + ' ' + (text || this.text));
      return this;
    },
    warn(text?: string) {
      this.stop();
      console.warn(chalk.yellow('!') + ' ' + (text || this.text));
      return this;
    },
    info(text: string) {
      this.stop();
      console.info(chalk.blue('i') + ' ' + text);
      return this;
    },
    render(frame: number) {
      const frameIndex = frame % this.frames.length;
      process.stdout.write(
        '\r' +
        chalk.blue(this.frames[frameIndex]) +
        ' ' +
        this.text
      );
    },
  };

  return spinner.start(text);
};
