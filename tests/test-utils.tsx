import React, { ReactNode } from 'react';
import { 
  render as rtlRender, 
  RenderOptions, 
  MatcherFunction, 
  RenderResult,
  screen,
  fireEvent
} from '@testing-library/react';
import { Text, Box, useApp, useInput } from 'ink';
import { vi, beforeEach, expect, afterEach } from 'vitest';
import { ThemeProvider } from '../src/themes';
import '@testing-library/jest-dom/vitest';
import { Mock } from 'vitest';

// Custom wrapper that provides theme context
const AllTheProviders = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    <Box>
      <Text>{children}</Text>
    </Box>
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
      Text: ({ children, ...props }: { children: ReactNode; [key: string]: any }) => {
        const style = Object.entries(props)
          .filter(([key]) => key.startsWith('color') || key === 'bold' || key === 'underline')
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
          
        return <span style={style} data-testid={props['data-testid']}>{children}</span>;
      },
      Box: ({ children, ...props }: { children: ReactNode; [key: string]: any }) => {
        const style = Object.entries(props)
          .filter(([key]) => key.startsWith('border') || key === 'padding' || key === 'margin')
          .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
          
        return <div style={style} data-testid={props['data-testid']}>{children}</div>;
      },
      useApp: () => ({
        exit: vi.fn(),
      }),
      useInput: vi.fn(),
    };
  });
};

// Mock theme
export const mockTheme = () => {
  vi.mock('../src/themes', async () => {
    const actual = await vi.importActual('../src/themes');
    return {
      ...actual as object,
      useTheme: () => ({
        colors: {
          primary: '#36A9E1',
          secondary: '#2E844A',
          success: '#2E844A',
          warning: '#FE9339',
          error: '#EA001E',
          info: '#0176D3',
          text: '#181818',
          textInverse: '#FFFFFF',
          textMuted: '#706E6B',
          background: '#FFFFFF',
          backgroundHover: '#F3F3F3',
          border: '#DDDBDA',
          highlight: '#F3F2F2',
          primaryBackground: 'rgba(0, 0, 255, 0.2)'
        },
      }),
    };
  });
};

// Export all mocks
export const setupMocks = () => {
  mockInk();
  mockTheme();
};
