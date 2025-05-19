import { TextProps } from 'ink';

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  text: string;
  textInverse: string;
  textMuted: string;
  background: string;
  backgroundHover: string;
  border: string;
  highlight: string;
  [key: string]: string; // Allow additional color keys
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  [key: string]: number; // Allow additional spacing keys
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  [key: string]: number; // Allow additional radius keys
}

export interface ThemeBox {
  borderStyle: 'single' | 'double' | 'round' | 'single-double' | 'double-single' | 'classic' | 'none';
  padding: number;
  margin: number;
  [key: string]: any; // Allow additional box styles
}

export interface ThemeText {
  bold: (isActive?: boolean) => Partial<TextProps>;
  italic: (isActive?: boolean) => Partial<TextProps>;
  underline: (isActive?: boolean) => Partial<TextProps>;
  dim: (isActive?: boolean) => Partial<TextProps>;
  color: (color: string) => Partial<TextProps>;
  bgColor: (color: string) => Partial<TextProps>;
  [key: string]: any; // Allow additional text utilities
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  borderRadius: ThemeBorderRadius;
  box: ThemeBox;
  text: ThemeText;
  [key: string]: any; // Allow additional theme properties
}

// Text style presets
export interface TextPresets {
  heading: Partial<TextProps>;
  subheading: Partial<TextProps>;
  body: Partial<TextProps>;
  label: Partial<TextProps>;
  caption: Partial<TextProps>;
  button: Partial<TextProps>;
  link: Partial<TextProps>;
  success: Partial<TextProps>;
  warning: Partial<TextProps>;
  error: Partial<TextProps>;
  info: Partial<TextProps>;
  [key: string]: Partial<TextProps>;
}

// Component styles
export interface ComponentStyles {
  button: {
    primary: Partial<TextProps>;
    secondary: Partial<TextProps>;
    success: Partial<TextProps>;
    warning: Partial<TextProps>;
    error: Partial<TextProps>;
    disabled: Partial<TextProps>;
    [key: string]: Partial<TextProps>;
  };
  input: {
    default: Partial<TextProps>;
    focused: Partial<TextProps>;
    disabled: Partial<TextProps>;
    error: Partial<TextProps>;
    [key: string]: Partial<TextProps>;
  };
  [key: string]: any; // Allow additional component styles
}
