import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useInput } from 'ink';
import { createInkMock } from '../testUtils';
import { mockExeca } from '../setup';
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

// Create an Ink mock
createInkMock();

describe('OrgManager Error Handling Integration', () => {
  const onBack = vi.fn();

  beforeEach(() => {
    // Reset error reporter
    errorReporter.clearErrors();
  });

  it('should handle errors when loading orgs', async () => {
    // Mock execa to return an error for org list
    mockExeca.mockRejectedValueOnce(new Error('Failed to list orgs'));

    render(
      <ErrorProvider>
        <OrgManager onBack={onBack} />
      </ErrorProvider>
    );

    // Wait for async operations
    await screen.findByText(/Failed to load orgs/);

    // Error should be reported
    expect(errorReporter.getAllErrors()).toHaveLength(1);

    // Error message should be displayed
    expect(screen.getByText(/Failed to load orgs/)).toBeDefined();

    // Error should be logged
    expect(logger.log).toHaveBeenCalled();
  });

  it('should handle empty org list', async () => {
    // Mock execa to return empty org list
    mockExeca.mockResolvedValueOnce({
      stdout: JSON.stringify({
        status: 0,
        result: {
          nonScratchOrgs: [],
          scratchOrgs: [],
        },
      }),
      stderr: '',
    });

    render(
      <ErrorProvider>
        <OrgManager onBack={onBack} />
      </ErrorProvider>
    );

    // Wait for async operations
    await screen.findByText(/No orgs found/);

    // Warning should be reported
    expect(errorReporter.getAllErrors()).toHaveLength(1);

    // "No orgs found" message should be displayed
    expect(screen.getByText(/No orgs found/)).toBeDefined();
  });

  it('should handle command execution errors', async () => {
    // First mock a successful org list
    mockExeca.mockResolvedValueOnce({
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
              status: 'Active',
            },
          ],
          scratchOrgs: [],
        },
      }),
      stderr: '',
    });

    render(
      <ErrorProvider>
        <OrgManager onBack={onBack} />
      </ErrorProvider>
    );

    // Wait for org list to load and find the org button
    const orgButton = await screen.findByText(/test-org/);
    fireEvent.click(orgButton);

    // Then mock a command execution error for the 'open org' command
    mockExeca.mockRejectedValueOnce(new Error('Command failed'));

    // Click "Open Org in Browser"
    const openButton = await screen.findByText(/Open Org in Browser/);
    fireEvent.click(openButton);

    // Wait for the error to be displayed
    await screen.findByText(/Error:/);

    // Error should be reported
    expect(errorReporter.getAllErrors()).toHaveLength(1);

    // Error output should be displayed
    expect(screen.getByText(/Error:/)).toBeDefined();
  });

  it('should integrate with error dismissal', async () => {
    // Mock execa to return an error for org list
    mockExeca.mockRejectedValueOnce(new Error('Failed to list orgs'));

    render(
      <ErrorProvider>
        <OrgManager onBack={onBack} />
      </ErrorProvider>
    );

    // Wait for the error notification to appear
    await screen.findByTestId('error-notification');

    // Dismiss the error
    const escapeHandler = vi.mocked(useInput).mock.calls[0][0];

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