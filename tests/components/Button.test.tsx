import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Button from '../../src/components/common/Button';
import { createInkMock } from '../testUtils';

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
    Box: ({ children, ...props }: any) => (
      <div data-testid="ink-box" {...props}>
        {children}
      </div>
    ),
    Text: ({ children, ...props }: any) => (
      <span data-testid="ink-text" {...props}>
        {children}
      </span>
    ),
  };
});

// Create Ink mocks
createInkMock();

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
    render(
      <Button onPress={handlePress}>
        Click me
      </Button>
    );
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handlePress).toHaveBeenCalledTimes(1);
  });
  
  it('calls onPress when space key is pressed', () => {
    const handlePress = vi.fn();
    render(
      <Button onPress={handlePress}>
        Press me
      </Button>
    );
    
    const button = screen.getByText('Press me');
    fireEvent.keyDown(button, { key: ' ' });
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
    render(
      <Button fullWidth>
        Full Width
      </Button>
    );
    
    const button = screen.getByText('Full Width');
    expect(button.closest('[data-testid="ink-box"]')).toHaveStyle({ width: '100%' });
  });
  
  it('applies custom styles', () => {
    const customStyle = { backgroundColor: 'purple', color: 'white' };
    render(
      <Button style={customStyle}>
        Styled Button
      </Button>
    );
    
    const button = screen.getByText('Styled Button');
    expect(button).toHaveStyle(customStyle);
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
    // Mock useFocus to return isFocused: true
    const inkModule = require('ink');
    const originalUseFocus = inkModule.useFocus;
    
    inkModule.useFocus = vi.fn(() => ({ isFocused: true }));
    
    const { getByText } = render(
      <Button>Focused Button</Button>
    );
    
    // In focused state, the button text should be surrounded by '> ' and ' <'
    expect(getByText('> Focused Button <')).toBeDefined();
    
    // Restore original useFocus
    inkModule.useFocus = originalUseFocus;
  });

  it('passes through boxProps to the Box component', () => {
    const boxProps = {
      marginY: 1,
      paddingX: 2,
      flexDirection: 'row' as const
    };
    
    render(
      <Button boxProps={boxProps}>
        Button with Box Props
      </Button>
    );
    
    // We're primarily testing that the component renders without crashing
    // when passing boxProps
    expect(screen.getByText('Button with Box Props')).toBeDefined();
  });
});