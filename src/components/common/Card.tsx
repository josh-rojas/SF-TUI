import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';

type CardVariant = 'default' | 'outline' | 'filled' | 'elevated';

type CardProps = {
  /**
   * The content of the card
   */
  children: React.ReactNode;
  
  /**
   * The title of the card (optional)
   */
  title?: string | React.ReactNode;
  
  /**
   * The footer content of the card (optional)
   */
  footer?: string | React.ReactNode;
  
  /**
   * The visual style variant of the card
   * @default 'default'
   */
  variant?: CardVariant;
  
  /**
   * Whether the card is hoverable
   * @default false
   */
  hoverable?: boolean;
  
  /**
   * Whether the card is selected
   * @default false
   */
  selected?: boolean;
  
  /**
   * Whether the card is clickable
   * @default false
   */
  clickable?: boolean;
  
  /**
   * Callback when the card is clicked
   */
  onClick?: () => void;
  
  /**
   * Additional styles for the card container
   */
  style?: React.CSSProperties;
  
  /**
   * Additional styles for the card header
   */
  headerStyle?: React.CSSProperties;
  
  /**
   * Additional styles for the card body
   */
  bodyStyle?: React.CSSProperties;
  
  /**
   * Additional styles for the card footer
   */
  footerStyle?: React.CSSProperties;
  
  /**
   * Padding around the card content
   * @default 1
   */
  padding?: number;
  
  /**
   * Border radius of the card
   * @default 1
   */
  borderRadius?: number;
};

/**
 * A card component for displaying content in a contained, visually distinct area
 */
const Card: React.FC<CardProps> = ({
  children,
  title,
  footer,
  variant = 'default',
  hoverable = false,
  selected = false,
  clickable = false,
  onClick,
  style = {},
  headerStyle = {},
  bodyStyle = {},
  footerStyle = {},
  padding = 1,
  borderRadius = 1,
}) => {
  const theme = useTheme();
  
  // Handle click events
  const handleClick = () => {
    if (clickable && onClick) {
      onClick();
    }
  };
  
  // Get variant styles
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'outline':
        return {
          borderStyle: 'single',
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: 'transparent',
        };
      case 'filled':
        return {
          borderStyle: 'single',
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: theme.colors.backgroundHover,
        };
      case 'elevated':
        return {
          borderStyle: 'single',
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          borderLeft: 'single',
          borderRight: 'single',
          borderBottom: 'single',
          borderTop: 'single',
          shadow: true,
        };
      case 'default':
      default:
        return {
          borderStyle: 'single',
          borderColor: selected ? theme.colors.primary : theme.colors.border,
          backgroundColor: theme.colors.background,
        };
    }
  };
  
  // Get hover styles
  const getHoverStyles = (): React.CSSProperties => {
    if (!hoverable && !clickable) return {};
    
    return {
      borderColor: theme.colors.primary,
      cursor: clickable ? 'pointer' : 'default',
    };
  };
  
  // Render the title
  const renderTitle = () => {
    if (!title) return null;
    
    return (
      <Box
        borderBottomStyle="single"
        borderColor={theme.colors.border}
        paddingX={padding}
        paddingY={0.5}
        style={{
          ...headerStyle,
        }}
      >
        {typeof title === 'string' ? (
          <Text bold>{title}</Text>
        ) : (
          title
        )}
      </Box>
    );
  };
  
  // Render the footer
  const renderFooter = () => {
    if (!footer) return null;
    
    return (
      <Box
        borderTopStyle="single"
        borderColor={theme.colors.border}
        paddingX={padding}
        paddingY={0.5}
        style={{
          ...footerStyle,
        }}
      >
        {typeof footer === 'string' ? (
          <Text>{footer}</Text>
        ) : (
          footer
        )}
      </Box>
    );
  };
  
  // Base card styles
  const cardStyles: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    borderRadius,
    overflow: 'hidden',
    ...getVariantStyles(),
    ...(hoverable || clickable ? {
      ':hover': getHoverStyles(),
    } : {}),
    ...style,
  };
  
  // Body styles
  const bodyStyles: React.CSSProperties = {
    padding,
    ...bodyStyle,
  };
  
  return (
    <Box 
      style={cardStyles}
      onClick={handleClick}
      flexDirection="column"
    >
      {renderTitle()}
      <Box style={bodyStyles}>
        {children}
      </Box>
      {renderFooter()}
    </Box>
  );
};

export default Card;
