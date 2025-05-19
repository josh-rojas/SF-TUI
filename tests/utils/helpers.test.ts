import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { executeCommand, formatBytes, formatDuration, truncate, debounce, throttle, deepMerge, isObject, generateId, formatText, createSpinner } from '../../src/utils/helpers';
import type { TextProps } from 'ink';
import chalk from 'chalk';
import type { ExecaChildProcess } from 'execa';

// The execa module is already mocked in setup.ts
// We're just getting a reference to the mock for this test file
const mockExeca = vi.fn();

// Mock the actual execa implementation
const mockExecaImplementation = (command: string, args: string[] = [], options: any = {}) => {
  return {
    stdout: '',
    stderr: '',
    exitCode: 0,
    command: `${command} ${args.join(' ')}`.trim(),
  };
};

// Mock the spinner
const mockSpinner = {
  start: vi.fn().mockReturnThis(),
  stop: vi.fn().mockReturnThis(),
  succeed: vi.fn().mockReturnThis(),
  fail: vi.fn().mockReturnThis(),
  warn: vi.fn().mockReturnThis(),
  info: vi.fn().mockReturnThis(),
  render: vi.fn(),
  text: '',
  stopAndPersist: vi.fn().mockReturnThis(),
};

describe('Helpers', () => {
  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(500)).toBe('500 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1500, 2)).toBe('1.46 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1.5, 1)).toBe('1.5 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatBytes(1024 * 1024 * 1024 * 1024)).toBe('1 TB');
    });
  });

  describe('formatDuration', () => {
    it('should format duration correctly', () => {
      expect(formatDuration(0)).toBe('0ms');
      expect(formatDuration(999)).toBe('999ms');
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(61000)).toBe('1m 1s');
      expect(formatDuration(3601000)).toBe('1h 1s');
      expect(formatDuration(3661000)).toBe('1h 1m 1s');
    });
  });

  describe('truncate', () => {
    it('should truncate text correctly', () => {
      expect(truncate('Hello World', 5)).toBe('Hello…');
      expect(truncate('Hello', 10)).toBe('Hello');
      expect(truncate('Hello World', 11)).toBe('Hello World');
      expect(truncate('Hello World', 10, '...')).toBe('Hello W...');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = debounce(mockFn, 100);
      
      debouncedFn(1);
      debouncedFn(2);
      debouncedFn(3);
      
      // Fast forward time
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith(3);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn();
      const throttledFn = throttle(mockFn, 100);
      
      const startTime = Date.now();
      throttledFn(1);
      throttledFn(2);
      throttledFn(3);
      
      // Fast forward time slightly less than throttle limit
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(mockFn).toHaveBeenCalledTimes(1);
      
      // Fast forward past throttle limit
      await new Promise(resolve => setTimeout(resolve, 60));
      throttledFn(4);
      
      expect(mockFn).toHaveBeenCalledTimes(2);
    });
  });

  describe('deepMerge', () => {
    it('should deep merge objects', () => {
      const target = { a: 1, b: { c: 2 } };
      const source = { b: { d: 3 }, e: 4 };
      const expected = { a: 1, b: { c: 2, d: 3 }, e: 4 };
      
      expect(deepMerge(target, source)).toEqual(expected);
    });
    
    it('should handle null and undefined values', () => {
      expect(deepMerge({ a: 1 }, { a: undefined })).toEqual({ a: 1 });
      expect(deepMerge({ a: 1 }, { a: null })).toEqual({ a: null });
    });
  });

  describe('isObject', () => {
    it('should check if value is an object', () => {
      expect(isObject({})).toBe(true);
      expect(isObject({ a: 1 })).toBe(true);
      expect(isObject([])).toBe(false);
      expect(isObject(null)).toBe(false);
      expect(isObject(undefined)).toBe(false);
      expect(isObject('string')).toBe(false);
      expect(isObject(123)).toBe(false);
    });
  });

  describe('generateId', () => {
    it('should generate a random ID of specified length', () => {
      const id1 = generateId(8);
      const id2 = generateId(12);
      
      expect(id1).toHaveLength(8);
      expect(id2).toHaveLength(12);
      expect(id1).not.toBe(id2);
    });
  });

  describe('formatText', () => {
    it('should format text with chalk based on props', () => {
      // Create a type that includes only the valid TextProps we want to test
      type TestTextProps = Pick<TextProps, 'color' | 'backgroundColor' | 'bold' | 'italic' | 'underline' | 'strikethrough' | 'inverse'>;
      
      const props: TestTextProps = {
        color: 'red',
        backgroundColor: 'white',
        bold: true,
        italic: true,
        underline: true,
        strikethrough: true,
        inverse: true
      };
      
      const result = formatText('test', props);
      expect(result).toContain('test');
      // Can't easily test the actual chalk output, but we can test it doesn't throw
      expect(() => formatText('test', props)).not.toThrow();
    });
  });
});

describe('executeCommand', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExeca.mockReset();
    mockExeca.mockImplementation(mockExecaImplementation);
  });
  
  it('should execute a command and return the result', async () => {
    const mockResult = {
      stdout: Buffer.from('command output'),
      stderr: Buffer.from(''),
      exitCode: 0
    };
    
    mockExeca.mockResolvedValue(mockResult);
    
    const result = await executeCommand('echo', ['hello']);
    
    expect(mockExeca).toHaveBeenCalledWith('echo', ['hello'], expect.any(Object));
    expect(result).toEqual({
      stdout: 'command output',
      stderr: '',
      exitCode: 0,
      command: 'echo hello'
    });
  });
  
  it('should handle command errors', async () => {
    const error = new Error('Command failed');
    (error as any).exitCode = 1;
    (error as any).stderr = Buffer.from('Error message');
    mockExeca.mockRejectedValue(error);
    
    await expect(executeCommand('invalid-command')).rejects.toThrow('Command failed');
  });
  
  it('should use the provided cwd and env', async () => {
    const cwd = '/test/dir';
    const env = { TEST: 'value' };
    
    mockExeca.mockResolvedValue({
      stdout: Buffer.from(''),
      stderr: Buffer.from(''),
      exitCode: 0
    });
    
    await executeCommand('echo', ['test'], { cwd, env });
    
    expect(mockExeca).toHaveBeenCalledWith('echo', ['test'], expect.objectContaining({
      cwd,
      env: expect.objectContaining(env)
    }));
  });
  
  it('should handle spinner option', async () => {
    const spinner = {
      start: vi.fn().mockReturnThis(),
      stop: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      warn: vi.fn().mockReturnThis(),
      info: vi.fn().mockReturnThis(),
      render: vi.fn(),
      text: '',
      stopAndPersist: vi.fn().mockReturnThis(),
    } as const;
    
    mockExeca.mockResolvedValue({
      stdout: Buffer.from('success'),
      stderr: Buffer.from(''),
      exitCode: 0
    });
    
    await executeCommand('echo', ['test'], { spinner });
    
    expect(spinner.start).toHaveBeenCalled();
    expect(spinner.succeed).toHaveBeenCalled();
  });
});
