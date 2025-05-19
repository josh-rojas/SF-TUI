import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createInkMock } from '../testUtils';
import { errorReporter } from '../../src/utils/errorReporter';
import { logger } from '../../src/utils/logger';
import { OrgManager } from '../../src/components/org/OrgManager';
import ErrorProvider from '../../src/components/common/ErrorProvider';

// Setup mocks
vi.mock('../../src/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    log: vi.fn(),
  },
  LogLevel: {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARN: 'WARN',
    ERROR: 'ERROR',
    FATAL: 'FATAL',
  },
  handleError: vi.fn((error) => error instanceof Error ? error : new Error(String(error))),
}));

// Mock execa for Salesforce CLI commands
vi.mock('execa', () => {
  const mockExeca = vi.fn();
  
  mockExeca.mockImplementation((command, args) => {
    // Mock a streaming process
    const mockProcess = {
      stdout: {
        on: vi.fn((event, callback) => {
          if (event === 'data') {
            callback(Buffer.from('Command output'));
          }
        }),
      },
      stderr: {
        on: vi.fn((event, callback) => {
          if (event === 'data' && args.includes('error')) {
            callback(Buffer.from('Command error'));
          }
        }),
      },
    };
    
    // Handle different CLI commands
    if (command === 'sf' && args[0] === 'org' && args[1] === 'list') {
      if (args.includes('--error')) {
        return Promise.reject(new Error('Failed to list orgs'));
      }
      
      // Return empty org list
      if (args.includes('--empty')) {
        return Promise.resolve({
          stdout: JSON.stringify({
            status: 0,
            result: {
              nonScratchOrgs: [],
              scratchOrgs: []
            }
          }),
          stderr: ''
        });
      }
      
      // Return mock org list
      return Promise.resolve({
        stdout: JSON.stringify({
          status: 0,
          result: {
            nonScratchOrgs: [
              {
                alias: 'test-org',
                username: 'test@example.com',
                orgId: '00D123456789012',
                instanceUrl: 'https://example.my.salesforce.com',
                isActive: true,
                isDefaultDevHub: false,
                isDefaultUsername: true,
                connectedStatus: 'Connected',
                status: 'Active'
              }
            ],
            scratchOrgs: []
          }
        }),
        stderr: ''
      });
    }
    
    // Handle failing commands
    if (args.includes('error')) {
      return Promise.reject(new Error('Command failed'));
    }
    
    // Handle successful commands
    return Promise.resolve({
      stdout: 'Command output',
      stderr: ''
    });
  });
  
  return {
    execa: mockExeca,
  };
});

// Create an Ink mock
createInkMock();

describe('OrgManager Error Handling Integration', () => {
  const onBack = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset error reporter
    errorReporter.clearErrors();
  });
  
  afterEach(() => {
    vi.resetAllMocks();
  });
  
  it('should handle errors when loading orgs', async () => {
    // Mock execa to return an error for org list
    const execa = require('execa').execa;
    execa.mockImplementationOnce(() => {
      return Promise.reject(new Error('Failed to list orgs'));
    });
    
    render(
      <ErrorProvider>
        <OrgManager onBack={onBack} />
      </ErrorProvider>
    );
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Error should be reported
    expect(errorReporter.getAllErrors()).toHaveLength(1);
    
    // Error message should be displayed
    expect(screen.getByText(/Failed to load orgs/)).toBeDefined();
    
    // Error should be logged
    expect(logger.log).toHaveBeenCalled();
  });
  
  it('should handle empty org list', async () => {
    // Mock execa to return empty org list
    const execa = require('execa').execa;
    execa.mockImplementationOnce(() => {
      return Promise.resolve({
        stdout: JSON.stringify({
          status: 0,
          result: {
            nonScratchOrgs: [],
            scratchOrgs: []
          }
        }),
        stderr: ''
      });
    });
    
    render(
      <ErrorProvider>
        <OrgManager onBack={onBack} />
      </ErrorProvider>
    );
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Warning should be reported
    expect(errorReporter.getAllErrors()).toHaveLength(1);
    
    // "No orgs found" message should be displayed
    expect(screen.getByText(/No orgs found/)).toBeDefined();
  });
  
  it('should handle command execution errors', async () => {
    // First mock a successful org list
    const execa = require('execa').execa;
    execa.mockImplementationOnce(() => {
      return Promise.resolve({
        stdout: JSON.stringify({
          status: 0,
          result: {
            nonScratchOrgs: [
              {
                alias: 'test-org',
                username: 'test@example.com',
                orgId: '00D123456789012',
                instanceUrl: 'https://example.my.salesforce.com',
                isActive: true,
                isDefaultDevHub: false,
                isDefaultUsername: true,
                connectedStatus: 'Connected',
                status: 'Active'
              }
            ],
            scratchOrgs: []
          }
        }),
        stderr: ''
      });
    });
    
    // Then mock a command execution error
    execa.mockImplementationOnce(() => {
      return Promise.reject(new Error('Command failed'));
    });
    
    render(
      <ErrorProvider>
        <OrgManager onBack={onBack} />
      </ErrorProvider>
    );
    
    // Wait for org list to load
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Select an org
    fireEvent.click(screen.getByText(/test-org/));
    
    // Wait for org selection to process
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Click "Open Org in Browser"
    fireEvent.click(screen.getByText(/Open Org in Browser/));
    
    // Wait for command to execute
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Error should be reported
    expect(errorReporter.getAllErrors()).toHaveLength(1);
    
    // Error output should be displayed
    expect(screen.getByText(/Error:/)).toBeDefined();
  });
  
  it('should integrate with error dismissal', async () => {
    // Mock execa to return an error for org list
    const execa = require('execa').execa;
    execa.mockImplementationOnce(() => {
      return Promise.reject(new Error('Failed to list orgs'));
    });
    
    render(
      <ErrorProvider>
        <OrgManager onBack={onBack} />
      </ErrorProvider>
    );
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Error notification should be displayed
    expect(screen.getByTestId('error-notification')).toBeDefined();
    
    // Dismiss the error
    const useInputMock = require('ink').useInput;
    const escapeHandler = useInputMock.mock.calls[0][0];
    
    act(() => {
      escapeHandler('', { escape: true });
    });
    
    // Error should be marked as handled
    const errors = errorReporter.getAllErrors();
    expect(errors[0].handled).toBe(true);
    
    // Error notification should be removed
    expect(screen.queryByTestId('error-notification')).toBeNull();
    
    // Back function should be called (when pressing Escape on the error screen)
    expect(onBack).toHaveBeenCalled();
  });
});