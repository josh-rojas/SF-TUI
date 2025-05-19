import React, { useEffect, useState } from 'react';
import { Text } from 'ink';
import { useTheme } from '../../themes';

type SpinnerType = 'dots' | 'line' | 'bounce' | 'arc' | 'arrow' | 'clock' | 'earth' | 'moon' | 'runner' | 'weather';

type SpinnerProps = {
  /**
   * Type of spinner animation
   * @default 'dots'
   */
  type?: SpinnerType;
  
  /**
   * Label to display next to the spinner
   */
  label?: string;
  
  /**
   * Color of the spinner
   * @default theme.colors.primary
   */
  color?: string;
  
  /**
   * Whether the spinner is active
   * @default true
   */
  isActive?: boolean;
  
  /**
   * Speed of the spinner in milliseconds
   * @default 100
   */
  speed?: number;
};

// Spinner frames for different types
const SPINNERS: Record<SpinnerType, string[]> = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  arc: ['◜', '◠', '◝', '◞', '◡', '◟'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  clock: ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'],
  earth: ['🌍', '🌎', '🌏'],
  moon: ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
  runner: ['🚶', '🏃'],
  weather: ['☀️', '☀️', '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️'],
};

/**
 * A loading spinner component with multiple animation styles
 */
const Spinner: React.FC<SpinnerProps> = ({
  type = 'dots',
  label = '',
  color,
  isActive = true,
  speed = 100,
}) => {
  const theme = useTheme();
  const [frame, setFrame] = useState(0);
  const spinnerFrames = SPINNERS[type] || SPINNERS.dots;
  const spinnerColor = color || theme.colors.primary;
  
  // Animate the spinner
  useEffect(() => {
    if (!isActive) return;
    
    const timer = setInterval(() => {
      setFrame((prevFrame) => (prevFrame + 1) % spinnerFrames.length);
    }, speed);
    
    return () => {
      clearInterval(timer);
    };
  }, [isActive, speed, spinnerFrames.length]);
  
  if (!isActive) {
    return null;
  }
  
  return (
    <Text>
      <Text color={spinnerColor}>
        {spinnerFrames[frame]}
      </Text>
      {label && <Text> {label}</Text>}
    </Text>
  );
};

export default Spinner;
