import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import ErrorNotification from '../../src/components/common/ErrorNotification';

vi.mock('../../src/utils/errorReporter', () => ({
  errorReporter: { markAsHandled: vi.fn() },
  ErrorSeverity: { HIGH: 'HIGH' },
  ErrorCategory: { COMMAND: 'COMMAND' }
}));

const error = {
  id: '1',
  timestamp: new Date(),
  message: 'Test error',
  severity: 'HIGH',
  category: 'COMMAND',
  handled: false
};

describe('ErrorNotification', () => {
  it('displays error message', () => {
    const { lastFrame } = render(<ErrorNotification error={error as any} />);
    expect(lastFrame()).toContain('Test error');
  });
});
