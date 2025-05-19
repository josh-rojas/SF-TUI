import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';

interface ProgressBarProps {
  value: number;
  width?: number;
  maxValue?: number;
  label?: string;
  showPercentage?: boolean;
  filledChar?: string;
  unfilledChar?: string;
  color?: string;
  backgroundColor?: string;
  animated?: boolean;
  colorTransition?: boolean;
  steps?: number;
  pulsate?: boolean;
}

export const EnhancedProgressBar: React.FC<ProgressBarProps> = ({
  value,
  width = 30,
  maxValue = 100,
  label,
  showPercentage = true,
  filledChar = '█',
  unfilledChar = '░',
  color,
  backgroundColor,
  animated = false,
  colorTransition = false,
  steps = 0,
  pulsate = false,
}) => {
  const theme = useTheme();
  const [animatedValue, setAnimatedValue] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);
  
  // Normalize value to ensure it's between 0 and maxValue
  const normalizedValue = Math.max(0, Math.min(value, maxValue));
  const percentage = Math.round((normalizedValue / maxValue) * 100);
  
  // Animation effect
  useEffect(() => {
    if (animated) {
      // If the value changed, animate to the new value
      const animationStep = (normalizedValue - animatedValue) / 10;
      if (Math.abs(normalizedValue - animatedValue) > 0.5) {
        const timer = setTimeout(() => {
          setAnimatedValue(prev => prev + animationStep);
        }, 20);
        return () => clearTimeout(timer);
      } else {
        setAnimatedValue(normalizedValue);
      }
    } else {
      setAnimatedValue(normalizedValue);
    }
  }, [normalizedValue, animated, animatedValue]);
  
  // Pulsate effect
  useEffect(() => {
    if (pulsate) {
      const timer = setInterval(() => {
        setPulsePhase(prev => (prev + 1) % 20);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [pulsate]);
  
  // Calculate the number of filled and unfilled characters
  const displayValue = animated ? animatedValue : normalizedValue;
  const filledWidth = Math.round((displayValue / maxValue) * width);
  const unfilledWidth = width - filledWidth;
  
  // Determine colors based on progress
  let barColor = color || theme.colors.primary;
  const bgColor = backgroundColor || theme.colors.backgroundHover;
  
  if (colorTransition) {
    if (percentage < 30) {
      barColor = theme.colors.error;
    } else if (percentage < 70) {
      barColor = theme.colors.warning;
    } else {
      barColor = theme.colors.success;
    }
  }
  
  // Apply pulsation effect
  const pulseOffset = pulsate ? Math.sin(pulsePhase * Math.PI / 10) * 2 : 0;
  const pulseAdjustedWidth = Math.max(0, filledWidth + Math.round(pulseOffset));
  
  // Generate the progress bar string
  const bar = 
    (pulseAdjustedWidth > 0 ? filledChar.repeat(pulseAdjustedWidth) : '') +
    (width - pulseAdjustedWidth > 0 ? unfilledChar.repeat(width - pulseAdjustedWidth) : '');
  
  // Generate step markers if requested
  let stepMarkers = '';
  if (steps > 0) {
    const stepSize = width / steps;
    for (let i = 1; i < steps; i++) {
      const pos = Math.floor(i * stepSize);
      stepMarkers += ' '.repeat(pos - stepMarkers.length) + '|';
    }
    stepMarkers += ' '.repeat(width - stepMarkers.length);
  }
  
  return (
    <Box flexDirection="column">
      {label && (
        <Box justifyContent="space-between">
          <Text bold>{label}</Text>
          {showPercentage && (
            <Text> {percentage}%</Text>
          )}
        </Box>
      )}
      
      <Box flexDirection="column">
        <Text color={barColor} backgroundColor={bgColor}>{bar}</Text>
        
        {steps > 0 && (
          <Text color="gray">{stepMarkers}</Text>
        )}
        
        {!label && showPercentage && (
          <Text> {percentage}%</Text>
        )}
      </Box>
    </Box>
  );
};

export default EnhancedProgressBar;