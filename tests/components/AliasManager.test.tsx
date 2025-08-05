import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AliasManager } from '../../../src/components/alias/AliasManager';
import { execa } from 'execa';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

// Mock child components and hooks
vi.mock('../../../src/components/common/TextInput', () => ({
  TextInput: ({ value, onChange, placeholder }: any) => (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
    />
  ),
}));

vi.mock('ink', async () => {
    const actual = await vi.importActual('ink');
    return {
        ...actual,
        useInput: vi.fn(),
        Box: ({ children }: any) => <div>{children}</div>,
        Text: ({ children }: any) => <span>{children}</span>,
    };
});

vi.mock('ink-select-input', () => ({
    default: ({ items, onSelect }: any) => (
        <ul>
            {items.map((item: any) => (
                <li key={item.value} onClick={() => onSelect(item)}>
                    {item.label}
                </li>
            ))}
        </ul>
    ),
}));

vi.mock('ink-spinner', () => ({
    default: () => <span>Loading...</span>,
}));


describe('AliasManager Component', () => {
  const execaMock = execa as vi.Mock;

  beforeEach(() => {
    execaMock.mockClear();
  });

  const mockAliasList = {
    status: 0,
    result: {
      'my-alias': 'user@example.com',
      'dev-hub': 'hub@example.com',
    },
  };

  it('loads and displays aliases on mount', async () => {
    execaMock.mockResolvedValue({ stdout: JSON.stringify(mockAliasList) });

    render(<AliasManager onBack={() => {}} />);
    
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByText('my-alias = user@example.com')).toBeDefined();
    expect(screen.getByText('dev-hub = hub@example.com')).toBeDefined();
  });

  it('shows an error message if loading aliases fails', async () => {
    execaMock.mockRejectedValue(new Error('CLI error'));

    render(<AliasManager onBack={() => {}} />);

    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(screen.getByText(/Error: Failed to load aliases: CLI error/)).toBeDefined();
  });

  it('navigates to the add form', async () => {
    execaMock.mockResolvedValue({ stdout: JSON.stringify(mockAliasList) });
    render(<AliasManager onBack={() => {}} />);
    
    await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
    });

    fireEvent.click(screen.getByText('➕ Add New Alias'));

    expect(screen.getByText('Add New Alias')).toBeDefined();
  });

  it('adds a new alias', async () => {
    execaMock.mockResolvedValue({ stdout: JSON.stringify(mockAliasList) });
    render(<AliasManager onBack={() => {}} />);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    
    fireEvent.click(screen.getByText('➕ Add New Alias'));

    const aliasNameInput = screen.getByPlaceholderText('my-alias');
    const aliasValueInput = screen.getByPlaceholderText('user@example.com or 00D...');
    
    fireEvent.change(aliasNameInput, { target: { value: 'new-alias' } });
    fireEvent.change(aliasValueInput, { target: { value: 'new-user@example.com' } });

    execaMock.mockResolvedValue({ stdout: '' }); // Mock the set command
    fireEvent.click(screen.getByText('Create Alias'));

    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(execaMock).toHaveBeenCalledWith('sf', ['alias', 'set', 'new-alias', 'new-user@example.com']);
  });

  it('deletes an alias', async () => {
    execaMock.mockResolvedValue({ stdout: JSON.stringify(mockAliasList) });
    render(<AliasManager onBack={() => {}} />);
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    fireEvent.click(screen.getByText('my-alias = user@example.com'));
    fireEvent.click(screen.getByText('Delete Alias'));
    
    execaMock.mockResolvedValue({ stdout: '' }); // Mock the unset command
    fireEvent.click(screen.getByText('✅ Yes, delete it'));

    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });

    expect(execaMock).toHaveBeenCalledWith('sf', ['alias', 'unset', 'my-alias']);
  });
});
