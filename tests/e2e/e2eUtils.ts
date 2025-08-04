import React from 'react';
import { vi } from 'vitest';
import { EventEmitter } from 'events';

// Mock ink-select-input for E2E tests
const mockSelectInput = vi.fn(({ items, onSelect }) => {
  return React.createElement(
    'div',
    { 'data-testid': 'mock-select-input' },
    items.map((item: any) => {
      return React.createElement(
        'div',
        { key: item.value, onClick: () => onSelect(item) },
        item.label
      );
    })
  );
});

vi.mock('ink-select-input', () => ({
  default: mockSelectInput,
  __esModule: true,
}));

// We don't need to import ink's render because we're mocking it in setup.ts
// But we keep a reference here to maintain the API of this utility
const inkRender = vi.fn().mockReturnValue({
  unmount: vi.fn(),
  waitUntilExit: vi.fn().mockResolvedValue(undefined),
});

// Mock testing library with better handlers
const testingLibraryRender = vi.fn(() => {
  const elements = new Map();
  
  const getByText = vi.fn((text) => {
    const key = typeof text === 'string' ? text : text.toString();
    if (!elements.has(key)) {
      elements.set(key, { textContent: key });
    }
    return elements.get(key);
  });
  
  const findByTestId = vi.fn((id) => {
    if (!elements.has(id)) {
      elements.set(id, { id, 'data-testid': id });
    }
    return Promise.resolve(elements.get(id));
  });
  
  const queryByTestId = vi.fn((id) => {
    return elements.has(id) ? elements.get(id) : null;
  });
  
  const unmount = vi.fn();
  
  return {
    getByText,
    findByTestId,
    queryByTestId,
    unmount,
    // Add more testing-library methods as needed
  };
});

// Mock @testing-library/react
vi.mock('@testing-library/react', () => ({
  render: testingLibraryRender
}));

/**
 * Options for creating an E2E test environment.
 */
export interface CreateE2ETestEnvironmentOptions {
  /**
   * Default behavior for stripping ANSI codes from output.
   * @default false
   */
  defaultStripAnsi?: boolean;
  /**
   * Initial terminal dimensions.
   */
  dimensions?: {
    rows: number;
    columns: number;
  };
}

/**
 * Strips ANSI escape codes from a string.
 * @param text The text to strip ANSI codes from.
 * @returns The text with ANSI codes removed.
 */
export const stripAnsi = (text: string): string => {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
};

/**
 * E2E test utilities for Ink-based components testing
 */

