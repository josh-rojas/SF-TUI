import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { expect } from 'vitest';

// Define types for E2E testing
export interface E2EContext {
  // The app process
  app: ChildProcess;
  
  // Send input to the app
  sendInput: (input: string) => void;
  
  // Output from the app
  output: string[];
  
  // Wait for a specific text to appear in the output
  waitForText: (text: string, timeout?: number) => Promise<void>;
  
  // Wait for a specific pattern to appear in the output
  waitForPattern: (pattern: RegExp, timeout?: number) => Promise<void>;
  
  // Navigate to a specific screen
  navigateTo: (screen: string) => Promise<void>;
  
  // Clean up the app
  cleanup: () => Promise<void>;
}

/**
 * Setup E2E test environment for the application
 * 
 * @param options Options for the test environment
 * @returns E2E test context
 */
export async function setupE2E(options: {
  // Additional environment variables
  env?: Record<string, string>;
  
  // Additional arguments
  args?: string[];
  
  // Timeout for app startup
  timeout?: number;
}): Promise<E2EContext> {
  const appPath = path.resolve(process.cwd(), 'dist/index.js');
  
  if (!fs.existsSync(appPath)) {
    throw new Error(`App not found at ${appPath}. Make sure you've built the app first.`);
  }
  
  // Set up temporary config directory for tests
  const testConfigDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sftui-e2e-'));
  
  // Mock config file
  const configFile = path.join(testConfigDir, 'config.json');
  fs.writeFileSync(configFile, JSON.stringify({
    theme: 'salesforce',
    telemetry: false,
    experimental: { features: ['e2e-testing'] }
  }, null, 2));
  
  // Launch the app
  const app = spawn('node', [appPath, ...(options.args || [])], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
      SFTUI_CONFIG_DIR: testConfigDir,
      TTY: '1', // Force TTY mode
      ...options.env,
    },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  
  const output: string[] = [];
  
  // Collect output
  app.stdout.on('data', (data) => {
    const text = data.toString();
    output.push(text);
    // For debugging
    if (process.env.DEBUG_E2E) {
      console.log('[APP]:', text);
    }
  });
  
  app.stderr.on('data', (data) => {
    const text = data.toString();
    output.push(text);
    // For debugging
    if (process.env.DEBUG_E2E) {
      console.error('[APP ERROR]:', text);
    }
  });
  
  // Send input to the app
  const sendInput = (input: string) => {
    app.stdin.write(input + '\n');
    if (process.env.DEBUG_E2E) {
      console.log('[INPUT]:', input);
    }
  };
  
  // Helper to wait for text to appear in output
  const waitForText = async (text: string, timeout = 5000): Promise<void> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (output.some(o => o.includes(text))) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // If timeout, throw error with the output we received
    const fullOutput = output.join('\n');
    throw new Error(`Timeout waiting for text "${text}". Received output:\n${fullOutput}`);
  };
  
  // Helper to wait for pattern to appear in output
  const waitForPattern = async (pattern: RegExp, timeout = 5000): Promise<void> => {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (output.some(o => pattern.test(o))) {
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // If timeout, throw error with the output we received
    const fullOutput = output.join('\n');
    throw new Error(`Timeout waiting for pattern ${pattern}. Received output:\n${fullOutput}`);
  };
  
  // Helper to navigate to screens
  const navigateTo = async (screen: string): Promise<void> => {
    // First, try to get to the main menu
    sendInput('q'); // Send q to exit current screen if in one
    await waitForText('Main Menu', 2000).catch(() => {
      // If we're not seeing the main menu, press Escape and try again
      sendInput('\u001b'); // Escape key
      return waitForText('Main Menu', 2000);
    });
    
    // Map of screen names to their menu item patterns
    const screenMap: Record<string, RegExp> = {
      'org': /Org Manager/i,
      'metadata': /Metadata Tools/i,
      'run': /Run Tools/i,
      'project': /Project Generator/i,
      'plugins': /Plugins/i,
      'auth': /Auth Manager/i,
      'alias': /Alias Manager/i,
    };
    
    const pattern = screenMap[screen.toLowerCase()];
    
    if (!pattern) {
      throw new Error(`Unknown screen: ${screen}`);
    }
    
    // Find the position of the menu item
    const menuOutput = output[output.length - 1] || '';
    const lines = menuOutput.split('\n');
    
    let index = -1;
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        index = i;
        break;
      }
    }
    
    if (index === -1) {
      throw new Error(`Could not find menu item for screen: ${screen}`);
    }
    
    // Select the menu item (assuming 0-based index from top of menu)
    // Send number keys to go to exact position
    const position = index.toString();
    for (const digit of position) {
      sendInput(digit);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Press Enter
    sendInput('\r');
    
    // Wait for screen to load
    await waitForPattern(pattern, 3000);
  };
  
  // Wait for the app to start
  await waitForText('Main Menu', options.timeout || 5000);
  
  // Create cleanup function
  const cleanup = async (): Promise<void> => {
    // Kill the app
    app.kill();
    
    // Wait for process to exit
    await new Promise<void>((resolve) => {
      app.on('exit', () => {
        // Clean up temp directory
        try {
          fs.rmSync(testConfigDir, { recursive: true, force: true });
        } catch (err) {
          console.error('Failed to clean up temp directory:', err);
        }
        resolve();
      });
      
      // Force kill after timeout
      setTimeout(() => {
        app.kill('SIGKILL');
      }, 1000);
    });
  };
  
  return {
    app,
    sendInput,
    output,
    waitForText,
    waitForPattern,
    navigateTo,
    cleanup,
  };
}

// Add custom assertions for E2E tests
expect.extend({
  toContainOutput(received: E2EContext, expected: string) {
    const output = received.output.join('\n');
    const pass = output.includes(expected);
    
    return {
      pass,
      message: () => pass
        ? `Expected output not to contain ${expected}`
        : `Expected output to contain ${expected}, but it doesn't:\n${output}`,
    };
  },
  
  toMatchOutputPattern(received: E2EContext, expected: RegExp) {
    const output = received.output.join('\n');
    const pass = expected.test(output);
    
    return {
      pass,
      message: () => pass
        ? `Expected output not to match pattern ${expected}`
        : `Expected output to match pattern ${expected}, but it doesn't:\n${output}`,
    };
  },
});