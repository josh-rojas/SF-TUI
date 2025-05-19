import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';

type ProgressBarVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'primary' | 'secondary';

type ProgressBarProps = {
  /**
   * Current progress value (0-100)
   */
  value: number;
  
  /**
   * Total value (100 if not specified)
   * @default 100
   */
  total?: number;
  
  /**
   * Width of the progress bar in characters
   * @default 50
   */
  width?: number;
  
  /**
   * Whether to show the percentage
   * @default true
   */
  showPercentage?: boolean;
  
  /**
   * Whether to show the value and total
   * @default false
   */
  showValue?: boolean;
  
  /**
   * Custom label to display
   */
  label?: string;
  
  /**
   * Visual style variant
   * @default 'default'
   */
  variant?: ProgressBarVariant;
  
  /**
   * Character to use for the filled portion of the bar
   * @default '█'
   */
  filledChar?: string;
  
  /**
   * Character to use for the unfilled portion of the bar
   * @default '░'
   */
  unfilledChar?: string;
  
  /**
   * Additional styles for the progress bar container
   */
  style?: React.CSSProperties;
};

/**
 * A customizable progress bar component for the TUI
 */
const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  total = 100,
  width = 50,
  showPercentage = true,
  showValue = false,
  label,
  variant = 'default',
  filledChar = '█',
  unfilledChar = '░',
  style = {},
}) => {
  const theme = useTheme();
  
  // Calculate the percentage and ensure it's within bounds
  const percentage = useMemo(() => {
    return Math.min(100, Math.max(0, (value / total) * 100));
  }, [value, total]);
  
  // Calculate the number of filled and unfilled characters
  const filledWidth = Math.round((percentage / 100) * width);
  const unfilledWidth = width - filledWidth;
  
  // Generate the progress bar string
  const progressBar = useMemo(() => {
    const filled = filledChar.repeat(filledWidth);
    const unfilled = unfilledChar.repeat(unfilledWidth);
    return `${filled}${unfilled}`;
  }, [filledWidth, unfilledWidth, filledChar, unfilledChar]);
  
  // Get the color based on the variant
  const color = useMemo(() => {
    const colors = {
      default: theme.colors.text,
      primary: theme.colors.primary,
      secondary: theme.colors.secondary,
      success: theme.colors.success,
      warning: theme.colors.warning,
      error: theme.colors.error,
      info: theme.colors.info,
    };
    
    return colors[variant] || colors.default;
  }, [variant, theme]);
  
  // Format the value for display
  const formattedValue = useMemo(() => {
    if (!showValue) return null;
    return ` ${value}/${total}`;
  }, [value, total, showValue]);
  
  // Format the percentage for display
  const formattedPercentage = useMemo(() => {
    if (!showPercentage) return null;
    return ` ${percentage.toFixed(1)}%`;
  }, [percentage, showPercentage]);
  
  return (
    <Box flexDirection="column" style={style}>
      {(label || showValue || showPercentage) && (
        <Box marginBottom={1}>
          {label && <Text>{label}: </Text>}
          <Text color={color} bold>
            {formattedValue}
            {formattedPercentage}
          </Text>
        </Box>
      )}
      <Box>
        <Text color={color}>
          {progressBar}
        </Text>
      </Box>
    </Box>
  );
};

export default ProgressBar;
