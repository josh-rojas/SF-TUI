import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { TextInput } from '../../src/components/common/TextInput';

describe('TextInput', () => {
  it('shows placeholder', () => {
    const { lastFrame } = render(
      <TextInput value="" onChange={() => {}} placeholder="Enter" focus={false} showCursor={false} />
    );
    expect(lastFrame()).toContain('Enter');
  });
});
