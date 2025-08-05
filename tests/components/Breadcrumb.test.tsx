import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import Breadcrumb from '../../src/components/common/Breadcrumb';

describe('Breadcrumb', () => {
  it('renders items with separator', () => {
    const { lastFrame } = render(<Breadcrumb items={[{label:'Home'},{label:'Products'}]} />);
    const output = lastFrame();
    expect(output).toContain('Home');
    expect(output).toContain('Products');
    expect(output).toContain('›');
  });
});
