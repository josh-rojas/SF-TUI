import React, { ReactNode } from 'react';
import { 
  render as rtlRender, 
  RenderOptions, 
  MatcherFunction,
  fireEvent,
  screen
} from '@testing-library/react';
import { Text, Box, useApp, useInput } from 'ink';
import { vi, beforeEach, expect, afterEach } from 'vitest';
import { ThemeProvider } from '../src/themes';
import '@testing-library/jest-dom/vitest';

// Custom wrapper that provides theme context
const AllTheProviders = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <Box>{children}</Box>
  </ThemeProvider>
);

// Custom query functions for Ink components
const queryHelpers = {
  queryByTestId: (container: HTMLElement, id: string) => {
    return container.querySelector(`[data-testid="${id}"]`);
  },
  getAllByTestId: (container: HTMLElement, id: string) => {
    return Array.from(container.querySelectorAll(`[data-testid="${id}"]`));
  },
  getByTestId: (container: HTMLElement, id: string) => {
    const element = queryHelpers.queryByTestId(container, id);
    if (!element) {
      throw new Error(`Unable to find an element by: [data-testid="${id}"]`);
    }
    return element;
  },
  queryByText: (container: HTMLElement, text: string | RegExp) => {
    const matcher: MatcherFunction = (content, element) => {
      if (!element) return false;
      const hasText = (node: Element | null) => {
        if (!node) return false;
        const nodeText = node.textContent || '';
        return typeof text === 'string' 
          ? nodeText.includes(text)
          : text.test(nodeText);
      };
      
      const nodeHasText = hasText(element);
      const childrenDontHaveText = Array.from(element.children).every(
        child => !hasText(child as Element)
      );
      return nodeHasText && childrenDontHaveText;
    };
    
    const elements = Array.from(container.querySelectorAll('*'));
    return elements.find(
      (node): node is HTMLElement => matcher('', node as HTMLElement)
    ) || null;
  },
};

// Custom render function that wraps components with necessary providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  const result = rtlRender(ui, {
    wrapper: AllTheProviders,
    ...options,
  });

  // Add custom query functions to the returned object
  return {
    ...result,
    queryByTestId: (id: string) => queryHelpers.queryByTestId(result.container, id),
    getByTestId: (id: string) => queryHelpers.getByTestId(result.container, id),
    getAllByTestId: (id: string) => queryHelpers.getAllByTestId(result.container, id),
    queryByText: (text: string | RegExp) => queryHelpers.queryByText(result.container, text),
  };
};

// Setup mocks before each test
export function setupMocks() {
  vi.clearAllMocks();
  
  // Mock console methods
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  
  // Cleanup after each test
  afterEach(() => {
    vi.restoreAllMocks();
  });
}

/**
 * Helper to get text content from a test container
 */
export const getTextContent = (container: HTMLElement): string => {
  return container.textContent || '';
};

/**
 * Helper to check if text exists in the container
 */
export const hasText = (container: HTMLElement, text: string | RegExp): boolean => {
  const content = getTextContent(container);
  return typeof text === 'string' 
    ? content.includes(text)
    : text.test(content);
};

/**
 * Helper to type into an input field
 */
export const typeInInput = (
  input: HTMLElement,
  value: string,
  options: { delay?: number } = {}
): void => {
  fireEvent.change(input, { target: { value } });
};

/**
 * Helper to press a key
 */
export const pressKey = (
  element: HTMLElement,
  key: string,
  options: KeyboardEventInit = {}
): void => {
  fireEvent.keyDown(element, { key, ...options });
  fireEvent.keyUp(element, { key, ...options });
};

/**
 * Helper to wait for a condition to be true
 */
