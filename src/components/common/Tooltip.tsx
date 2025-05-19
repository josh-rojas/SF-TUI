import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useFocus, useInput } from 'ink';
import { useTheme } from '../../themes';

type TooltipPosition = 'top' | 'right' | 'bottom' | 'left';

type TooltipProps = {
  /**
   * The content that will trigger the tooltip on hover/focus
   */
  children: React.ReactNode;
  
  /**
   * The tooltip content to display
   */
  content: string | React.ReactNode;
  
  /**
   * Position of the tooltip relative to the trigger element
   * @default 'top'
   */
  position?: TooltipPosition;
  
  /**
   * Delay in milliseconds before showing the tooltip
   * @default 300
   */
  delay?: number;
  
  /**
   * Whether the tooltip is disabled
   * @default false
   */
  disabled?: boolean;
  
  /**
   * Additional styles for the tooltip container
   */
  style?: React.CSSProperties;
  
  /**
   * Additional styles for the tooltip content
   */
  contentStyle?: React.CSSProperties;
  
  /**
   * Whether to show an arrow pointing to the trigger element
   * @default true
   */
  showArrow?: boolean;
};

/**
 * A tooltip component that displays additional information on hover or focus
 */
const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 300,
  disabled = false,
  style = {},
  contentStyle = {},
  showArrow = true,
}) => {
  const theme = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDelayed, setIsDelayed] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Handle mouse enter
  const handleMouseEnter = () => {
    if (disabled) return;
    
    setIsHovered(true);
    
    if (delay > 0) {
      setIsDelayed(true);
      timeoutRef.current = setTimeout(() => {
        setIsDelayed(false);
      }, delay);
    } else {
      setIsDelayed(false);
    }
  };
  
  // Handle mouse leave
  const handleMouseLeave = () => {
    setIsHovered(false);
    setIsDelayed(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };
  
  // Handle focus
  const handleFocus = () => {
    if (disabled) return;
    setIsFocused(true);
    setIsDelayed(false);
  };
  
  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
  };
  
  // Update visibility based on hover/focus state
  useEffect(() => {
    setIsVisible((isHovered || isFocused) && !isDelayed);
  }, [isHovered, isFocused, isDelayed]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
  
  // Calculate tooltip position styles
  const getPositionStyles = (): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      position: 'absolute',
      zIndex: 1000,
      backgroundColor: theme.colors.backgroundInverse,
      color: theme.colors.textInverse,
      paddingLeft: 1,
      paddingRight: 1,
      paddingTop: 0,
      paddingBottom: 0,
      borderStyle: 'single',
      borderColor: theme.colors.border,
      ...contentStyle,
    };
    
    const arrowSize = 1;
    const arrow = showArrow ? '▶' : ''; // Simple arrow, can be styled better
    
    switch (position) {
      case 'top':
        return {
          ...baseStyles,
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: arrowSize,
          '::after': {
            content: `'${arrow}'`,
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%) rotate(90deg)',
          },
        };
      case 'right':
        return {
          ...baseStyles,
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: arrowSize,
          '::after': {
            content: `'${arrow}'`,
            position: 'absolute',
            left: `-${arrowSize}`,
            top: '50%',
            transform: 'translateY(-50%) rotate(180deg)',
          },
        };
      case 'bottom':
        return {
          ...baseStyles,
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: arrowSize,
          '::after': {
            content: `'${arrow}'`,
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) rotate(-90deg)',
          },
        };
      case 'left':
        return {
          ...baseStyles,
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: arrowSize,
          '::after': {
            content: `'${arrow}'`,
            position: 'absolute',
            right: `-${arrowSize}`,
            top: '50%',
            transform: 'translateY(-50%)',
          },
        };
      default:
        return baseStyles;
    }
  };
  
  // Don't render anything if disabled
  if (disabled) {
    return <>{children}</>;
  }
  
  return (
    <Box 
      position="relative" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={style}
    >
      <Box 
        onFocus={handleFocus}
        onBlur={handleBlur}
        tabIndex={0} // Make the trigger focusable
      >
        {children}
      </Box>
      
      {isVisible && (
        <Box {...getPositionStyles()}>
          {typeof content === 'string' ? (
            <Text>{content}</Text>
          ) : (
            content
          )}
        </Box>
      )}
    </Box>
  );
};

export default Tooltip;
