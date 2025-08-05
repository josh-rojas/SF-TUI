import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import ProgressBar from '../../src/components/common/ProgressBar';

describe('ProgressBar', () => {
  it('shows percentage', () => {
    const { lastFrame } = render(<ProgressBar value={50} />);
    expect(lastFrame()).toContain('50');
  });
});
