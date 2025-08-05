import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import ErrorBoundary from '../../src/components/common/ErrorBoundary';
import { Text } from 'ink';

vi.mock('../../src/utils/errorReporter', () => ({
  errorReporter: {
    reportError: vi.fn(() => ({ id: '1' })),
    getError: vi.fn(() => ({ id: '1', message: 'boom', severity: 'HIGH', category: 'UI' }))
  },
  ErrorSeverity: { HIGH: 'HIGH' },
  ErrorCategory: { UI: 'UI' }
}));

vi.mock('../../src/components/common/ErrorNotification', () => ({
  default: ({ error }: any) => <Text>{error.message}</Text>
}));

class Thrower extends React.Component {
  render(): React.ReactNode {
    throw new Error('boom');
  }
}

describe('ErrorBoundary', () => {
  it('renders children when no error', () => {
    const { lastFrame } = render(
      <ErrorBoundary>
        <Text>safe</Text>
      </ErrorBoundary>
    );
    expect(lastFrame()).toContain('safe');
  });

  it('shows fallback when error occurs', () => {
    const { lastFrame } = render(
      <ErrorBoundary>
        <Thrower />
      </ErrorBoundary>
    );
    expect(lastFrame()).toContain('boom');
  });
});
