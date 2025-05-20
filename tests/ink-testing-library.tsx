import React from 'react';
import { render as rtlRender } from '@testing-library/react';
import { Text, Box, useApp, useInput } from 'ink';
import { vi } from 'vitest';

// Create a custom render function that wraps components with Ink's context providers
const render = (ui: React.ReactElement) => {
  // Mock useApp
  vi.mocked(useApp).mockReturnValue({
    exit: vi.fn(),
  });

  // Mock useInput
  vi.mocked(useInput).mockImplementation(() => {});

  // Render the component with necessary providers
  return rtlRender(
    <Box>
      <Text>{ui}</Text>
    </Box>
  );
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';

// Override the render method
export { render };

// Mock Ink components
export const mockInk = () => {
  vi.mock('ink', async () => {
    const actual = await vi.importActual('ink');
    
    return {
      ...actual,
      // Simple mocks for Ink components
      Text: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
      Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
      useApp: vi.fn(),
      useInput: vi.fn(),
    };
  });
};
