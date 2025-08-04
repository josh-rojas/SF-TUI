import React from 'react';
import { render, fireEvent } from '../renderWithInk';
import { KeyboardProvider, useKeyboardShortcuts, ShortcutAction } from '../../src/context/KeyboardShortcuts';
import { act } from 'react-dom/test-utils';

const TestComponent = () => {
  const { registerShortcut, executeAction } = useKeyboardShortcuts();

  return (
    <div>
      <button onClick={() => registerShortcut('test', { key: 't', action: 'test', description: 'Test Shortcut' })}>Register Shortcut</button>
      <button onClick={() => executeAction('test')}>Execute Action</button>
    </div>
  );
};

describe('KeyboardShortcuts', () => {
  it('should register and execute a shortcut', () => {
    const actionHandlers = {
      test: vi.fn(),
    };

    const { getByText } = render(
      <KeyboardProvider actionHandlers={actionHandlers}>
        <TestComponent />
      </KeyboardProvider>
    );

    act(() => {
      fireEvent.click(getByText('Register Shortcut'));
    });

    act(() => {
      fireEvent.click(getByText('Execute Action'));
    });

    expect(actionHandlers.test).toHaveBeenCalledTimes(1);
  });
});
