import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import Table from '../../src/components/common/Table';

describe('Table', () => {
  it('renders headers and rows', () => {
    const columns = [
      { key: 'id', header: 'ID', render: (item: any) => item.id },
      { key: 'name', header: 'Name', render: (item: any) => item.name }
    ];
    const data = [{ id: '1', name: 'Alice' }];
    const { lastFrame } = render(
      <Table columns={columns} data={data} rowKey="id" />
    );
    const output = lastFrame();
    expect(output).toContain('ID');
    expect(output).toContain('Alice');
  });
});
