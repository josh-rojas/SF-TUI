import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import SelectInput from 'ink-select-input';
import { MainMenu } from '../../src/components/MainMenu';
import { createE2ETestEnvironment, renderForE2E } from './e2eUtils';

// Create the E2E test environment
const e2e = createE2ETestEnvironment();

// Mock components
vi.mock('../../src/components/org/OrgManager', () => ({
  default: () => <div data-testid="org-manager">OrgManager Component</div>
}));

vi.mock('../../src/components/project/ProjectGenerator', () => ({
  default: () => <div data-testid="project-generator">ProjectGenerator Component</div>
}));

vi.mock('../../src/components/auth/AuthManager', () => ({
  default: () => <div data-testid="auth-manager">AuthManager Component</div>
}));

vi.mock('../../src/components/alias/AliasManager', () => ({
  default: () => <div data-testid="alias-manager">AliasManager Component</div>
}));

vi.mock('../../src/components/metadata/MetadataTools', () => ({
  default: () => <div data-testid="metadata-tools">MetadataTools Component</div>
}));

vi.mock('../../src/components/run/RunTools', () => ({
  default: () => <div data-testid="run-tools">RunTools Component</div>
}));

vi.mock('../../src/components/plugins/PluginsPanel', () => ({
  default: () => <div data-testid="plugins-panel">PluginsPanel Component</div>
}));

// Mock useTheme
vi.mock('../../src/themes', async () => {
  return {
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
    getTheme: () => ({
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
    ThemeContext: {
      Provider: ({ children }) => children
    },
    ThemeProvider: ({ children }) => children
  };
});

describe('MainMenu E2E Tests', () => {
  beforeEach(() => {
    e2e.setupMocks();
  });
  
  afterEach(() => {
    e2e.cleanupMocks();
  });
  
  it('should render the main menu', async () => {
    const { getByText } = renderForE2E(<MainMenu />);
    
    // Should render the menu title
    expect(getByText(/Salesforce TUI - Interactive CLI for Salesforce/)).toBeDefined();
    
    // Should render all menu items
    expect(getByText(/Org Manager/)).toBeDefined();
    expect(getByText(/Project Generator/)).toBeDefined();
    expect(getByText(/Auth Manager/)).toBeDefined();
    expect(getByText(/Alias Manager/)).toBeDefined();
    expect(getByText(/Metadata Tools/)).toBeDefined();
    expect(getByText(/Run Tools/)).toBeDefined();
    expect(getByText(/Plugins/)).toBeDefined();
    expect(getByText(/Exit/)).toBeDefined();
  });
  
  it('should navigate to OrgManager when selected', async () => {
    const { getByText, findByTestId } = renderForE2E(<MainMenu />);
    
    // Find the Org Manager menu item
    const orgManagerItem = getByText(/Org Manager/);
    
    // Simulate selecting Org Manager
    const onSelect = vi.mocked(SelectInput).mock.calls[0][0].onSelect;
    
    // Call the onSelect with the org item value
    onSelect({ value: 'org' });
    
    // OrgManager should be rendered
    expect(await findByTestId('org-manager')).toBeDefined();
  });
  
  it('should exit when Exit is selected', async () => {
    renderForE2E(<MainMenu />);
    
    // Find the Exit menu item and select it
    const onSelect = vi.mocked(SelectInput).mock.calls[0][0].onSelect;
    
    // Call the onSelect with the exit item value
    onSelect({ value: 'exit' });
    
    // Should call exit
    expect(e2e.mockExit).toHaveBeenCalled();
  });
  
  it('should return to main menu when ESC is pressed from a component', async () => {
    const { getByText, findByTestId, queryByTestId } = renderForE2E(<MainMenu />);
    
    // First navigate to OrgManager
    const onSelect = vi.mocked(SelectInput).mock.calls[0][0].onSelect;
    onSelect({ value: 'org' });
    
    // OrgManager should be rendered
    expect(await findByTestId('org-manager')).toBeDefined();
    
    // Simulate pressing ESC
    e2e.simulateKeyPress('escape');
    
    // Should return to main menu
    expect(getByText(/What would you like to do/)).toBeDefined();
    expect(queryByTestId('org-manager')).toBeNull();
  });
  
  it('should navigate to multiple components sequentially', async () => {
    const { findByTestId } = renderForE2E(<MainMenu />);
    
    // Get the select handler
    const onSelect = vi.mocked(SelectInput).mock.calls[0][0].onSelect;
    
    // Navigate to OrgManager
    onSelect({ value: 'org' });
    expect(await findByTestId('org-manager')).toBeDefined();
    
    // Go back to main menu
    e2e.simulateKeyPress('escape');
    
    // Navigate to ProjectGenerator
    onSelect({ value: 'project' });
    expect(await findByTestId('project-generator')).toBeDefined();
    
    // Go back to main menu
    e2e.simulateKeyPress('escape');
    
    // Navigate to AuthManager
    onSelect({ value: 'auth' });
    expect(await findByTestId('auth-manager')).toBeDefined();
  });
});