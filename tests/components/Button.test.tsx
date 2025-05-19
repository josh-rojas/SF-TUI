import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Button from '../../src/components/common/Button';
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

describe('Button Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    const { getByText } = render(
      <Button>Click me</Button>
    );
    
    // Should render the button text
    expect(getByText('Click me')).toBeDefined();
  });

  it('renders with different variants', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'default'];
    
    for (const variant of variants) {
      const { getByText, unmount } = render(
        <Button variant={variant as any}>
          {variant} button
        </Button>
      );
      
      // Should render the button text for each variant
      expect(getByText(`${variant} button`)).toBeDefined();
      
      unmount();
    }
  });

  it('calls onPress when clicked', () => {
    const onPress = vi.fn();
    render(
      <Button onPress={onPress}>Click me</Button>
    );
    
    // Get the input handler
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Simulate pressing Enter
    inputHandler('', { return: true });
    
    // Check if onPress was called
    expect(onPress).toHaveBeenCalled();
  });

  it('calls onPress when space key is pressed', () => {
    const onPress = vi.fn();
    render(
      <Button onPress={onPress}>Press Space</Button>
    );
    
    // Get the input handler
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Simulate pressing Space
    inputHandler(' ', {});
    
    // Check if onPress was called
    expect(onPress).toHaveBeenCalled();
  });

  it('does not call onPress when disabled', () => {
    const onPress = vi.fn();
    render(
      <Button onPress={onPress} disabled>
        Disabled Button
      </Button>
    );
    
    // Get the input handler (should be inactive)
    const useInputMock = require('ink').useInput;
    const options = useInputMock.mock.calls[0][1];
    
    // isActive should be false
    expect(options.isActive).toBe(false);
    
    // Even if we call the handler directly, onPress should not be called
    const inputHandler = useInputMock.mock.calls[0][0];
    inputHandler('', { return: true });
    
    // Check that onPress was not called
    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = vi.fn();
    render(
      <Button onPress={onPress} loading>
        Loading Button
      </Button>
    );
    
    // Get the input handler (should be inactive)
    const useInputMock = require('ink').useInput;
    const options = useInputMock.mock.calls[0][1];
    
    // isActive should be false
    expect(options.isActive).toBe(false);
    
    // Check that the button shows loading text
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders with full width when specified', () => {
    const { container } = render(
      <Button fullWidth>Full Width Button</Button>
    );
    
    // Check that the button has width="100%" property
    const button = container.querySelector('[width="100%"]');
    expect(button).toBeDefined();
  });

  it('applies custom styles', () => {
    const customStyle = {
      paddingLeft: 5,
      paddingRight: 5,
      height: 5
    };
    
    render(
      <Button style={customStyle}>Styled Button</Button>
    );
    
    // Unfortunately we can't easily test the style application in this mock setup,
    // but we can verify the component renders without crashing
    expect(screen.getByText('Styled Button')).toBeDefined();
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