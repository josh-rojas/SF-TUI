import { vi } from 'vitest';
import React from 'react';

// Helper function to create mocks for Ink-related functionality
export function createInkMock() {
  // Mock React and Ink imports
  vi.mock('react', async () => {
    const actual = await vi.importActual('react');
    return {
      ...actual as object,
      // Any custom React mock functions go here
    };
  });
  
  // Mock useInput from Ink
  vi.mock('ink', async () => {
    const actual = await vi.importActual('ink');
    return {
      ...actual as object,
      useInput: vi.fn((callback) => callback),
      useApp: vi.fn(() => ({ exit: vi.fn() })),
      Box: vi.fn(({ children, ...props }) => React.createElement('div', props, children)),
      Text: vi.fn(({ children, ...props }) => React.createElement('span', props, children)),
    };
  });
  
  // Mock remaining Ink components as needed
  vi.mock('ink-select-input', () => ({
    default: vi.fn(({ items, onSelect }) => 
      React.createElement('div', { 'data-testid': 'select-input' }, 
        items.map((item, i) => 
          React.createElement('button', { 
            key: i, 
            onClick: () => onSelect(item) 
          }, item.label)
        )
      )
    ),
  }));
  
  // Helper functions for testing
  global.act = (callback) => callback();
  global.fireEvent = {
    click: (element) => {
      if (element && element.onClick) {
        element.onClick();
      }
    },
  };
}

// Helper to create a fake error report
export function createMockErrorReport(overrides = {}) {
  return {
    id: 'test-error-id',
    timestamp: new Date(),
    message: 'Test error message',
    severity: 'HIGH',
    category: 'COMMAND',
    context: 'TestContext',
    details: { key: 'value' },
    userAction: 'Try this to fix the issue',
    handled: false,
    error: new Error('Detailed error info'),
    ...overrides,
  };
}

// Helper for testing with file system operations
export function mockFileSystem() {
  // This creates a mock in-memory file system for testing
  const mockFs = {
    files: new Map(),
    dirs: new Set(['/']),
    
    // Mock implementations of fs functions
    existsSync: vi.fn((path) => mockFs.files.has(path) || mockFs.dirs.has(path)),
    readFileSync: vi.fn((path, options) => {
      if (!mockFs.files.has(path)) throw new Error(`File not found: ${path}`);
      return mockFs.files.get(path);
    }),
    writeFileSync: vi.fn((path, content) => {
      mockFs.files.set(path, content);
    }),
    appendFileSync: vi.fn((path, content) => {
      const existing = mockFs.files.has(path) ? mockFs.files.get(path) : '';
      mockFs.files.set(path, existing + content);
    }),
    mkdirSync: vi.fn((path, options) => {
      mockFs.dirs.add(path);
    }),
    statSync: vi.fn((path) => {
      if (!mockFs.files.has(path) && !mockFs.dirs.has(path)) {
        throw new Error(`File not found: ${path}`);
      }
      
      if (mockFs.files.has(path)) {
        const content = mockFs.files.get(path);
        return {
          isDirectory: () => false,
          isFile: () => true,
          size: content.length,
          mtime: new Date(),
        };
      }
      
      return {
        isDirectory: () => true,
        isFile: () => false,
        size: 0,
        mtime: new Date(),
      };
    }),
    unlinkSync: vi.fn((path) => {
      if (!mockFs.files.has(path)) throw new Error(`File not found: ${path}`);
      mockFs.files.delete(path);
    }),
  };
  
  return mockFs;
}