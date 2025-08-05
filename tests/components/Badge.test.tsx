import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import Badge from '../../src/components/common/Badge';

describe('Badge', () => {
  it('renders content', () => {
    const { lastFrame } = render(<Badge>Badge</Badge>);
    expect(lastFrame()).toContain('Badge');
  });
});
