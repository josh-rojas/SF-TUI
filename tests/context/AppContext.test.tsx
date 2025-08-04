import React from 'react';
import { render, screen, act, fireEvent } from '../renderWithInk';
import { AppProvider, useAppContext } from '../../src/context/AppContext';
import { Text } from 'ink';

const TestComponent = () => {
  const { state, setTheme, setSelectedOrg, setDevhubOrg, toggleStatusBar, toggleHelp } = useAppContext();

  return (
    <div>
      <Text>Theme: {state.themeName}</Text>
      <Text>Selected Org: {state.selectedOrg || 'None'}</Text>
      <Text>DevHub Org: {state.devhubOrg || 'None'}</Text>
      <Text>Status Bar: {state.showStatusBar ? 'Visible' : 'Hidden'}</Text>
      <Text>Help: {state.showHelp ? 'Visible' : 'Hidden'}</Text>
      <button onClick={() => setTheme('dark')}>Set Dark Theme</button>
      <button onClick={() => setSelectedOrg('test-org')}>Set Selected Org</button>
      <button onClick={() => setDevhubOrg('devhub-org')}>Set DevHub Org</button>
      <button onClick={() => toggleStatusBar()}>Toggle Status Bar</button>
      <button onClick={() => toggleHelp()}>Toggle Help</button>
    </div>
  );
};

describe('AppContext', () => {
  it('should provide default values', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByText('Theme: base')).toBeDefined();
    expect(screen.getByText('Selected Org: None')).toBeDefined();
    expect(screen.getByText('DevHub Org: None')).toBeDefined();
    expect(screen.getByText('Status Bar: Visible')).toBeDefined();
    expect(screen.getByText('Help: Hidden')).toBeDefined();
  });

  it('should update theme', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Set Dark Theme'));
    });

    expect(screen.getByText('Theme: dark')).toBeDefined();
  });

  it('should update selected org', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Set Selected Org'));
    });

    expect(screen.getByText('Selected Org: test-org')).toBeDefined();
  });

  it('should update devhub org', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Set DevHub Org'));
    });

    expect(screen.getByText('DevHub Org: devhub-org')).toBeDefined();
  });

  it('should toggle status bar', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Toggle Status Bar'));
    });

    expect(screen.getByText('Status Bar: Hidden')).toBeDefined();
  });

  it('should toggle help', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      fireEvent.click(screen.getByText('Toggle Help'));
    });

    expect(screen.getByText('Help: Visible')).toBeDefined();
  });
});
