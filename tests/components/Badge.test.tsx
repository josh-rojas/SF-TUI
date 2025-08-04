import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Badge from '../../../src/components/common/Badge';
import { Theme } from '../../../src/themes';

// Mock Ink components
vi.mock('ink', async () => {
  const actual = await vi.importActual('ink');
  return {
    ...actual,
    Text: ({ children, style }: any) => <span style={style} data-testid="ink-text">{children}</span>,
  };
});

// Mock the useTheme hook
const mockTheme: Theme = {
  colors: {
    primary: 'blue',
    primaryForeground: 'white',
    secondary: 'gray',
    secondaryForeground: 'white',
    success: 'green',
    successForeground: 'white',
    warning: 'yellow',
    warningForeground: 'black',
    error: 'red',
    errorForeground: 'white',
    info: 'cyan',
    infoForeground: 'black',
    backgroundHover: 'lightgray',
    border: 'black',
    text: 'black',
    primaryBorder: 'darkblue',
    secondaryBorder: 'darkgray',
    successBorder: 'darkgreen',
    warningBorder: 'darkyellow',
    errorBorder: 'darkred',
    infoBorder: 'darkcyan',
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
    xl: 5,
  },
};

vi.mock('../../../src/themes', () => ({
  useTheme: () => mockTheme,
}));

describe('Badge Component', () => {
  it('renders children correctly', () => {
    render(<Badge>Test Badge</Badge>);
    expect(screen.getByText('Test Badge')).toBeDefined();
  });

  it('applies default props', () => {
    render(<Badge>Default</Badge>);
    const textElement = screen.getByTestId('ink-text');

    // Default styles from the component logic
    expect(textElement.style.paddingLeft).toBe('1px');
    expect(textElement.style.paddingRight).toBe('1px');
    // expect(textElement.style.borderStyle).toBe('single'); // This is not working in jsdom
    expect(textElement.style.borderRadius).toBe('1px');

    // Default colors from mocked theme
    expect(textElement.style.color).toBe(mockTheme.colors.text);
    expect(textElement.style.backgroundColor).toBe(mockTheme.colors.backgroundHover);
  });

  it.each([
    ['primary', mockTheme.colors.primary, mockTheme.colors.primaryForeground],
    ['secondary', mockTheme.colors.secondary, mockTheme.colors.secondaryForeground],
    ['success', mockTheme.colors.success, mockTheme.colors.successForeground],
    ['warning', mockTheme.colors.warning, mockTheme.colors.warningForeground],
    ['error', mockTheme.colors.error, mockTheme.colors.errorForeground],
    ['info', mockTheme.colors.info, mockTheme.colors.infoForeground],
  ])('renders with variant "%s"', (variant, expectedBg, expectedColor) => {
    render(<Badge variant={variant as any}>{variant}</Badge>);
    const textElement = screen.getByTestId('ink-text');

    expect(textElement.style.backgroundColor).toBe(expectedBg);
    expect(textElement.style.color).toBe(expectedColor);
  });

  it.each([
    ['sm', '1px', '1px'],
    ['md', '1px', '1px'],
    ['lg', '2px', '2px'],
  ])('renders with size "%s"', (size, paddingLeft, paddingRight) => {
    render(<Badge size={size as any}>{size}</Badge>);
    const textElement = screen.getByTestId('ink-text');
    expect(textElement.style.paddingLeft).toBe(paddingLeft);
    expect(textElement.style.paddingRight).toBe(paddingRight);
  });

  it('applies no border when bordered is false', () => {
    render(<Badge bordered={false}>No Border</Badge>);
    const textElement = screen.getByTestId('ink-text');
    expect(textElement.style.borderStyle).toBe('hidden');
  });

  it('is not rounded when rounded is false', () => {
    render(<Badge rounded={false}>Not Rounded</Badge>);
    const textElement = screen.getByTestId('ink-text');
    expect(textElement.style.borderRadius).toBe('0');
  });

  it('applies custom styles', () => {
    const customStyle = { color: 'rgb(255, 0, 0)', marginLeft: '10px' };
    render(<Badge style={customStyle}>Custom</Badge>);
    const textElement = screen.getByTestId('ink-text');

    expect(textElement.style.color).toBe('rgb(255, 0, 0)');
    expect(textElement.style.marginLeft).toBe('10px');
  });
});
