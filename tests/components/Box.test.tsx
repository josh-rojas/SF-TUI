import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CustomBox, { BorderBox } from '../../../src/components/common/Box';
import { Theme } from '../../../src/themes';
import { useFocus, useInput, Text } from 'ink';

// Mock Ink components
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    Box: ({ children }: any) => <div>{children}</div>,
    Text: vi.fn(({ children, color }) => <span style={{ color }}>{children}</span>),
    useFocus: vi.fn(),
    useInput: vi.fn(),
  };
});

const MockText = Text as vi.Mock;

// Mock the useTheme hook
const mockTheme: Theme = {
  colors: {
    primary: 'blue',
    border: 'gray',
    text: 'black',
  },
  spacing: {},
};

vi.mock('../../../src/themes', () => ({
  useTheme: () => mockTheme,
}));

describe('CustomBox Component', () => {
  const useFocusMock = useFocus as vi.Mock;
  const useInputMock = useInput as vi.Mock;

  beforeEach(() => {
    useFocusMock.mockReturnValue({ isFocused: false });
    useInputMock.mockClear();
    MockText.mockClear();
  });

  it('renders children correctly', () => {
    render(<CustomBox>Test Content</CustomBox>);
    expect(screen.getByText('Test Content')).toBeDefined();
  });

  it('renders a title when provided', () => {
    render(<CustomBox title="My Title">Content</CustomBox>);
    expect(screen.getByText(/My Title/)).toBeDefined();
  });

  it('renders different border styles', () => {
    const { rerender } = render(<CustomBox borderStyle="single">Content</CustomBox>);
    expect(screen.getByText('┌')).toBeDefined(); // single border

    rerender(<CustomBox borderStyle="double">Content</CustomBox>);
    expect(screen.getByText('╔')).toBeDefined(); // double border

    rerender(<CustomBox borderStyle="round">Content</CustomBox>);
    expect(screen.getByText('╭')).toBeDefined(); // round border
  });

  it('changes border color when focused', () => {
    useFocusMock.mockReturnValue({ isFocused: true });
    render(<CustomBox focusable>Content</CustomBox>);
    
    // Find the mock call that renders the top-left border character
    const borderTextCall = MockText.mock.calls.find(call => call[0].children === '┌');
    
    // Check the color prop of that call
    expect(borderTextCall[0].color).toBe(mockTheme.colors.primary);
  });

  it('calls onClick when space is pressed and focused', () => {
    const handleClick = vi.fn();
    useFocusMock.mockReturnValue({ isFocused: true });
    render(<CustomBox focusable onClick={handleClick}>Content</CustomBox>);

    // Get the callback from the useInput mock
    const handler = useInputMock.mock.calls[0][0];
    // Simulate pressing space
    handler(' ', { return: false });
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders the BorderBox variant', () => {
    render(<BorderBox title="Border Box">Content</BorderBox>);
    expect(screen.getByText(/Border Box/)).toBeDefined();
    expect(screen.getByText('┌')).toBeDefined();
  });
});
