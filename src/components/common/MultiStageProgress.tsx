import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import EnhancedProgressBar from './EnhancedProgressBar';
import { useTheme } from '../../themes';

interface Stage {
  name: string;
  value: number;
  maxValue: number;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
}

interface MultiStageProgressProps {
  stages: Stage[];
  width?: number;
  showPercentages?: boolean;
  animated?: boolean;
}

export const MultiStageProgress: React.FC<MultiStageProgressProps> = ({
  stages,
  width = 40,
  showPercentages = true,
  animated = true,
}) => {
  const theme = useTheme();
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  
  // Calculate overall progress
  const totalStages = stages.length;
  const completedStages = stages.filter(s => s.status === 'completed').length;
  const overallProgress = Math.round((completedStages / totalStages) * 100);
  
  // Determine the current stage
  useEffect(() => {
    const inProgressIndex = stages.findIndex(s => s.status === 'in_progress');
    if (inProgressIndex !== -1) {
      setCurrentStageIndex(inProgressIndex);
    } else {
      // If no stage is in progress, find the first pending stage
      const pendingIndex = stages.findIndex(s => s.status === 'pending');
      if (pendingIndex !== -1) {
        setCurrentStageIndex(pendingIndex);
      }
    }
  }, [stages]);
  
  // Get status icon and color
  const getStatusIndicator = (status: Stage['status']) => {
    switch (status) {
      case 'completed':
        return { icon: '✓', color: theme.colors.success };
      case 'in_progress':
        return { icon: '●', color: theme.colors.primary };
      case 'error':
        return { icon: '✗', color: theme.colors.error };
      case 'pending':
      default:
        return { icon: '○', color: theme.colors.textMuted };
    }
  };
  
  return (
    <Box flexDirection="column">
      <Box>
        <Text bold>Overall Progress: </Text>
        <Text>{overallProgress}%</Text>
      </Box>
      
      <EnhancedProgressBar 
        value={completedStages}
        maxValue={totalStages}
        width={width}
        showPercentage={false}
        animated={animated}
        colorTransition
        steps={totalStages}
      />
      
      <Box marginY={1}>
        <Text bold>Stages:</Text>
      </Box>
      
      <Box flexDirection="column">
        {stages.map((stage, index) => {
          const { icon, color } = getStatusIndicator(stage.status);
          const isCurrentStage = index === currentStageIndex;
          
          return (
            <Box key={index} flexDirection="column" marginBottom={1}>
              <Box>
                <Text color={color}>{icon} </Text>
                <Text bold={isCurrentStage} color={isCurrentStage ? theme.colors.primary : undefined}>
                  {stage.name}
                </Text>
                
                {showPercentages && stage.status !== 'pending' && (
                  <Text> {Math.round((stage.value / stage.maxValue) * 100)}%</Text>
                )}
              </Box>
              
              {stage.status === 'in_progress' && (
                <Box marginLeft={2} marginTop={0}>
                  <EnhancedProgressBar 
                    value={stage.value}
                    maxValue={stage.maxValue}
                    width={width - 2}
                    showPercentage={false}
                    animated={animated}
                    pulsate={true}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default MultiStageProgress;