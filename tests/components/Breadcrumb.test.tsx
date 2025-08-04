import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Breadcrumb from '../../../src/components/common/Breadcrumb';

// Mock Ink components
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    Box: ({ children }: any) => <div>{children}</div>,
    Text: ({ children, color, bold }: any) => (
      <span style={{ color, fontWeight: bold ? 'bold' : 'normal' }}>
        {children}
      </span>
    ),
  };
});

describe('Breadcrumb Component', () => {
  it('renders a list of breadcrumb items', () => {
    const items = [{ label: 'Home' }, { label: 'Products' }, { label: 'Laptops' }];
    render(<Breadcrumb items={items} />);
    
    expect(screen.getByText('Home')).toBeDefined();
    expect(screen.getByText('Products')).toBeDefined();
    expect(screen.getByText('Laptops')).toBeDefined();
  });

  it('renders separators between items', () => {
    const items = [{ label: 'Home' }, { label: 'Products' }];
    render(<Breadcrumb items={items} />);
    
    expect(screen.getByText('›')).toBeDefined();
  });

  it('does not render a separator after the last item', () => {
    const items = [{ label: 'Home' }, { label: 'Products' }];
    render(<Breadcrumb items={items} />);
    
    const separators = screen.queryAllByText('›');
    expect(separators.length).toBe(1);
  });

  it('highlights the active item', () => {
    const items = [
      { label: 'Home' },
      { label: 'Products', active: true },
      { label: 'Laptops' },
    ];
    render(<Breadcrumb items={items} />);
    
    const activeItem = screen.getByText('Products');
    expect(activeItem.style.fontWeight).toBe('bold');
    expect(activeItem.style.color).toBe('cyan');
  });

  it('renders nothing for an empty list of items', () => {
    const { container } = render(<Breadcrumb items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a single item without a separator', () => {
    const items = [{ label: 'Home' }];
    render(<Breadcrumb items={items} />);
    
    expect(screen.getByText('Home')).toBeDefined();
    const separators = screen.queryAllByText('›');
    expect(separators.length).toBe(0);
  });
});