// Create a test environment for E2E tests
export const createE2ETestEnvironment = (options?: CreateE2ETestEnvironmentOptions) => {
  const { defaultStripAnsi = false, dimensions: initialDimensions } = options || {};

  // Original process properties
  const originalStdoutWrite = process.stdout.write;
  const originalStderrWrite = process.stderr.write;
  const originalExit = process.exit;
  const originalStdoutRows = process.stdout.rows;
  const originalStdoutColumns = process.stdout.columns;
  const originalStdoutOn = process.stdout.on;
  const originalProcessOn = process.on;

  // Mocks
  const outputEmitter = new EventEmitter();
  const mockStdoutWrite = vi.fn((data: string | Uint8Array) => {
    const result = originalStdoutWrite.apply(process.stdout, [data]);
    outputEmitter.emit('output', data.toString());
    return result;
  });
  const mockStderrWrite = vi.fn();
  let lastExitCode: number | undefined;
  const mockExit = vi.fn((code?: number) => {
    lastExitCode = code;
    // To prevent tests from actually exiting
  });
  const mockExeca = vi.fn();
  const mockClipboard = {
    write: vi.fn(),
    read: vi.fn().mockResolvedValue(''),
  };

  // Event listeners
  const inputListeners: Array<(input: string, key: any) => void> = [];
  const signalListeners = new Map<NodeJS.Signals, Array<(...args: any[]) => void>>();
  const stdoutResizeListeners: Array<() => void> = [];

  // Setup mocks
  const setupMocks = () => {
    process.stdout.write = mockStdoutWrite;
    process.stderr.write = mockStderrWrite;
    process.exit = mockExit as any;

    if (initialDimensions) {
      process.stdout.rows = initialDimensions.rows;
      process.stdout.columns = initialDimensions.columns;
    }

    process.stdout.on = vi.fn((event: string, listener: (...args: any[]) => void) => {
      if (event === 'resize') {
        stdoutResizeListeners.push(listener);
      } else {
        // For other events, you might want to call original or handle differently
        return originalStdoutOn.call(process.stdout, event, listener);
      }
      return process.stdout;
    }) as any;

    process.on = vi.fn((signal: any, listener: (...args: any[]) => void) => {
      let listeners = signalListeners.get(signal as NodeJS.Signals);
      if (!listeners) {
        listeners = [];
        signalListeners.set(signal as NodeJS.Signals, listeners);
      }
      listeners.push(listener);
      return process;
    }) as any;
    
    // We no longer need to mock execa or ink here since they're
    // globally mocked in setup.ts
    
    // Register input listeners for the useInput mock
    const useInputMockFn = (callback: (input: string, key: any) => void) => {
      inputListeners.push(callback);
      return callback;
    };
    
    // Update the ink mock to use our inputListeners
    if (vi.mocked && vi.mocked.module) {
      vi.mocked.module('ink').useInput.mockImplementation(useInputMockFn);
      vi.mocked.module('ink').useApp.mockReturnValue({ exit: mockExit });
    }
  };
  
  // Cleanup mocks
  const cleanupMocks = () => {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
    process.exit = originalExit;
    process.stdout.rows = originalStdoutRows;
    process.stdout.columns = originalStdoutColumns;
    process.stdout.on = originalStdoutOn;
    process.on = originalProcessOn;

    inputListeners.length = 0;
    signalListeners.clear();
    stdoutResizeListeners.length = 0;
    outputEmitter.removeAllListeners();
    mockStdoutWrite.mockClear();
    mockStderrWrite.mockClear();
    mockExit.mockClear();
    mockExeca.mockClear();
    lastExitCode = undefined;
    vi.restoreAllMocks(); // This might be redundant if specific mocks are cleared
  };

  /**
   * Simulates user input.
   * @param input The character input.
   * @param key The key object (e.g., { name: 'return' }).
   */
  const simulateInput = (input: string, key = {}) => {
    for (const listener of inputListeners) {
      listener(input, key);
    }
  };

  /**
   * Simulates a key press.
   * @param keyName Name of the key to simulate.
   */
  const simulateKeyPress = (keyName: 'return' | 'escape' | 'tab' | 'backspace' | 'delete' | 'up' | 'down' | 'left' | 'right' | 'pageDown' | 'pageUp' | string) => {
    const keyObject: Record<string, boolean> = { [keyName]: true };
    simulateInput('', keyObject);
  };

  /**
   * Gets the current terminal output.
   * @param options Options for getting output.
   * @param options.stripAnsi Whether to strip ANSI codes. Defaults to `defaultStripAnsi`.
   * @returns The terminal output.
   */
  const getOutput = (options?: { stripAnsi?: boolean }) => {
    const strip = options?.stripAnsi ?? defaultStripAnsi;
    const rawOutput = mockStdoutWrite.mock.calls.map(call => call[0]).join('');
    return strip ? stripAnsi(rawOutput) : rawOutput;
  };

  /**
   * Waits for a specific output to appear or a predicate to be true.
   * @param predicate A function that returns true when the condition is met, or a string/regex to match in the output.
   * @param options Options for waiting.
   * @param options.timeout Timeout in milliseconds. Default is 1000ms.
   * @param options.interval Polling interval in milliseconds. Default is 50ms.
   * @param options.stripAnsi Whether to use stripped ANSI output for the predicate. Default is `defaultStripAnsi`.
   * @returns A promise that resolves to true if the condition is met, false otherwise.
   */
   const waitForOutput = async (
    predicate: string | RegExp | ((output: string) => boolean),
    options?: { timeout?: number; interval?: number; stripAnsi?: boolean }
  ): Promise<boolean> => {
    const { timeout = 1000, interval = 50, stripAnsi: strip = defaultStripAnsi } = options || {};
    const startTime = Date.now();

    const checkPredicate = (currentOutput: string): boolean => {
      if (typeof predicate === 'function') {
        return predicate(currentOutput);
      }
      if (typeof predicate === 'string') {
        return currentOutput.includes(predicate);
      }
      if (predicate instanceof RegExp) {
        return predicate.test(currentOutput);
      }
      return false;
    };

    return new Promise<boolean>((resolve) => {
      const check = () => {
        const currentOutput = getOutput({ stripAnsi: strip });
        if (checkPredicate(currentOutput)) {
          outputEmitter.off('output', check); // Clean up listener
          resolve(true);
          return;
        }
        if (Date.now() - startTime >= timeout) {
          outputEmitter.off('output', check); // Clean up listener
          resolve(false);
          return;
        }
        // Continue polling if not resolved by event
        setTimeout(check, interval);
      };

      // Listen for new output to potentially resolve faster
      outputEmitter.on('output', check);
      // Initial check
      check();
    });
  };

  /**
   * Simulates a terminal resize event.
   * @param rows New number of rows.
   * @param columns New number of columns.
   */
  const simulateResize = (rows: number, columns: number) => {
    process.stdout.rows = rows;
    process.stdout.columns = columns;
    stdoutResizeListeners.forEach(listener => listener());
  };

  /**
   * Simulates sending a signal to the process.
   * @param signal The signal to send (e.g., 'SIGINT').
   */
  const simulateSignal = (signal: NodeJS.Signals, ...args: any[]) => {
    const listeners = signalListeners.get(signal);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  };

  /**
   * Gets the last exit code passed to `process.exit`.
   * @returns The exit code or undefined if `process.exit` was not called.
   */
  const getLastExitCode = () => lastExitCode;

  // Set up mock responses for execa commands
  const mockCommand = (command: string, args: string[], response: { stdout: string, stderr: string, exitCode: number }) => {
    mockExeca.mockImplementation((cmd: string, cmdArgs: string[]) => {
      if (cmd === command && cmdArgs.some(arg => args.includes(arg))) {
        return Promise.resolve(response);
      }
      return Promise.reject(new Error(`Unexpected command: ${cmd} ${cmdArgs.join(' ')}`));
    });
  };

  return {
    setupMocks,
    cleanupMocks,
    simulateInput,
    simulateKeyPress,
    simulateResize,
    simulateSignal,
    getOutput,
    waitForOutput,
    mockCommand,
    mockExit, // The vitest mock function itself
    getLastExitCode, // Getter for the code passed to mockExit
    mockExeca,
    mockClipboard,
    // Expose internals for advanced testing if necessary, e.g., direct access to listeners
    // _internals: { signalListeners, stdoutResizeListeners, outputEmitter }
  };
};

// Import the mocked render
import { render as testingRender } from '@testing-library/react';

/**
 * Renders a React component for E2E testing using the mocked testing library.
 * It also provides a mocked Ink instance.
 * @param component The React component to render.
 * @returns An object with testing library query functions and a mocked Ink instance.
 */
export const renderForE2E = (component: React.ReactElement) => {
  // Create a mocked Ink instance
  const instance = { 
    unmount: vi.fn(),
    waitUntilExit: vi.fn().mockResolvedValue(undefined),
    clear: vi.fn(),
    rerender: vi.fn(),
  };
  
  // Use our mocked testing library render
  const rendered = testingLibraryRender(component);
  
  return {
    ...rendered,
    instance,
    unmount: () => {
      instance.unmount();
      if (rendered.unmount) {
        rendered.unmount();
      }
    },
    // Example additional utility methods, can be expanded or removed
    // findInOutput: async (text: string, e2e: ReturnType<typeof createE2ETestEnvironment>) => {
    //   return e2e.waitForOutput(output => output.includes(text));
    // },
    // outputContains: (text: string, e2e: ReturnType<typeof createE2ETestEnvironment>) => {
    //   return e2e.getOutput().includes(text);
    // },
  };
};
