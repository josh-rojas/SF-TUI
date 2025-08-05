import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import Button from '../../src/components/common/Button';

describe('Button', () => {
  it('renders text', () => {
    const { lastFrame } = render(<Button>Click me</Button>);
    expect(lastFrame()).toContain('Click me');
  });

  it('handles key press', () => {
    const onPress = vi.fn();
    const { stdin } = render(<Button onPress={onPress}>Press</Button>);
    stdin.write(' ');
    expect(onPress).toHaveBeenCalled();
  });
});
