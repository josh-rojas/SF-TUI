import * as React from 'react';
import { Theme as ThemeType } from '../types/theme';

// Re-export the Theme type
export type Theme = ThemeType;

// Base theme with default colors and styles
export const baseTheme: Theme = {
  colors: {
    primary: '#36A9E1', // Salesforce blue
    secondary: '#2E844A', // Salesforce green
    success: '#2E844A', // Green
    warning: '#FE9339', // Orange
    error: '#EA001E', // Red
    info: '#0176D3', // Blue
    text: '#181818', // Dark gray (almost black)
    textInverse: '#FFFFFF', // White
    textMuted: '#706E6B', // Medium gray
    background: '#FFFFFF', // White
    backgroundHover: '#F3F3F3', // Light gray
    border: '#DDDBDA', // Light gray
    highlight: '#F3F2F2', // Very light gray
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  borderRadius: {
    sm: 2,
    md: 4,
    lg: 8,
  },
  box: {
    borderStyle: 'round',
    padding: 1,
    margin: 1,
  },
  text: {
    bold: (isActive = true) => ({
      bold: isActive,
    }),
    italic: (isActive = true) => ({
      italic: isActive,
    }),
    underline: (isActive = true) => ({
      underline: isActive,
    }),
    dim: (isActive = true) => ({
      dimColor: isActive,
    }),
    color: (color: string) => ({
      color,
    }),
    bgColor: (color: string) => ({
      backgroundColor: color,
    }),
  },
};

// Dark theme
export const darkTheme: Theme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    text: '#F3F3F3', // Light gray
    textInverse: '#181818', // Dark gray (almost black)
    textMuted: '#B0ADAB', // Medium-light gray
    background: '#1B1B1B', // Dark gray
    backgroundHover: '#2D2D2D', // Slightly lighter dark gray
    border: '#444444', // Medium-dark gray
    highlight: '#333333', // Dark gray highlight
  },
};

// High contrast theme for better accessibility
export const highContrastTheme: Theme = {
  ...baseTheme,
  colors: {
    primary: '#0067B8', // Darker blue
    secondary: '#0A7C36', // Darker green
    success: '#0A7C36', // Darker green
    warning: '#D83B01', // Darker orange
    error: '#A91B0A', // Darker red
    info: '#0050B3', // Darker blue
    text: '#000000', // Black
    textInverse: '#FFFFFF', // White
    textMuted: '#4D4D4D', // Dark gray
    background: '#FFFFFF', // White
    backgroundHover: '#E5E5E5', // Light gray
    border: '#000000', // Black
    highlight: '#F0F0F0', // Very light gray
  },
};

// Salesforce Lightning theme
export const salesforceTheme: Theme = {
  ...baseTheme,
  colors: {
    primary: '#0176D3', // Salesforce blue
    secondary: '#2E844A', // Salesforce green
    success: '#2E844A', // Green
    warning: '#FE9339', // Orange
    error: '#EA001E', // Red
    info: '#0176D3', // Blue
    text: '#181818', // Dark gray (almost black)
    textInverse: '#FFFFFF', // White
    textMuted: '#706E6B', // Medium gray
    background: '#F3F3F3', // Light gray
    backgroundHover: '#E5E5E5', // Slightly darker gray
    border: '#C9C9C9', // Medium-light gray
    highlight: '#E5E5E5', // Light gray
  },
};

// Get theme by name
export const getTheme = (themeName: string = 'base'): Theme => {
  switch (themeName.toLowerCase()) {
    case 'dark':
      return darkTheme;
    case 'highcontrast':
    case 'high-contrast':
    case 'highContrast':
      return highContrastTheme;
    case 'salesforce':
    case 'lightning':
      return salesforceTheme;
    case 'base':
    default:
      return baseTheme;
  }
};

// Theme context for React components
export const ThemeContext = React.createContext<Theme>(baseTheme);

// Theme provider component
export const ThemeProvider: React.FC<{ theme?: Theme; children: React.ReactNode }> = ({
  theme = baseTheme,
  children,
}) => {
  return React.createElement(ThemeContext.Provider, { value: theme }, children);
};

// Hook to use the current theme
export const useTheme = (): Theme => {
  const theme = React.useContext(ThemeContext);
  return theme || baseTheme;
};
