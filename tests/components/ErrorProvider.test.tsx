import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import ErrorProvider, { useErrors } from '../../src/components/common/ErrorProvider';
import { Text } from 'ink';

vi.mock('../../src/utils/errorReporter', () => ({
  errorReporter: {
    subscribe: () => () => {},
    markAsHandled: vi.fn(),
    getAllErrors: () => [],
    clearErrors: vi.fn()
  }
}));

const Consumer = () => {
  const { errors } = useErrors();
  return <Text>{errors.length} errors</Text>;
};

describe('ErrorProvider', () => {
  it('provides error context', () => {
    const { lastFrame } = render(
      <ErrorProvider>
        <Consumer />
      </ErrorProvider>
    );
    expect(lastFrame()).toContain('0 errors');
  });
});
