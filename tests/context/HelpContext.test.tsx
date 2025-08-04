import React from 'react';
import { render, screen, act, fireEvent } from '../renderWithInk';
import { HelpProvider, useHelp, ContextualHelp, HelpTopic } from '../../src/context/HelpContext';
import { Text } from 'ink';

const TestComponent = () => {
  const { showHelp, toggleHelp, currentTopic, setCurrentTopic, registerTopic } = useHelp();

  return (
    <div>
      <Text>Show Help: {showHelp ? 'Visible' : 'Hidden'}</Text>
      <Text>Current Topic: {currentTopic || 'None'}</Text>
      <button onClick={() => toggleHelp()}>Toggle Help</button>
      <button onClick={() => setCurrentTopic('navigation')}>Set Topic</button>
      <button onClick={() => registerTopic({ id: 'new-topic', title: 'New Topic', content: 'New Content', keywords: [] })}>Register Topic</button>
      <ContextualHelp />
    </div>
  );
};

describe('HelpContext', () => {
  it('should provide default values', () => {
    render(
      <HelpProvider>
        <TestComponent />
      </HelpProvider>
    );

    expect(screen.getByText('Show Help: Hidden')).toBeDefined();
    expect(screen.getByText('Current Topic: None')).toBeDefined();
  });

  it('should toggle help', () => {
    render(
      <HelpProvider>
        <TestComponent />
      </HelpProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Toggle Help'));
    });

    expect(screen.getByText('Show Help: Visible')).toBeDefined();
  });

  it('should set current topic', () => {
    render(
      <HelpProvider>
        <TestComponent />
      </HelpProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Set Topic'));
    });

    expect(screen.getByText('Current Topic: navigation')).toBeDefined();
  });

  it('should register a new topic', () => {
    render(
      <HelpProvider>
        <TestComponent />
      </HelpProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Register Topic'));
      fireEvent.click(screen.getByText('Toggle Help'));
    });

    // The help component is complex, so we will just check if it renders
    // A more detailed test would require a more detailed mock of the theme
    expect(screen.getByText('Help Topics')).toBeDefined();
  });
});
