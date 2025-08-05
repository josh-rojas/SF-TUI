import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { TreeView } from '../../src/components/common/TreeView';

const data = [{ id: '1', label: 'Root', children: [{ id: 'c1', label: 'Child' }] }];

describe.skip('TreeView', () => {
  it('renders tree nodes', () => {
    const { lastFrame } = render(
      <TreeView data={data} onSelect={() => {}} onToggle={() => {}} />
    );
    const output = lastFrame();
    expect(output).toContain('Root');
    expect(output).toContain('Child');
  });
});
