import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import MainMenu from '../../src/components/MainMenu';

describe('MainMenu', () => {
  it('renders menu items', () => {
    const { lastFrame } = render(<MainMenu />);
    const output = lastFrame();
    expect(output).toContain('Org Manager');
    expect(output).toContain('Project Generator');
  });
});
