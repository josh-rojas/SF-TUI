import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';

type DividerVariant = 'horizontal' | 'vertical';
type DividerOrientation = 'left' | 'center' | 'right';

type DividerProps = {
  /**
   * The label to display in the divider (optional)
   */
  label?: string | React.ReactNode;
  
  /**
   * The orientation of the divider
   * @default 'horizontal'
   */
  variant?: DividerVariant;
  
  /**
   * The position of the label (for horizontal dividers only)
   * @default 'center'
   */
  orientation?: DividerOrientation;
  
  /**
   * The character(s) to use for the divider line
   * @default '─' for horizontal, '│' for vertical
   */
  character?: string;
  
  /**
   * The color of the divider line
   * @default theme.colors.border
   */
  color?: string;
  
  /**
   * The color of the label text
   * @default theme.colors.text
   */
  labelColor?: string;
  
  /**
   * Additional styles for the divider container
   */
  style?: React.CSSProperties;
  
  /**
   * Additional styles for the label
   */
  labelStyle?: React.CSSProperties;
  
  /**
   * Additional styles for the line
   */
  lineStyle?: React.CSSProperties;
};

/**
 * A divider component for visually separating content
 */
const Divider: React.FC<DividerProps> = ({
  label,
  variant = 'horizontal',
  orientation = 'center',
  character,
  color,
  labelColor,
  style = {},
  labelStyle = {},
  lineStyle = {},
}) => {
  const theme = useTheme();
  
  // Default characters for divider
  const defaultCharacter = variant === 'horizontal' ? '─' : '│';
  const dividerChar = character || defaultCharacter;
  
  // Default colors
  const dividerColor = color || theme.colors.border;
  const textColor = labelColor || theme.colors.text;
  
  // Render a horizontal divider
  const renderHorizontalDivider = () => {
    if (!label) {
      return (
        <Box>
          <Text color={dividerColor} style={lineStyle}>
            {dividerChar.repeat(process.stdout.columns || 40)}
          </Text>
        </Box>
      );
    }
    
    // Calculate available width for the divider
    const availableWidth = process.stdout.columns || 80;
    const labelText = typeof label === 'string' ? label : '';
    const labelLength = labelText.length;
    const lineLength = Math.max(2, Math.floor((availableWidth - labelLength - 2) / 2));
    
    const leftLine = dividerChar.repeat(lineLength);
    const rightLine = dividerChar.repeat(lineLength);
    
    let content;
    
    switch (orientation) {
      case 'left':
        content = (
          <>
            <Text color={dividerColor} style={lineStyle}>
              {dividerChar.repeat(2)}
            </Text>
            <Text color={textColor} style={labelStyle}>
              {' '}{label}{' '}
            </Text>
            <Text color={dividerColor} style={lineStyle}>
              {dividerChar.repeat(availableWidth - labelLength - 6)}
            </Text>
          </>
        );
        break;
      case 'right':
        content = (
          <>
            <Text color={dividerColor} style={lineStyle}>
              {dividerChar.repeat(availableWidth - labelLength - 6)}
            </Text>
            <Text color={textColor} style={labelStyle}>
              {' '}{label}{' '}
            </Text>
            <Text color={dividerColor} style={lineStyle}>
              {dividerChar.repeat(2)}
            </Text>
          </>
        );
        break;
      case 'center':
      default:
        content = (
          <>
            <Text color={dividerColor} style={lineStyle}>
              {leftLine}
            </Text>
            <Text color={textColor} style={labelStyle}>
              {' '}{label}{' '}
            </Text>
            <Text color={dividerColor} style={lineStyle}>
              {rightLine}
            </Text>
          </>
        );
    }
    
    return (
      <Box>
        {content}
      </Box>
    );
  };
  
  // Render a vertical divider
  const renderVerticalDivider = () => {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center">
        <Text color={dividerColor} style={lineStyle}>
          {dividerChar}
        </Text>
        {label && (
          <Text color={textColor} style={labelStyle}>
            {label}
          </Text>
        )}
      </Box>
    );
  };
  
  return (
    <Box 
      style={style}
      flexDirection={variant === 'horizontal' ? 'row' : 'column'}
      alignItems="center"
      justifyContent="center"
      width={variant === 'horizontal' ? '100%' : undefined}
      height={variant === 'vertical' ? '100%' : undefined}
    >
      {variant === 'horizontal' ? renderHorizontalDivider() : renderVerticalDivider()}
    </Box>
  );
};

export default Divider;
