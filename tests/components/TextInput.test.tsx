import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TextInput } from '../../src/components/common/TextInput';
import { createInkMock } from '../testUtils';

// Create Ink mocks
createInkMock();

describe('TextInput Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <TextInput value="" onChange={onChange} />
    );
    
    // Should render with a cursor
    expect(getByText('█')).toBeDefined();
  });

  it('renders with placeholder when value is empty', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <TextInput value="" onChange={onChange} placeholder="Enter text..." />
    );
    
    // Should show placeholder
    expect(getByText('Enter text...')).toBeDefined();
  });

  it('renders with mask when provided', () => {
    const onChange = vi.fn();
    const { getByText } = render(
      <TextInput value="password" onChange={onChange} mask="*" />
    );
    
    // Should show masked value
    expect(getByText('********')).toBeDefined();
  });

  it('displays validation error when validation fails', () => {
    const onChange = vi.fn();
    const validate = (value: string) => value.length > 3 || 'Value must be longer than 3 characters';
    
    const { getByText } = render(
      <TextInput value="ab" onChange={onChange} validate={validate} />
    );
    
    // Should show validation error
    expect(getByText('Value must be longer than 3 characters')).toBeDefined();
  });

  it('calls onChange when input changes', () => {
    const onChange = vi.fn();
    render(<TextInput value="test" onChange={onChange} />);
    
    // Simulate typing
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Simulate typing 'a'
    inputHandler('a', {});
    
    // Check if onChange was called with updated value
    expect(onChange).toHaveBeenCalledWith('testa');
  });

  it('calls onSubmit when Enter is pressed', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    
    render(
      <TextInput value="test" onChange={onChange} onSubmit={onSubmit} />
    );
    
    // Get the input handler
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Simulate pressing Enter
    inputHandler('', { return: true });
    
    // Check if onSubmit was called
    expect(onSubmit).toHaveBeenCalledWith('test');
  });

  it('does not call onSubmit when validation fails', () => {
    const onChange = vi.fn();
    const onSubmit = vi.fn();
    const validate = (value: string) => value.length > 3 || 'Value must be longer than 3 characters';
    
    render(
      <TextInput 
        value="ab" 
        onChange={onChange} 
        onSubmit={onSubmit} 
        validate={validate} 
      />
    );
    
    // Get the input handler
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Simulate pressing Enter
    inputHandler('', { return: true });
    
    // onSubmit should not be called because validation failed
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('handles cursor movement with arrow keys', () => {
    const onChange = vi.fn();
    render(<TextInput value="test" onChange={onChange} />);
    
    // Get the input handler
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Initially cursor should be at the end (after "test")
    
    // Move cursor left
    inputHandler('', { leftArrow: true });
    
    // Add a character at the new cursor position (between "t" and "")
    inputHandler('X', {});
    
    // Value should now be "tesXt"
    expect(onChange).toHaveBeenCalledWith('tesXt');
  });

  it('handles backspace', () => {
    const onChange = vi.fn();
    render(<TextInput value="test" onChange={onChange} />);
    
    // Get the input handler
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Move cursor left first (cursor will be between 't' and '')
    inputHandler('', { leftArrow: true });
    
    // Press backspace (should delete 's')
    inputHandler('', { backspace: true });
    
    // Value should now be "tet"
    expect(onChange).toHaveBeenCalledWith('tet');
  });

  it('handles home and end keys', () => {
    const onChange = vi.fn();
    render(<TextInput value="test" onChange={onChange} />);
    
    // Get the input handler
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Press home key to move cursor to beginning
    inputHandler('', { home: true });
    
    // Add a character at the beginning
    inputHandler('X', {});
    
    // Value should now be "Xtest"
    expect(onChange).toHaveBeenCalledWith('Xtest');
    
    // Press end key to move cursor to end
    inputHandler('', { end: true });
    
    // Add another character at the end
    inputHandler('Y', {});
    
    // Value should now be "XtestY"
    expect(onChange).toHaveBeenCalledWith('XtestY');
  });

  it('handles controlled value updates', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TextInput value="initial" onChange={onChange} />
    );
    
    // Update the value prop
    rerender(
      <TextInput value="updated" onChange={onChange} />
    );
    
    // Get the input handler
    const useInputMock = require('ink').useInput;
    const inputHandler = useInputMock.mock.calls[0][0];
    
    // Add a character at the end
    inputHandler('X', {});
    
    // Value should now be "updatedX"
    expect(onChange).toHaveBeenCalledWith('updatedX');
  });

  it('truncates long text when width is limited', () => {
    const onChange = vi.fn();
    const { container } = render(
      <TextInput value="this is a very long text that should be truncated" onChange={onChange} width={10} />
    );
    
    // Text should be truncated, so we shouldn't see the full text
    expect(container.textContent).not.toContain('this is a very long text that should be truncated');
    
    // Should contain ellipsis to indicate truncation
    expect(container.textContent).toContain('…');
  });
});