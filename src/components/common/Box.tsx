import React from 'react';
import { Box as InkBox, Text, useFocus, useInput } from 'ink';
import type { BoxProps as InkBoxProps } from 'ink';
import { useTheme } from '../../themes';
import { TextProps } from 'ink';

type BorderStyle = 'single' | 'double' | 'round' | 'single-double' | 'double-single' | 'classic' | 'none';

type BoxProps = {
  title?: string;
  titleAlign?: 'left' | 'center' | 'right';
  borderStyle?: BorderStyle;
  borderColor?: string;
  padding?: number;
  margin?: number;
  width?: number | string;
  height?: number | string;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string | number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  children: React.ReactNode;
  focusable?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  onClick?: () => void;
  style?: React.CSSProperties;
};

const borderMap: Record<BorderStyle, [string, string, string, string, string, string, string, string]> = {
  single: ['┌', '┐', '└', '┘', '─', '│', '├', '┤'],
  double: ['╔', '╗', '╚', '╝', '═', '║', '╠', '╣'],
  round: ['╭', '╮', '╰', '╯', '─', '│', '├', '┤'],
  'single-double': ['╓', '╖', '╙', '╜', '─', '║', '╟', '╢'],
  'double-single': ['╒', '╕', '╘', '╛', '═', '│', '╞', '╡'],
  classic: ['+', '+', '+', '+', '-', '|', '+', '+'],
  none: [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
};

export const CustomBox: React.FC<BoxProps> = ({
  title,
  titleAlign = 'left',
  borderStyle = 'single',
  borderColor,
  padding = 1,
  margin = 0,
  width,
  height,
  flexDirection = 'column',
  flexGrow,
  flexShrink,
  flexBasis,
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  children,
  focusable = false,
  onFocus,
  onBlur,
  onClick,
  style = {},
}) => {
  const theme = useTheme();
  const { isFocused } = useFocus({ isActive: focusable, autoFocus: false });
  
  // Handle click events
  useInput((input, key) => {
    if (focusable && isFocused && (input === ' ' || key.return) && onClick) {
      onClick();
    }
  }, { isActive: focusable });
  
  // Determine border characters based on style
  const [tl, tr, bl, br, h, v, l, r] = borderMap[borderStyle] || borderMap.single;
  
  // Calculate border color
  const borderColorValue = borderColor || (isFocused ? theme.colors.primary : theme.colors.border);
  
  // Calculate content width based on children
  const calculateContentWidth = () => {
    if (typeof width === 'number') {
      return width - 2; // Adjust for borders
    }
    
    if (typeof width === 'string') {
      // Handle percentage widths or other string formats
      return width;
    }
    
    // Estimate content width based on children
    // This is a simplified approach; in a real app, you'd measure actual content
    const childrenText = React.Children.toArray(children)
      .map(child => {
        if (typeof child === 'string') return child;
        if (typeof child === 'number') return String(child);
        return '';
      })
      .join('');
    
    // Get maximum line length
    const lines = childrenText.split('\n');
    const maxLineLength = lines.reduce((max, line) => 
      Math.max(max, line.length), 0);
    
    // Return dynamic width with minimum of 30
    return Math.max(30, maxLineLength + padding * 2);
  };
  
  const contentWidth = calculateContentWidth();
  
  // Calculate title position
  const renderTitle = () => {
    if (!title) return null;
    
    const titleText = ` ${title} `;
    const titleWidth = titleText.length;
    
    let titlePosition = 2; // Default left padding
    const boxWidth = typeof contentWidth === 'number' ? contentWidth : 30;
    
    if (titleAlign === 'center') {
      titlePosition = Math.max(2, Math.floor((boxWidth - titleWidth) / 2));
    } else if (titleAlign === 'right') {
      titlePosition = Math.max(2, boxWidth - titleWidth - 2);
    }
    
    return (
      <Text>
        {h.repeat(titlePosition)}
        <Text bold color={isFocused ? theme.colors.primary : theme.colors.text}>
          {titleText}
        </Text>
        {h.repeat(Math.max(0, boxWidth - titlePosition - titleWidth))}
      </Text>
    );
  };
  
  // Calculate content padding
  const contentPadding = typeof padding === 'number' ? 
    { left: padding, right: padding, top: padding, bottom: padding } :
    { left: 0, right: 0, top: 0, bottom: 0, ...padding };
  
  // Calculate margin
  const marginStyle = typeof margin === 'number' ? 
    { marginLeft: margin, marginRight: margin, marginTop: margin, marginBottom: margin } :
    { marginLeft: 0, marginRight: 0, marginTop: 0, marginBottom: 0, ...margin };
  
  // Calculate border styles
  const borderStyles: React.CSSProperties = {
    borderStyle: 'solid',
    borderColor: borderColorValue,
    borderLeft: isFocused ? `1 ${theme.colors.primary}` : `1 ${theme.colors.border}`,
    borderRight: isFocused ? `1 ${theme.colors.primary}` : `1 ${theme.colors.border}`,
    borderTop: isFocused ? `1 ${theme.colors.primary}` : `1 ${theme.colors.border}`,
    borderBottom: isFocused ? `1 ${theme.colors.primary}` : `1 ${theme.colors.border}`,
    ...style,
  };
  
  return (
    <InkBox 
      flexDirection="column" 
      width={width}
      height={height}
      flexGrow={flexGrow}
      flexShrink={flexShrink}
      flexBasis={flexBasis}
      {...marginStyle}
    >
      {/* Top border with title */}
      <Text>
        <Text color={borderColorValue}>{tl}</Text>
        {title ? renderTitle() : <Text color={borderColorValue}>{h.repeat(typeof contentWidth === 'number' ? contentWidth : 30)}</Text>}
        <Text color={borderColorValue}>{tr}</Text>
      </Text>
      
      {/* Content */}
      <InkBox 
        flexDirection={flexDirection}
        alignItems={alignItems}
        justifyContent={justifyContent}
        paddingLeft={contentPadding.left}
        paddingRight={contentPadding.right}
        paddingTop={contentPadding.top}
        paddingBottom={contentPadding.bottom}
      >
        {children}
      </InkBox>
      
      {/* Bottom border */}
      <Text>
        <Text color={borderColorValue}>{bl}</Text>
        <Text color={borderColorValue}>{h.repeat(typeof contentWidth === 'number' ? contentWidth : 30)}</Text>
        <Text color={borderColorValue}>{br}</Text>
      </Text>
    </InkBox>
  );
};

// BorderBox is a variant of CustomBox used for Tables and other components
export const BorderBox: React.FC<BoxProps> = (props) => {
  return <CustomBox {...props} />;
};

export default CustomBox;
