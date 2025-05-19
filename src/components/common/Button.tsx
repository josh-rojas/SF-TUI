import React, { useCallback } from 'react';
import { Text, useFocus, useInput, Box } from 'ink';
import { useTheme } from '../../themes';
import { 
  ButtonVariant, 
  getButtonColorScheme, 
  getButtonStyles, 
  getButtonTextStyles 
} from '../../themes/buttonStyles';

type ButtonProps = {
  /**
   * Button text to display
   */
  children: React.ReactNode;
  
  /**
   * Button variant that determines the color scheme
   * @default 'default'
   */
  variant?: ButtonVariant;
  
  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Whether the button should take up the full width of its container
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Whether the button should show a loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Whether the button should be focusable
   * @default true
   */
  focusable?: boolean;
  
  /**
   * Callback when the button is clicked or activated with keyboard
   */
  onPress?: () => void;
  
  /**
   * Additional styles to apply to the button
   */
  style?: React.CSSProperties;
  
  /**
   * Additional props to pass to the underlying Box component
   */
  boxProps?: React.ComponentProps<typeof Box>;
};

/**
 * A customizable button component for the TUI
 */
const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'default',
  disabled = false,
  fullWidth = false,
  loading = false,
  focusable = true,
  onPress,
  style = {},
  boxProps = {},
}) => {
  const theme = useTheme();
  const { isFocused } = useFocus({ 
    isActive: focusable && !disabled && !loading, 
    autoFocus: false 
  });
  
  // Handle button press (click or enter/space)
  useInput(
    (input, key) => {
      if ((input === ' ' || key.return) && onPress && !disabled && !loading) {
        onPress();
      }
    },
    { isActive: focusable && !disabled && !loading }
  );
  
  // Get button color scheme from theme
  const colorScheme = getButtonColorScheme(theme, variant);
  
  // Get computed styles based on state
  const buttonStyles = getButtonStyles(
    colorScheme,
    isFocused,
    disabled,
    loading,
    style
  );
  
  const textStyles = getButtonTextStyles(
    colorScheme,
    isFocused,
    disabled,
    loading
  );
  
  return (
    <Box
      {...boxProps}
      width={fullWidth ? '100%' : boxProps.width}
      flexGrow={fullWidth ? 1 : boxProps.flexGrow}
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      style={buttonStyles}
    >
      {loading ? (
        <Text {...textStyles}>
          <Text>⏳ </Text>
          <Text>Loading...</Text>
        </Text>
      ) : (
        <Text {...textStyles}>
          {isFocused && '> '}
          {children}
          {isFocused && ' <'}
        </Text>
      )}
    </Box>
  );
};

export default Button;