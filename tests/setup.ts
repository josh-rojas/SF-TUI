// Import testing library utilities
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { JSDOM } from 'jsdom';

// Setup proper JSDOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});

// Add JSDOM globals to Node.js global
global.window = dom.window as unknown as typeof global.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLDivElement = dom.window.HTMLDivElement;
global.Node = dom.window.Node;
global.MouseEvent = dom.window.MouseEvent;
global.KeyboardEvent = dom.window.KeyboardEvent;
global.getComputedStyle = dom.window.getComputedStyle;

// Mock problematic ESM modules to resolve issues
vi.mock('ink-spinner', () => {
  return {
    default: vi.fn().mockImplementation(({ type }: { type?: string }) => {
      return { type: 'div', props: { children: '⠋' } }; // Simulate a React element
    })
  };
});

// Mock ink module to render to DOM-compatible elements for testing-library
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  const React = await import('react');

  return {
    ...actual,
    // Simple mocks for Ink components that render as divs and spans
    Text: (props: { children: React.ReactNode }) => React.createElement('span', props, props.children),
    Box: (props: { children: React.ReactNode }) => React.createElement('div', props, props.children),
    useApp: vi.fn(() => ({ exit: vi.fn() })),
    useInput: vi.fn(() => {}),
    useFocus: vi.fn(() => ({ isFocused: false })),
    render: vi.fn().mockReturnValue({
      unmount: vi.fn(),
      waitUntilExit: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

// Mock chalk to avoid ESM issues
vi.mock('chalk', () => {
  // This proxy-based mock is designed to handle chained calls (e.g., chalk.bold.red)
  // as well as methods like chalk.hex('#FFF')('text').
  const chalkMock = new Proxy(function(str: string) { return str; }, {
    get(target, prop) {
      if (prop === 'hex' || prop === 'bgHex') {
        // Handle chalk.hex(color)(text) and chalk.bgHex(color)(text)
        return (color: string) => chalkMock;
      }
      // For any other property, return the proxy itself to allow chaining
      return chalkMock;
    },
    apply(target, thisArg, argumentsList) {
      // When the proxy is called as a function, just return the first argument (the string).
      return argumentsList[0];
    }
  });

  return {
    default: chalkMock,
  };
});

// Mock execa for all tests. This is exported so that tests can import it
// and use mockImplementationOnce, mockResolvedValue, etc.
export const mockExeca = vi.fn();

vi.mock('execa', () => ({
  execa: mockExeca,
  default: mockExeca,
  ExecaChildProcess: class {},
}));

// Fix global TypeScript types for tests
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    interface Global {
      document: Document;
      window: Window;
      navigator: Navigator;
      Element: typeof Element;
      HTMLElement: typeof HTMLElement;
      HTMLDivElement: typeof HTMLDivElement;
      Node: typeof Node;
      MouseEvent: typeof MouseEvent;
      KeyboardEvent: typeof KeyboardEvent;
      getComputedStyle: typeof getComputedStyle;
      act: (callback: () => void) => void;
      fireEvent: {
        click: (element: any) => void;
      };
    }
  }
  
  var act: (callback: () => void) => void;
  var fireEvent: {
    click: (element: any) => void;
  };
}

// Mock console methods to keep test output clean
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

// Mock process.exit to prevent tests from exiting
const originalExit = process.exit;

// Mock process.stdout.write and process.stderr.write
const originalStdoutWrite = process.stdout.write;
const originalStderrWrite = process.stderr.write;

// Setup global mocks for all tests
beforeAll(() => {
  // Console mocks
  console.log = vi.fn((...args) => {
    // Allow some logs to go through to console for debugging if needed
    if (process.env.DEBUG) {
      originalConsoleLog(...args);
    }
  });

  console.error = vi.fn((...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Error: Uncaught [Error:')) {
      // Ignore specific error that occurs in tests
      return;
    }
    if (process.env.DEBUG) {
      originalConsoleError(...args);
    }
  });

  console.warn = vi.fn((...args) => {
    // Suppress specific warnings that are expected
    if (args[0] && typeof args[0] === 'string' && args[0].includes('React does not recognize the')) {
      return;
    }
    if (process.env.DEBUG) {
      originalConsoleWarn(...args);
    }
  });

  console.info = vi.fn((...args) => {
    if (process.env.DEBUG) {
      originalConsoleInfo(...args);
    }
  });

  // Process mocks
  process.exit = vi.fn() as any;

  // Only mock stdout/stderr writes in CI environments or when not debugging
  if (process.env.CI || !process.env.DEBUG) {
    process.stdout.write = vi.fn() as any;
    process.stderr.write = vi.fn() as any;
  }

  // Add any global variables or configurations for tests
});

// Setup default mock implementations before each test
beforeEach(() => {
  // Provide a default successful mock for execa that can be overridden in tests
  mockExeca.mockResolvedValue({
    stdout: 'mock stdout',
    stderr: '',
    exitCode: 0,
    command: 'mock command',
  });
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  // Reset the execa mock to clear calls and implementations between tests
  mockExeca.mockReset();
});

// Restore original methods after all tests
afterAll(() => {
  // Restore console methods
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.info = originalConsoleInfo;
  
  // Restore process methods
  process.exit = originalExit;
  
  // Restore stdout/stderr only if they were mocked
  if (process.env.CI || !process.env.DEBUG) {
    process.stdout.write = originalStdoutWrite;
    process.stderr.write = originalStderrWrite;
  }
  
  vi.restoreAllMocks();
});
