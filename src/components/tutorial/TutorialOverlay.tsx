import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../themes';
import { Transition, CustomBox, Button } from '../common';

interface TutorialStep {
  id: string;
  element: string; // Selector or element identifier
  title: string;
  content: string | React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip: () => void;
  initialStep?: number;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip,
  initialStep = 0,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep);
  const [showStep, setShowStep] = useState(false);
  const theme = useTheme();

  // Control visibility based on active state
  useEffect(() => {
    if (isActive) {
      setShowStep(true);
    } else {
      setShowStep(false);
    }
  }, [isActive]);

  // Get current step
  const currentStep = steps[currentStepIndex];

  // Handle navigation
  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Skip the tutorial
  const handleSkip = () => {
    setShowStep(false);
    setTimeout(() => {
      onSkip();
    }, 300);
  };

  if (!isActive || !currentStep) return null;

  // Calculate progress
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <Transition
      type="fade"
      duration={300}
      visible={showStep}
    >
      <Box 
        position="absolute"
        top={2}
        right={2}
        flexDirection="column"
        width={60}
      >
        <CustomBox
          title={`Tutorial: ${currentStep.title}`}
          borderStyle="round"
          borderColor={theme.colors.primary}
          padding={1}
        >
          <Box flexDirection="column">
            <Box marginBottom={1}>
              {typeof currentStep.content === 'string' ? (
                <Text>{currentStep.content}</Text>
              ) : (
                currentStep.content
              )}
            </Box>
            
            {/* Progress bar */}
            <Box marginY={1}>
              <Text>
                {Array(Math.floor(progress / 5)).fill('█').join('')}
                {Array(20 - Math.floor(progress / 5)).fill('░').join('')}
                {` ${Math.round(progress)}%`}
              </Text>
            </Box>
            
            {/* Navigation buttons */}
            <Box justifyContent="space-between" marginTop={1}>
              <Box>
                {currentStepIndex > 0 && (
                  <Button 
                    label="← Back" 
                    onPress={prevStep} 
                    variant="secondary" 
                    size="small"
                  />
                )}
              </Box>
              
              <Box>
                <Button 
                  label="Skip Tutorial" 
                  onPress={handleSkip} 
                  variant="danger" 
                  size="small"
                />
              </Box>
              
              <Box>
                <Button 
                  label={currentStepIndex < steps.length - 1 ? "Next →" : "Finish"} 
                  onPress={nextStep} 
                  variant="primary" 
                  size="small"
                />
              </Box>
            </Box>
          </Box>
        </CustomBox>
      </Box>
    </Transition>
  );
};

export default TutorialOverlay;