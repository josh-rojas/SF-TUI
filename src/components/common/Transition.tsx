import React, { useState, useEffect } from 'react';
import { Box, DOMElement } from 'ink';
import { useTheme } from '../../themes';

type TransitionType = 'fade' | 'slide-left' | 'slide-right' | 'slide-up' | 'slide-down' | 'zoom';

interface TransitionProps {
  children: React.ReactNode;
  type?: TransitionType;
  duration?: number;
  visible?: boolean;
  onComplete?: () => void;
}

export const Transition: React.FC<TransitionProps> = ({
  children,
  type = 'fade',
  duration = 300,
  visible = true,
  onComplete,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const theme = useTheme();

  // Ensure animation steps are smooth
  const ANIMATION_STEPS = 8;
  const ANIMATION_INTERVAL = duration / ANIMATION_STEPS;

  useEffect(() => {
    // Start animation when visibility changes
    if (visible !== isVisible) {
      setIsAnimating(true);
      setAnimationPhase(visible ? 0 : ANIMATION_STEPS);
      
      // Animation timer
      const timer = setInterval(() => {
        setAnimationPhase(prev => {
          const newPhase = visible ? prev + 1 : prev - 1;
          
          // Check if animation is complete
          if ((visible && newPhase >= ANIMATION_STEPS) || (!visible && newPhase <= 0)) {
            setIsAnimating(false);
            setIsVisible(visible);
            clearInterval(timer);
            
            if (onComplete) {
              onComplete();
            }
            
            return visible ? ANIMATION_STEPS : 0;
          }
          
          return newPhase;
        });
      }, ANIMATION_INTERVAL);
      
      return () => clearInterval(timer);
    }
  }, [visible, isVisible, duration, onComplete]);

  // Calculate animation styles based on type and phase
  const getAnimationStyles = () => {
    // Animation progress from 0 to 1
    const progress = animationPhase / ANIMATION_STEPS;
    
    // Fading
    const opacity = type === 'fade' ? (visible ? progress : 1 - progress) : 1;
    
    // Translation
    let transform = {};
    const distance = 10; // Distance to translate in characters
    
    switch (type) {
      case 'slide-left':
        transform = { translateX: visible ? -distance * (1 - progress) : -distance * progress };
        break;
      case 'slide-right':
        transform = { translateX: visible ? distance * (1 - progress) : distance * progress };
        break;
      case 'slide-up':
        transform = { translateY: visible ? distance * (1 - progress) : distance * progress };
        break;
      case 'slide-down':
        transform = { translateY: visible ? -distance * (1 - progress) : -distance * progress };
        break;
      case 'zoom':
        const scale = visible ? 0.5 + (0.5 * progress) : 0.5 + (0.5 * (1 - progress));
        transform = { scale };
        break;
    }
    
    return {
      opacity,
      ...transform,
    };
  };

  // If animation is complete and element is not visible, don't render
  if (!isAnimating && !isVisible) {
    return null;
  }

  // Apply animation styles
  const styles = getAnimationStyles();

  return (
    <Box
      style={{
        opacity: styles.opacity,
        transform: styles.transform,
        transition: `all ${duration}ms`
      }}
    >
      {children}
    </Box>
  );
};

export default Transition;