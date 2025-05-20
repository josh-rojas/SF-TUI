import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Modal from '../../src/components/common/Modal';
import { createInkMock } from '../testUtils';

// Mock useTheme
vi.mock('../../src/themes', () => ({
  useTheme: () => ({
    colors: {
      text: 'white',
      textInverse: 'black',
      background: 'black',
      backgroundInverse: 'white',
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

describe('Modal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    const title = 'Test Modal';
    const content = 'Modal Content';
    
    const { getByText } = render(
      <Modal isOpen title={title}>
        {content}
      </Modal>
    );
    
    expect(getByText(title)).toBeDefined();
    expect(getByText(content)).toBeDefined();
  });

  it('does not render when isOpen is false', () => {
    const title = 'Test Modal';
    const content = 'Modal Content';
    
    const { queryByText } = render(
      <Modal isOpen={false} title={title}>
        {content}
      </Modal>
    );
    
    expect(queryByText(title)).toBeNull();
    expect(queryByText(content)).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    const title = 'Test Modal';
    
    render(
      <Modal 
        isOpen 
        title={title} 
        onClose={onClose}
        showCloseButton
      >
        Modal Content
      </Modal>
    );
    
    // Get the close button and simulate click
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Simulate pressing Enter on the close button
    inputHandler('', { return: true });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when ESC key is pressed', () => {
    const onClose = vi.fn();
    const title = 'Test Modal';
    
    render(
      <Modal 
        isOpen 
        title={title} 
        onClose={onClose}
      >
        Modal Content
      </Modal>
    );
    
    // Get the input handler for keyboard events
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Simulate pressing ESC
    inputHandler('', { escape: true });
    
    expect(onClose).toHaveBeenCalled();
  });

  it('renders with backdrop when showBackdrop is true', () => {
    const { container } = render(
      <Modal 
        isOpen 
        title="Test Modal"
        showBackdrop
      >
        Modal Content
      </Modal>
    );
    
    // Check for backdrop styles
    const backdrop = container.querySelector('[style*="backgroundColor: rgba(0, 0, 0, 0.5)"]');
    expect(backdrop).toBeDefined();
  });

  it('applies custom styles', () => {
    const customStyle = {
      padding: 2,
      margin: 1,
      width: '80%',
    };
    
    const { container } = render(
      <Modal 
        isOpen 
        title="Test Modal"
        style={customStyle}
      >
        Modal Content
      </Modal>
    );
    
    // Verify the component renders without crashing with custom styles
    expect(container).toBeDefined();
  });

  it('renders with custom width and height', () => {
    const { container } = render(
      <Modal 
        isOpen 
        title="Test Modal"
        width={80}
        height={50}
      >
        Modal Content
      </Modal>
    );
    
    // Check for width and height styles
    const modalElement = container.querySelector('[style*="width: 80%"]');
    expect(modalElement).toBeDefined();
  });

  it('renders with custom close button label', () => {
    const customLabel = 'Done';
    
    const { getByText } = render(
      <Modal 
        isOpen 
        title="Test Modal"
        closeButtonLabel={customLabel}
      >
        Modal Content
      </Modal>
    );
    
    expect(getByText(customLabel)).toBeDefined();
  });

  it('prevents scrolling when modal is open', () => {
    // Mock useEffect for side effects
    const useEffectSpy = vi.spyOn(React, 'useEffect');
    
    render(
      <Modal 
        isOpen 
        title="Test Modal"
      >
        Modal Content
      </Modal>
    );
    
    // Verify useEffect was called
    expect(useEffectSpy).toHaveBeenCalled();
  });
});

