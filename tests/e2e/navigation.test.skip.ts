import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupE2E, E2EContext } from './setup';

describe('Navigation Flows', () => {
  let e2e: E2EContext;
  
  beforeAll(async () => {
    // Set up E2E environment
    e2e = await setupE2E({
      timeout: 10000, // Give more time for app startup
    });
  });
  
  afterAll(async () => {
    // Clean up after tests
    await e2e.cleanup();
  });
  
  it('should navigate to all main screens', async () => {
    // Test navigation to all main screens
    const screens = ['org', 'metadata', 'run', 'project', 'plugins', 'auth', 'alias'];
    
    for (const screen of screens) {
      await e2e.navigateTo(screen);
      
      // Verify we're on the correct screen
      switch (screen) {
        case 'org':
          await e2e.waitForText('Org Manager');
          break;
        case 'metadata':
          await e2e.waitForText('Metadata Tools');
          break;
        case 'run':
          await e2e.waitForText('Run Tools');
          break;
        case 'project':
          await e2e.waitForText('Project Generator');
          break;
        case 'plugins':
          await e2e.waitForText('Plugins');
          break;
        case 'auth':
          await e2e.waitForText('Auth Manager');
          break;
        case 'alias':
          await e2e.waitForText('Alias Manager');
          break;
      }
      
      // Go back to main menu
      e2e.sendInput('q');
      await e2e.waitForText('Main Menu');
    }
  });
  
  it('should navigate using keyboard shortcuts', async () => {
    // Test keyboard navigation with shortcuts
    
    // Press 'o' for Org Manager
    e2e.sendInput('o');
    await e2e.waitForText('Org Manager');
    
    // Go back to main menu
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
    
    // Press 'm' for Metadata Tools
    e2e.sendInput('m');
    await e2e.waitForText('Metadata Tools');
    
    // Go back to main menu
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
    
    // Press 'r' for Run Tools
    e2e.sendInput('r');
    await e2e.waitForText('Run Tools');
    
    // Go back to main menu
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
  });
  
  it('should navigate through Org Manager flow', async () => {
    // Test Org Manager specific flows
    await e2e.navigateTo('org');
    
    // Test tab navigation
    e2e.sendInput('\t'); // Tab key
    await e2e.waitForPattern(/\[\s*Delete\s*\]/);
    
    // Test arrow navigation
    e2e.sendInput('\u001b[A'); // Up arrow
    await e2e.waitForPattern(/\[\s*Refresh\s*\]/);
    
    e2e.sendInput('\u001b[B'); // Down arrow
    await e2e.waitForPattern(/\[\s*Delete\s*\]/);
    
    // Test selecting an org (if available)
    e2e.sendInput('\u001b[A'); // Up arrow to orgs list
    e2e.sendInput('\r'); // Enter to select if an org is available
    
    // Go back to main menu
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
  });
  
  it('should navigate through Run Tools flow', async () => {
    // Test Run Tools specific flows
    await e2e.navigateTo('run');
    
    // Test tab navigation through Run Tools tabs
    e2e.sendInput('\t'); // Tab to Apex tab
    await e2e.waitForPattern(/Apex/i);
    
    e2e.sendInput('\t'); // Tab to SOQL tab
    await e2e.waitForPattern(/SOQL/i);
    
    e2e.sendInput('\t'); // Tab to Flow tab
    await e2e.waitForPattern(/Flow/i);
    
    // Go back to main menu
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
  });
  
  it('should navigate help screens', async () => {
    // Test help navigation
    
    // Press '?' for help
    e2e.sendInput('?');
    await e2e.waitForText('Help');
    
    // Press Escape to exit help
    e2e.sendInput('\u001b');
    await e2e.waitForText('Main Menu');
  });
  
  it('should navigate with transitions', async () => {
    // Test transition animations are working
    await e2e.navigateTo('project');
    
    // We should see the Project Generator screen after transition
    await e2e.waitForText('Project Generator');
    
    // Go back to main menu
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
  });
});

// Deep navigation tests for complex flows
describe('Deep Navigation Flows', () => {
  let e2e: E2EContext;
  
  beforeAll(async () => {
    // Set up E2E environment
    e2e = await setupE2E({
      timeout: 10000,
    });
  });
  
  afterAll(async () => {
    // Clean up after tests
    await e2e.cleanup();
  });
  
  it('should navigate through multi-level menus', async () => {
    // Test navigation through nested menus
    
    // Navigate to Metadata Tools
    await e2e.navigateTo('metadata');
    
    // Test selecting a metadata type (will differ based on implementation)
    // This is a placeholder for the actual test logic
    e2e.sendInput('\t'); // Tab to first metadata type
    e2e.sendInput('\r'); // Enter to select
    
    // Go back
    e2e.sendInput('q');
    
    // Go back to main menu
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
  });
  
  it('should handle error cases and recovery', async () => {
    // Test error handling in navigation
    
    // Try to navigate to non-existent screen with invalid key
    e2e.sendInput('z'); // Assuming 'z' is not mapped to any screen
    
    // We should still be on the main menu
    expect(e2e).toContainOutput('Main Menu');
    
    // Press Escape to ensure we're at the main menu
    e2e.sendInput('\u001b');
    await e2e.waitForText('Main Menu');
  });
  
  it('should handle rapid navigation between screens', async () => {
    // Test rapid navigation between screens
    
    // Navigate to Org Manager
    await e2e.navigateTo('org');
    
    // Quickly go back and to another screen
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
    
    // Navigate to Metadata Tools
    await e2e.navigateTo('metadata');
    
    // Quickly go back and to another screen
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
    
    // Navigate to Run Tools
    await e2e.navigateTo('run');
    
    // Go back to main menu
    e2e.sendInput('q');
    await e2e.waitForText('Main Menu');
  });
});