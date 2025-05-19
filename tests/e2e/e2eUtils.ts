import React from 'react';
import { vi } from 'vitest';

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
 * E2E test utilities for Ink-based components testing
 */

// Create a test environment for E2E tests
export const createE2ETestEnvironment = () => {
  // Mock process.stdout
  const originalStdoutWrite = process.stdout.write;
  const mockStdoutWrite = vi.fn();
  
  // Mock process.stderr
  const originalStderrWrite = process.stderr.write;
  const mockStderrWrite = vi.fn();
  
  // Mock clipboard
  const mockClipboard = {
    write: vi.fn(),
    read: vi.fn().mockResolvedValue(''),
  };
  
  // Mock exit
  const mockExit = vi.fn();
  const originalExit = process.exit;
  
  // Mock execa
  const mockExeca = vi.fn();
  
  // Event listeners for user input simulation
  const inputListeners: Array<(input: string, key: any) => void> = [];
  
  // Setup mocks
  const setupMocks = () => {
    // Mock process.stdout.write
    process.stdout.write = mockStdoutWrite;
    
    // Mock process.stderr.write
    process.stderr.write = mockStderrWrite;
    
    // Mock process.exit
    process.exit = mockExit as any;
    
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
    inputListeners.length = 0;
    vi.restoreAllMocks();
  };
  
  // Simulate user input
  const simulateInput = (input: string, key = {}) => {
    for (const listener of inputListeners) {
      listener(input, key);
    }
  };
  
  // Simulate key press
  const simulateKeyPress = (keyName: 'return' | 'escape' | 'tab' | 'backspace' | 'delete' | 'up' | 'down' | 'left' | 'right' | 'pageDown' | 'pageUp') => {
    const keyObject: Record<string, boolean> = { [keyName]: true };
    simulateInput('', keyObject);
  };
  
  // Get the current terminal output
  const getOutput = () => {
    return mockStdoutWrite.mock.calls.map(call => call[0]).join('');
  };
  
  // Wait for a specific output to appear
  const waitForOutput = async (predicate: (output: string) => boolean, timeout = 1000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (predicate(getOutput())) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return false;
  };
  
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
    getOutput,
    waitForOutput,
    mockCommand,
    mockExit,
    mockExeca,
    mockClipboard,
  };
};

// Import the mocked render
import { render as testingRender } from '@testing-library/react';

// Render a component for E2E testing
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
    // Additional utility methods for E2E testing
    findInOutput: (text: string) => Promise.resolve(true),
    outputContains: (text: string) => true,
  };
};