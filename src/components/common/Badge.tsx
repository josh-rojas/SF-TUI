import React from 'react';
import { Text } from 'ink';
import { useTheme } from '../../themes';

type BadgeVariant = 
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'outline';

type BadgeSize = 'sm' | 'md' | 'lg';

type BadgeProps = {
  /**
   * The content to display inside the badge
   */
  children: React.ReactNode;
  
  /**
   * The visual style variant of the badge
   * @default 'default'
   */
  variant?: BadgeVariant;
  
  /**
   * The size of the badge
   * @default 'md'
   */
  size?: BadgeSize;
  
  /**
   * Whether the badge should have a border
   * @default true
   */
  bordered?: boolean;
  
  /**
   * Whether the badge should have rounded corners
   * @default true
   */
  rounded?: boolean;
  
  /**
   * Custom styles for the badge
   */
  style?: React.CSSProperties;
  
  /**
   * Additional class name for the badge
   */
  className?: string;
};

/**
 * A badge component for displaying status, tags, or labels in the TUI
 */
const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  bordered = true,
  rounded = true,
  style = {},
  className = '',
}) => {
  const theme = useTheme();
  
  // Get size-based styles
  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          paddingLeft: 1,
          paddingRight: 1,
          paddingTop: 0,
          paddingBottom: 0,
        };
      case 'lg':
        return {
          paddingLeft: 2,
          paddingRight: 2,
          paddingTop: 1,
          paddingBottom: 1,
        };
      case 'md':
      default:
        return {
          paddingLeft: 1,
          paddingRight: 1,
          paddingTop: 0,
          paddingBottom: 0,
        };
    }
  };
  
  // Get variant-based styles
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'primary':
        return {
          color: theme.colors.primaryForeground,
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.primaryBorder,
        };
      case 'secondary':
        return {
          color: theme.colors.secondaryForeground,
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.secondaryBorder,
        };
      case 'success':
        return {
          color: theme.colors.successForeground,
          backgroundColor: theme.colors.success,
          borderColor: theme.colors.successBorder,
        };
      case 'warning':
        return {
          color: theme.colors.warningForeground,
          backgroundColor: theme.colors.warning,
          borderColor: theme.colors.warningBorder,
        };
      case 'error':
        return {
          color: theme.colors.errorForeground,
          backgroundColor: theme.colors.error,
          borderColor: theme.colors.errorBorder,
        };
      case 'info':
        return {
          color: theme.colors.infoForeground,
          backgroundColor: theme.colors.info,
          borderColor: theme.colors.infoBorder,
        };
      case 'outline':
        return {
          color: theme.colors.text,
          backgroundColor: 'transparent',
          borderColor: theme.colors.border,
        };
      case 'default':
      default:
        return {
          color: theme.colors.text,
          backgroundColor: theme.colors.backgroundHover,
          borderColor: theme.colors.border,
        };
    }
  };
  
  // Combine all styles
  const badgeStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: bordered ? 'single' : 'hidden',
    borderRadius: rounded ? 1 : 0,
    whiteSpace: 'nowrap',
    ...getSizeStyles(),
    ...getVariantStyles(),
    ...style,
  };
  
  return (
    <Text style={badgeStyles} className={className}>
      {children}
    </Text>
  );
};

export default Badge;
