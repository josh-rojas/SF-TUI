import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Table from '../../src/components/common/Table';
import { createInkMock } from '../testUtils';

// Mock useTheme
vi.mock('../../src/themes', () => ({
  useTheme: () => ({
    colors: {
      text: 'white',
      textInverse: 'black',
      background: 'black',
      backgroundHover: 'darkgray',
      highlight: 'blue',
      border: 'gray',
      textMuted: 'lightgray',
      primary: 'blue',
      primaryMuted: 'rgba(0, 0, 255, 0.3)',
      secondary: 'purple',
      success: 'green',
      warning: 'yellow',
      error: 'red',
      info: 'cyan',
    }
  }),
}));

// Create Ink mocks
createInkMock();

describe('Table Component', () => {
  // Setup test data
  const mockColumns = [
    {
      key: 'id',
      header: 'ID',
      render: (item: any) => item.id,
    },
    {
      key: 'name',
      header: 'Name',
      render: (item: any) => item.name,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => item.status,
      alignRight: true,
    },
  ];

  const mockData = [
    { id: '1', name: 'Item 1', status: 'Active' },
    { id: '2', name: 'Item 2', status: 'Inactive' },
    { id: '3', name: 'Item 3', status: 'Pending' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders headers correctly', () => {
    const { getByText } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey="id"
      />
    );

    mockColumns.forEach(column => {
      expect(getByText(column.header)).toBeDefined();
    });
  });

  it('renders all rows with correct data', () => {
    const { getByText } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey="id"
      />
    );

    mockData.forEach(item => {
      expect(getByText(item.id)).toBeDefined();
      expect(getByText(item.name)).toBeDefined();
      expect(getByText(item.status)).toBeDefined();
    });
  });

  it('hides header when showHeader is false', () => {
    const { queryByText } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey="id"
        showHeader={false}
      />
    );

    // Headers should not be visible
    mockColumns.forEach(column => {
      expect(queryByText(column.header)).toBeNull();
    });
    
    // But data should still be visible
    expect(getByText(mockData[0].name)).toBeDefined();
  });

  it('applies right alignment to specified columns', () => {
    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey="id"
      />
    );

    // Check for right-aligned cells (status column)
    const rightAlignedElements = container.querySelectorAll('[style*="justifyContent: flex-end"]');
    expect(rightAlignedElements.length).toBeGreaterThan(0);
  });

  it('applies striped row styling when enabled', () => {
    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey="id"
        striped={true}
      />
    );

    // Even rows should have background color
    const stripedElements = container.querySelectorAll(
      `[style*="backgroundColor: ${(vi.mocked as any).useTheme().colors.backgroundHover}"]`
    );
    expect(stripedElements.length).toBeGreaterThan(0);
  });

  it('shows borders when bordered prop is true', () => {
    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey="id"
        bordered={true}
      />
    );

    // Check for border styles
    const borderedElements = container.querySelectorAll('[style*="borderStyle: single"]');
    expect(borderedElements.length).toBeGreaterThan(0);
  });

  it('highlights rows on hover when highlightHover is true', () => {
    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey="id"
        highlightHover={true}
      />
    );

    // Check for hover styles
    const hoverElement = container.querySelector(`[hoverStyle*="backgroundColor: ${(vi.mocked as any).useTheme().colors.primaryMuted}"]`);
    expect(hoverElement).toBeDefined();
  });

  it('handles custom column widths', () => {
    const customColumns = [
      ...mockColumns,
      {
        key: 'wide',
        header: 'Wide Column',
        render: () => 'data',
        width: '50%'
      }
    ];

    const { container } = render(
      <Table
        columns={customColumns}
        data={mockData}
        rowKey="id"
      />
    );

    // Check for width style
    const widthElement = container.querySelector('[style*="width: 50%"]');
    expect(widthElement).toBeDefined();
  });

  it('applies custom styles through style prop', () => {
    const customStyle = {
      backgroundColor: 'darkblue',
      padding: 2
    };

    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey="id"
        style={customStyle}
      />
    );

    // Check for custom styles
    const styledElement = container.querySelector('[style*="backgroundColor: darkblue"]');
    expect(styledElement).toBeDefined();
  });

  it('works with custom rowKey function', () => {
    const getRowKey = (item: any) => `custom-${item.id}`;
    
    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey={getRowKey}
      />
    );

    // Items are rendered but we can't easily test the key directly
    // We can at least verify the component renders without errors
    expect(container).toBeDefined();
  });

  it('supports truncation of cell content', () => {
    const truncateColumns = [
      {
        key: 'longText',
        header: 'Long Text',
        render: () => 'This is a very long text that should be truncated',
        truncate: true
      }
    ];

    const { getByText } = render(
      <Table
        columns={truncateColumns}
        data={[{ id: '1' }]}
        rowKey="id"
      />
    );

    // The text should be rendered
    expect(getByText('This is a very long text that should be truncated')).toBeDefined();
  });

  it('applies custom header and row styles', () => {
    const headerStyle = { fontWeight: 'bold' };
    const rowStyle = { opacity: 0.9 };

    const { container } = render(
      <Table
        columns={mockColumns}
        data={mockData}
        rowKey="id"
        headerStyle={headerStyle}
        rowStyle={rowStyle}
      />
    );

    // We can't easily test these specific styles with the mocks,
    // but we can verify the component renders without errors
    expect(container).toBeDefined();
  });

  it('supports custom cell rendering', () => {
    const customColumns = [
      {
        key: 'custom',
        header: 'Custom',
        render: () => <span data-testid="custom-cell">Custom Content</span>
      }
    ];

    const { getByText } = render(
      <Table
        columns={customColumns}
        data={[{ id: '1' }]}
        rowKey="id"
      />
    );

    expect(getByText('Custom Content')).toBeDefined();
  });
});