export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 1000,
  interval = 50
): Promise<void> => {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await condition()) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Condition not met within ${timeout}ms`);
};

// Re-export everything
export * from '@testing-library/react';
// Override render method
export { customRender as render };

// Add type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveTextContent(expected: string | RegExp): R;
      toHaveAttribute(attr: string, value?: any): R;
      toHaveStyle(style: Record<string, string>): R;
    }
  }
}

// Custom matchers for testing-library
expect.extend({
  toHaveTextContent(received, expected) {
    const textContent = received.textContent;
    const pass = typeof expected === 'string' 
      ? textContent?.includes(expected) ?? false
      : expected.test(textContent || '');

    return {
      pass,
      message: () =>
        `Expected element ${pass ? 'not ' : ''}to have text content: ${expected}\n` +
        `Received: ${textContent}`,
    };
  },
  toHaveAttribute(received, attr, value) {
    if (!(received instanceof Element)) {
      return {
        pass: false,
        message: () => `Expected ${received} to be a DOM element`,
      };
    }

    const hasAttribute = received.hasAttribute(attr);
    const actualValue = received.getAttribute(attr);
    
    if (value === undefined) {
      return {
        pass: hasAttribute,
        message: () =>
          `Expected element ${hasAttribute ? 'not ' : ''}to have attribute: ${attr}`,
      };
    }

    const pass = hasAttribute && actualValue === String(value);
    
    return {
      pass,
      message: () =>
        `Expected element ${pass ? 'not ' : ''}to have attribute ${attr} with value: ${value}\n` +
        `Received: ${actualValue}`,
    };
  },
  toHaveStyle(received, style) {
    if (!(received instanceof HTMLElement)) {
      return {
        pass: false,
        message: () => `Expected ${received} to be an HTMLElement`,
      };
    }

    const receivedStyle = received.style;
    const styleProps = typeof style === 'string' 
      ? style.split(';')
          .map(s => s.trim())
          .filter(Boolean)
          .map(declaration => {
            const [prop, value] = declaration.split(':').map(s => s.trim());
            return [prop, value];
          })
      : Object.entries(style);
      
    const missingStyles: string[] = [];
    const incorrectStyles: string[] = [];

    for (const [prop, value] of styleProps) {
      if (!prop) continue;
      
      const cssProp = prop.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`);
      const actualValue = receivedStyle.getPropertyValue(cssProp);
      
      if (actualValue === '') {
        missingStyles.push(prop);
      } else if (actualValue !== value) {
        incorrectStyles.push(`${prop}: expected "${value}", got "${actualValue}"`);
      }
    }

    const pass = missingStyles.length === 0 && incorrectStyles.length === 0;
    
    return {
      pass,
      message: () => {
        if (missingStyles.length > 0) {
          return `Missing styles: ${missingStyles.join(', ')}`;
        }
        if (incorrectStyles.length > 0) {
          return `Incorrect styles:\n  ${incorrectStyles.join('\n  ')}`;
        }
        return '';
      },
    };
  },
});

// Mock Ink components
export const mockInk = () => {
  vi.mock('ink', async () => {
    const actual = await vi.importActual('ink');
    
    return {
      ...actual,
      useInput: vi.fn(),
      useApp: vi.fn(() => ({
        exit: vi.fn(),
      })),
      Text: ({ children }: { children: ReactNode }) => (
        <span>{children}</span>
      ),
      Box: ({ children }: { children: ReactNode }) => (
        <div>{children}</div>
      ),
    };
  });
};

// Mock theme
export const mockTheme = () => {
  vi.mock('../src/themes', async () => {
    const actual = await vi.importActual('../src/themes');
    
    return {
      ...actual,
      useTheme: vi.fn(() => ({
        colors: {
          primary: '#0176D3',
          secondary: '#1B96FF',
          success: '#2E844A',
          warning: '#FFB75D',
          error: '#EA001E',
          info: '#2E7D32',
          text: '#181818',
          textMuted: '#706E6B',
          background: '#FFFFFF',
          backgroundHover: '#F3F3F3',
          border: '#DDDBDA',
          highlight: '#F3F2F2',
        },
      })),
    };
  });
};

// Initialize mocks by default
setupMocks();
