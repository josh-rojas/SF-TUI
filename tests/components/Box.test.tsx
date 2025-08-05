import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import Box from '../../src/components/common/Box';
import { Text } from 'ink';

describe('Box', () => {
  it('renders children', () => {
    const { lastFrame } = render(
      <Box>
        <Text>Content</Text>
      </Box>
    );
    expect(lastFrame()).toContain('Content');
  });
});
