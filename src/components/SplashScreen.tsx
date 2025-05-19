/**
 * @file SplashScreen.tsx
 * @description A decorative splash screen component that displays the SF TUI logo,
 * loading animation, and version information during application startup. This component
 * automatically transitions to the next screen after a specified duration.
 */

import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import chalk from 'chalk';

/**
 * Props for the SplashScreen component
 * 
 * @interface SplashScreenProps
 * @property {() => void} onComplete - Callback triggered when the splash screen completes
 * @property {number} [duration=2000] - Duration in milliseconds to display the splash screen
 */
type SplashScreenProps = {
  /**
   * Callback function called when the splash screen completes
   */
  onComplete: () => void;
  /**
   * Duration in milliseconds to show the splash screen
   * @default 2000
   */
  duration?: number;
};

/**
 * ASCII art logo for the SF TUI application
 * Each string represents a line of the logo
 */
const LOGO = [
  '  _____ ______      _______ _______ ', 
  ' / ____|  ____/\   |__   __|__   __|',
  '| (___ | |__ /  \     | |     | |   ', 
  ' \___ \|  __/ /\ \    | |     | |   ',
  ' ____) | | / ____ \   | |     | |   ', 
  '|_____/|_|/_/    \_\  |_|     |_|   ',
  '                                    ', 
  '   The Salesforce TUI Experience    ',
  '                                    ', 
  '   🚀  Loading... Please wait...    ',
];

/**
 * SplashScreen Component
 * 
 * Displays an animated splash screen with the application logo and a progress bar.
 * The component automatically transitions to the next screen after the specified duration.
 * 
 * @component
 * @param {SplashScreenProps} props - Component props
 * @param {() => void} props.onComplete - Callback when splash screen completes
 * @param {number} [props.duration=2000] - Duration in milliseconds
 * @example
 * <SplashScreen 
 *   onComplete={() => console.log('Splash complete')}
 *   duration={3000}
 * />
 */
export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  onComplete, 
  duration = 2000 
}) => {
  // Component state
  const [show, setShow] = useState(true);
  const [progress, setProgress] = useState(0);
  
  // Animation configuration
  const totalFrames = 10;
  const frameDuration = duration / totalFrames;
  
  /**
   * Handles the completion of the splash screen animation
   * Triggers the onComplete callback and cleans up resources
   */

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      onComplete();
    }, duration);

    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + (100 / totalFrames);
        return next > 100 ? 100 : next;
      });
    }, frameDuration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [duration, frameDuration, onComplete]);

  if (!show) return null;

  return (
    <Box 
      flexDirection="column" 
      alignItems="center" 
      justifyContent="center"
      height="100%"
      marginTop={2}
    >
      <Box flexDirection="column" alignItems="center" marginBottom={2}>
        {LOGO.map((line, i) => (
          <Text key={i} color="cyan" bold>
            {line}
          </Text>
        ))}
      </Box>
      <Box width={40} marginTop={1}>
        <Box 
          width={`${progress}%`} 
          borderStyle="round"
          borderColor="cyan"
          paddingLeft={1}
        >
          <Text>{' '.repeat(2)}</Text>
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text color="gray">
          v{process.env.npm_package_version || '1.0.0'}
        </Text>
      </Box>
    </Box>
  );
};

export default SplashScreen;
