import { Theme } from '.';

export interface ButtonColorScheme {
  text: string;
  background: string;
  border: string;
  hoverText: string;
  hoverBackground: string;
  activeBackground: string;
  disabledText: string;
  disabledBackground: string;
  disabledBorder: string;
}

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'default';

/**
 * Generate button color schemes based on theme and variant
 */
export const getButtonColorScheme = (
  theme: Theme,
  variant: ButtonVariant
): ButtonColorScheme => {
  // Default color scheme
  const defaultColorScheme: ButtonColorScheme = {
    text: theme.colors.text,
    background: theme.colors.background,
    border: theme.colors.border,
    hoverText: theme.colors.text,
    hoverBackground: theme.colors.backgroundHover,
    activeBackground: theme.colors.highlight,
    disabledText: theme.colors.textMuted,
    disabledBackground: theme.colors.background,
    disabledBorder: theme.colors.border,
  };

  // Color schemes for each variant
  const colorSchemes: Record<ButtonVariant, ButtonColorScheme> = {
    default: defaultColorScheme,
    primary: createColorScheme(theme.colors.primary),
    secondary: createColorScheme(theme.colors.secondary),
    success: createColorScheme(theme.colors.success),
    warning: createColorScheme(theme.colors.warning),
    error: createColorScheme(theme.colors.error),
    info: createColorScheme(theme.colors.info),
  };

  return colorSchemes[variant] || defaultColorScheme;

  // Helper function to create color schemes for non-default variants
  function createColorScheme(baseColor: string): ButtonColorScheme {
    return {
      text: theme.colors.textInverse,
      background: baseColor,
      border: baseColor,
      hoverText: theme.colors.textInverse,
      hoverBackground: baseColor,
      activeBackground: baseColor,
      disabledText: theme.colors.textInverse,
      disabledBackground: theme.colors.textMuted,
      disabledBorder: theme.colors.textMuted,
    };
  }
};

/**
 * Generate button styles based on state
 */
export const getButtonStyles = (
  colorScheme: ButtonColorScheme,
  isFocused: boolean,
  isDisabled: boolean,
  isLoading: boolean,
  customStyle: React.CSSProperties = {}
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    paddingLeft: 2,
    paddingRight: 2,
    paddingTop: 0,
    paddingBottom: 0,
    height: 3,
    minWidth: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'single',
    borderColor: colorScheme.border,
    backgroundColor: colorScheme.background,
    ...customStyle,
  };
  
  if (isDisabled || isLoading) {
    return {
      ...baseStyles,
      borderColor: colorScheme.disabledBorder,
      backgroundColor: colorScheme.disabledBackground,
      opacity: 0.7,
    };
  }
  
  if (isFocused) {
    return {
      ...baseStyles,
      backgroundColor: colorScheme.hoverBackground,
      borderColor: colorScheme.border,
      borderStyle: 'double',
    };
  }
  
  return baseStyles;
};

/**
 * Generate text styles based on button state
 */
export const getButtonTextStyles = (
  colorScheme: ButtonColorScheme,
  isFocused: boolean,
  isDisabled: boolean,
  isLoading: boolean
): React.CSSProperties => {
  const baseStyles: React.CSSProperties = {
    color: colorScheme.text,
  };
  
  if (isDisabled || isLoading) {
    return {
      ...baseStyles,
      color: colorScheme.disabledText,
    };
  }
  
  if (isFocused) {
    return {
      ...baseStyles,
      color: colorScheme.hoverText,
      bold: true,
    };
  }
  
  return baseStyles;
};