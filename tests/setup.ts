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

// Mock ink module to avoid ESM issues
vi.mock('ink', () => {
  return {
    default: vi.fn(),
    Box: vi.fn(({ children }) => ({ type: 'div', props: { children } })),
    Text: vi.fn(({ children }) => ({ type: 'span', props: { children } })),
    useApp: vi.fn(() => ({ exit: vi.fn() })),
    useInput: vi.fn((callback) => {}),
    useFocus: vi.fn(() => ({ isFocused: false })),
    render: vi.fn().mockReturnValue({
      unmount: vi.fn(),
      waitUntilExit: vi.fn().mockResolvedValue(undefined),
    }),
  };
});

// Mock chalk to avoid ESM issues
vi.mock('chalk', () => {
  const createChalkMock = () => {
    const chalk = (str: string) => str;
    chalk.bold = createChalkMock();
    chalk.green = createChalkMock();
    chalk.red = createChalkMock();
    chalk.yellow = createChalkMock();
    chalk.blue = createChalkMock();
    chalk.cyan = createChalkMock();
    chalk.magenta = createChalkMock();
    chalk.white = createChalkMock();
    chalk.gray = createChalkMock();
    chalk.grey = createChalkMock();
    chalk.black = createChalkMock();
    chalk.bold.green = createChalkMock();
    chalk.bold.red = createChalkMock();
    chalk.bold.yellow = createChalkMock();
    chalk.bold.blue = createChalkMock();
    chalk.bold.cyan = createChalkMock();
    chalk.bold.magenta = createChalkMock();
    chalk.bold.white = createChalkMock();
    chalk.bold.gray = createChalkMock();
    chalk.bold.grey = createChalkMock();
    chalk.bold.black = createChalkMock();
    return chalk;
  };
  
  return {
    default: createChalkMock()
  };
});

// Mock execa for all tests
const mockExeca = vi.fn().mockImplementation((command, args = [], options = {}) => {
  return Promise.resolve({
    command: `${command} ${args.join(' ')}`,
    exitCode: 0,
    stdout: Buffer.from('mock stdout'),
    stderr: Buffer.from(''),
    // Add common properties an ExecaChildProcess might have
    kill: vi.fn(),
    cancel: vi.fn(),
    then: (onFulfilled, onRejected) => Promise.resolve({
      exitCode: 0,
      stdout: 'mock stdout',
      stderr: '',
    }).then(onFulfilled, onRejected),
    catch: (onRejected) => Promise.resolve({
      exitCode: 0,
      stdout: 'mock stdout',
      stderr: '',
    }).catch(onRejected),
    finally: (onFinally) => Promise.resolve({
      exitCode: 0,
      stdout: 'mock stdout',
      stderr: '',
    }).finally(onFinally),
  });
});

vi.mock('execa', async () => {
  return {
    execa: mockExeca,
    default: mockExeca,
    ExecaChildProcess: class {}
  };
});

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

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
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
