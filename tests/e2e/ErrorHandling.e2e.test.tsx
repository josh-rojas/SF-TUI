import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import ErrorProvider from '../../src/components/common/ErrorProvider';
import ErrorBoundary from '../../src/components/common/ErrorBoundary';
import { Text } from 'ink';

vi.mock('../../src/utils/errorReporter', () => ({
  errorReporter: {
    reportError: vi.fn(() => ({ id: '1' })),
    getError: vi.fn(() => ({ id: '1', message: 'boom', severity: 'HIGH', category: 'UI' })),
    markAsHandled: vi.fn(),
    subscribe: () => () => {}
  },
  ErrorSeverity: { HIGH: 'HIGH' },
  ErrorCategory: { UI: 'UI' }
}));

vi.mock('../../src/components/common/ErrorNotification', () => ({
  default: ({ error }: any) => <Text>{error.message}</Text>
}));
vi.mock('ink-spinner', () => ({ default: () => null }));

const Thrower = () => {
  throw new Error('boom');
};

describe('Error handling', () => {
  it('shows error from boundary', () => {
    const { lastFrame } = render(
      <ErrorProvider>
        <ErrorBoundary>
          <Thrower />
        </ErrorBoundary>
      </ErrorProvider>
    );
    expect(lastFrame()).toContain('boom');
  });
});
