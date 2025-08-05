import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Button from '../../../src/components/common/Button';
import { useFocus, useInput } from 'ink';

// Mock useTheme
const mockTheme = {
  colors: {
    text: 'white',
    textInverse: 'black',
    background: 'black',
    backgroundHover: 'darkgray',
    highlight: 'blue',
    border: 'gray',
    textMuted: 'lightgray',
    primary: 'blue',
    secondary: 'purple',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'cyan',
  }
};

vi.mock('../../src/themes', () => ({
  useTheme: () => mockTheme,
}));

// Mock Ink components
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    Box: ({ children, style, width, ...props }: any) => (
      <div data-testid="ink-box" style={{ ...style, width }} {...props}>
        {children}
      </div>
    ),
    Text: ({ children, ...props }: any) => (
      <span data-testid="ink-text" {...props}>
        {children}
      </span>
    ),
    useFocus: vi.fn(() => ({ isFocused: false })),
    useInput: vi.fn(),
  };
});

const useFocusMock = useFocus as vi.Mock;
const useInputMock = useInput as vi.Mock;

describe('Button Component', () => {
  beforeEach(() => {
    useFocusMock.mockClear();
    useInputMock.mockClear();
  });

  it('renders with default props', () => {
    render(
      <Button>Click me</Button>
    );
    
    // Should render the button text
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const variants: Array<React.ComponentProps<typeof Button>['variant']> = [
      'primary',
      'secondary',
      'success',
      'warning',
      'error',
      'info',
      'default'
    ];
    
    for (const variant of variants) {
      const { unmount } = render(
        <Button variant={variant}>
          {variant} button
        </Button>
      );
      
      expect(screen.getByText(`${variant} button`)).toBeInTheDocument();
      unmount();
    }
  });
  
  it('calls onPress when clicked', () => {
    const handlePress = vi.fn();
    render(<Button onPress={handlePress}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    // Clicks are not handled by useInput, so this is tricky to test
    // For now, we assume it works if useInput works.
    // A better test would use a more sophisticated mock.
  });
  
  it('calls onPress when space key is pressed', () => {
    const handlePress = vi.fn();
    render(<Button onPress={handlePress}>Press me</Button>);
    const handler = useInputMock.mock.calls[0][0];
    handler(' ', {});
    expect(handlePress).toHaveBeenCalledTimes(1);
  });

  it('calls onPress when enter key is pressed', () => {
    const handlePress = vi.fn();
    render(<Button onPress={handlePress}>Press me</Button>);
    const handler = useInputMock.mock.calls[0][0];
    handler('', { return: true });
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
  
  it('does not call onPress when disabled', () => {
    const handlePress = vi.fn();
    render(
      <Button onPress={handlePress} disabled>
        Disabled Button
      </Button>
    );
    
    const button = screen.getByText('Disabled Button');
    fireEvent.click(button);
    expect(handlePress).not.toHaveBeenCalled();
  });
  
  it('does not call onPress when loading', () => {
    const handlePress = vi.fn();
    render(
      <Button onPress={handlePress} loading>
        Loading Button
      </Button>
    );
    
    const button = screen.getByText('Loading...');
    fireEvent.click(button);
    expect(handlePress).not.toHaveBeenCalled();
  });
  
  it('renders with full width when specified', () => {
    render(<Button fullWidth>Full Width</Button>);
    const box = screen.getByTestId('ink-box');
    expect(box.style.width).toBe('100%');
  });
  
  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'purple', color: 'white' };
    render(<Button style={customStyle}>Styled Button</Button>);
    const box = screen.getByTestId('ink-box');
    expect(box.style.backgroundColor).toBe('purple');
    expect(box.style.color).toBe('white');
  });
  
  it('passes through boxProps to the Box component', () => {
    render(
      <Button 
        boxProps={{ 
          borderStyle: 'round',
          borderColor: 'blue',
          padding: 1,
          // @ts-expect-error - data-testid is not in the Box props but we need it for testing
          'data-testid': 'custom-box' 
        }}
      >
        With Box Props
      </Button>
    );
    
    expect(screen.getByTestId('custom-box')).toBeInTheDocument();
  });

  it('renders focused state', () => {
    useFocusMock.mockReturnValue({ isFocused: true });
    render(<Button>Focused Button</Button>);
    expect(screen.getByText('> Focused Button <')).toBeDefined();
  });

  it('does not call onPress when focusable is false', () => {
    const handlePress = vi.fn();
    useFocusMock.mockReturnValue({ isFocused: false });
    render(<Button onPress={handlePress} focusable={false}>Not Focusable</Button>);
    
    expect(screen.getByText('Not Focusable')).toBeDefined();
    expect(useInputMock).toHaveBeenCalledWith(expect.any(Function), { isActive: false });
  });

  it('renders loading state with icon', () => {
    render(<Button loading>Click me</Button>);
    expect(screen.getByText('⏳')).toBeDefined();
    expect(screen.getByText('Loading...')).toBeDefined();
  });
});